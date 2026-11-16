import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  HistoricalEra,
  SapiensLandscape,
  SimInteractionPrompt,
  SimProductType,
  SimRackState,
  SimCheckoutState,
} from '../../types/game';
import { SIM_CATALOG, SIM_EXPANSIONS, isPlacementValid } from '../rules';
import { soundEngine } from '../audio';

export interface World3DControls {
  forward?: boolean;
  backward?: boolean;
  left?: boolean;
  right?: boolean;
  sprint?: boolean;
  jump?: boolean;
  turnLeft?: boolean;
  turnRight?: boolean;
}

interface DockCrateEntity {
  id: string;
  productType: SimProductType;
  units: number;
  x: number;
  z: number;
  mesh: THREE.Group;
}

interface RackEntity extends SimRackState {
  mesh: THREE.Group;
  stockMeshes: THREE.Object3D[];
}

interface CustomerEntity {
  id: string;
  name: string;
  tribe: string;
  state: 'entering' | 'browsing' | 'queuing' | 'leaving';
  targetRackId: string | null;
  targetX: number;
  targetZ: number;
  basket: { productType: SimProductType; qty: number; unitPrice: number }[];
  waitTimer: number;
  mesh: THREE.Group;
}

interface HazardEntity {
  id: string;
  type: 'boulder' | 'predator';
  baseX: number;
  baseZ: number;
  x: number;
  z: number;
  phase: number;
  mesh: THREE.Group;
}

interface ForageNodeEntity {
  id: string;
  productType: 'berries' | 'flint';
  x: number;
  z: number;
  cooldown: number;
  mesh: THREE.Group;
}

export interface World3DCallbacks {
  onPromptChange?: (prompt: SimInteractionPrompt | null) => void;
  onCarriedChange?: (carried: { productType: SimProductType; units: number } | null) => void;
  onDockCountChange?: (count: number) => void;
  onRacksUpdate?: (racks: SimRackState[]) => void;
  onQueueChange?: (queueLen: number, frontCheckout: SimCheckoutState | null) => void;
  onTradeCompleted?: (checkout: SimCheckoutState) => void;
  onCratePickedUp?: (productType: SimProductType, units: number) => void;
  onRackStocked?: (productType: SimProductType, unitsAdded: number) => void;
  onForageCollected?: (productType: 'berries' | 'flint') => void;
  onRackPlaced?: (x: number, z: number, rotationY: number, productType: SimProductType) => void;
  onOpenTerminal?: () => void;
  onBump?: (hazardType: 'boulder' | 'predator', bumpNumber: number, isSecondBump: boolean) => void;
  onRespawn?: () => void;
  onFeedMessage?: (text: string, tone: 'good' | 'warn' | 'myth') => void;
  onMythTrigger?: (amount: number) => void;
}

const CUSTOMER_NAMES = [
  { name: 'Kael', tribe: 'River Clan' },
  { name: 'Naya', tribe: 'Ochre Band' },
  { name: 'Turok', tribe: 'Canyon Tribe' },
  { name: 'Sera', tribe: 'Lily Foragers' },
  { name: 'Orin', tribe: 'Flint Knappers' },
  { name: 'Lira', tribe: 'Dawn Singers' },
];

export class World3D {
  public container: HTMLElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;

  private isSoftwareGl: boolean = false;
  private animFrameId: number = 0;
  private isTitleMode: boolean = true;
  private currentLandscape: SapiensLandscape = 'river_meadow';
  private expansionTier: number = 1;
  private isCampOpen: boolean = true;
  private firstPerson: boolean = false;

  // Player Movement & State
  private playerX: number = 0;
  private playerY: number = 0;
  private playerZ: number = 2.5;
  private playerVelY: number = 0;
  private playerYaw: number = Math.PI; // Facing -Z (into camp)
  private camYaw: number = 0;
  private camPitch: number = 0.42;
  private isJumping: boolean = false;
  private bumpCount: number = 0;
  private respawnInvulnTimer: number = 0;
  private bumpCooldownTimer: number = 0;
  private cameraShakeTimer: number = 0;
  private walkPhase: number = 0;

  // Player 3D Group
  private playerGroup: THREE.Group = new THREE.Group();
  private leftLegMesh: THREE.Mesh | null = null;
  private rightLegMesh: THREE.Mesh | null = null;
  private leftArmMesh: THREE.Mesh | null = null;
  private rightArmMesh: THREE.Mesh | null = null;
  private carriedBoxMesh: THREE.Group | null = null;
  private invulnRingMesh: THREE.Mesh | null = null;

  // Carried & Placement State
  private carriedCrate: { productType: SimProductType; units: number } | null = null;
  private placementMode: { productType: SimProductType; rackCost: number } | null = null;
  private placementRotationY: number = 0;
  private placementPreviewMesh: THREE.Group | null = null;
  private placementPreviewValid: boolean = false;

  // Simulator World Entities
  private dockCrates: DockCrateEntity[] = [];
  private racks: RackEntity[] = [];
  private customers: CustomerEntity[] = [];
  private forageNodes: ForageNodeEntity[] = [];
  private hazards: HazardEntity[] = [];
  private prices: Record<SimProductType, number> = {
    berries: SIM_CATALOG.berries.baseBarterPrice,
    flint: SIM_CATALOG.flint.baseBarterPrice,
    wheat: SIM_CATALOG.wheat.baseBarterPrice,
    ivory: SIM_CATALOG.ivory.baseBarterPrice,
  };

  // Staff NPCs
  private restockerHired: boolean = false;
  private restockerMesh: THREE.Group | null = null;
  private restockerTask: { phase: 'to_dock' | 'to_rack' | 'idle'; crate?: DockCrateEntity; rack?: RackEntity; carried?: { productType: SimProductType; units: number } } = { phase: 'idle' };
  private bartererHired: boolean = false;
  private bartererMesh: THREE.Group | null = null;
  private bartererTimer: number = 0;

  // Timers
  private customerSpawnTimer: number = 2.0;
  private promptSyncTimer: number = 0;
  private lastPromptKey: string = '';

  // Environment Groups & Lights
  private environmentGroup: THREE.Group = new THREE.Group();
  private campfireFlameMesh: THREE.Mesh | null = null;
  private firePointLight: THREE.PointLight | null = null;
  private sunLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private borderRingMesh: THREE.Mesh | null = null;

  // Weather & Animal Migrations
  private currentWeather: 'clear_sun' | 'rain' | 'storm' | 'mist' = 'clear_sun';
  private weatherActive: boolean = false;
  private rainParticles: THREE.Points | null = null;
  private lightningTimer: number = 0;
  private nextLightningTime: number = 5.0;
  private migratingHerdGroup: THREE.Group = new THREE.Group();
  private activeAnimalMigration: 'mammoths' | 'gazelles' | null = null;

  // Myth Surge GLSL Shader & Soft Ember Particle Vortex
  private mythSurgeIntensity: number = 0;
  private mythSurgeParticles: THREE.Points | null = null;
  private mythParticleShaderMat: THREE.ShaderMaterial | null = null;
  private mythSurgeShockwaveMesh: THREE.Mesh | null = null;
  private mythSurgeShaderMat: THREE.ShaderMaterial | null = null;
  private mythSurgeShockwaveRadius: number = 0;
  private mythSurgeParticleCount = 135;
  private mythParticlePositions!: Float32Array;
  private mythParticleMeta: { angle: number; radius: number; speedY: number; spin: number }[] = [];

  // Mouse Drag Orbit
  private isDraggingCamera: boolean = false;
  private lastPointerX: number = 0;
  private lastPointerY: number = 0;

  // Callbacks
  private callbacks: World3DCallbacks = {};

  constructor(container: HTMLElement, callbacks?: World3DCallbacks) {
    this.container = container;
    if (callbacks) this.callbacks = callbacks;

    // 1. Software WebGL detection
    this.isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    // 2. Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(
      container.clientWidth || window.innerWidth,
      container.clientHeight || window.innerHeight
    );
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 3. Scene & Fog
    this.scene = new THREE.Scene();
    const skyColor = 0xa3c8b4;
    this.scene.background = new THREE.Color(skyColor);
    this.scene.fog = new THREE.FogExp2(skyColor, 0.012);

    const pmremGen = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGen.fromScene(new RoomEnvironment()).texture;
    pmremGen.dispose();

    // 4. Lights (Warm Sun + Natural Grass/Sky Fill)
    this.sunLight = new THREE.DirectionalLight(0xfffae0, 1.85);
    this.sunLight.position.set(22, 38, 18);
    this.sunLight.castShadow = !this.isSoftwareGl;
    this.sunLight.shadow.mapSize.set(1024, 1024);
    this.sunLight.shadow.camera.left = -28;
    this.sunLight.shadow.camera.right = 28;
    this.sunLight.shadow.camera.top = 28;
    this.sunLight.shadow.camera.bottom = -28;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    this.hemiLight = new THREE.HemisphereLight(0xddeeff, 0x567d34, 1.0);
    this.scene.add(this.hemiLight);

    // 5. Camera
    this.camera = new THREE.PerspectiveCamera(
      58,
      (container.clientWidth || window.innerWidth) / (container.clientHeight || window.innerHeight),
      0.1,
      260
    );
    this.camera.position.set(0, 5.5, 11.5);
    this.camera.lookAt(0, 1.2, 0);

    // 6. Build World & Entities
    this.scene.add(this.environmentGroup);
    this.buildEnvironment();
    this.buildCampStructures();
    this.initStarterRacks();
    this.initStarterDockCrates();
    this.initForageNodes();
    this.initWildernessHazards();

    // 7. Build Player Chieftain
    this.playerGroup = this.createHumanoidMesh(0x9c6c4c, 0x4b321f, true);
    this.playerGroup.position.set(this.playerX, 0, this.playerZ);
    this.scene.add(this.playerGroup);

    // 8. Build Placement Hologram Preview
    this.initPlacementPreview();

    // 9. Weather, Myth Surge Shader/Particles & Migration Herd
    this.initRainParticles();
    this.initMythSurgeSystem();
    this.scene.add(this.migratingHerdGroup);

    // 10. Pointer & Resize Events
    this.setupPointerOrbit();
    window.addEventListener('resize', this.onWindowResize);

    // 11. Start Render Loop + Initial Synchronous Frame
    this.renderer.render(this.scene, this.camera);
    this.startLoop();
  }

  // --- ENVIRONMENT & CAMP STRUCTURES ---

  private buildEnvironment() {
    while (this.environmentGroup.children.length > 0) {
      this.environmentGroup.remove(this.environmentGroup.children[0]);
    }

    let skyHex = 0xa3c8b4;
    let groundHex = 0x4e7f30;
    let stoneHex = 0x9b8c72;
    let waterHex = 0x2e6b66;

    if (this.currentLandscape === 'wetland_oasis') {
      skyHex = 0x8cbab0;
      groundHex = 0x44753d;
      stoneHex = 0x7b8572;
      waterHex = 0x27736e;
    } else if (this.currentLandscape === 'mountain_pass') {
      skyHex = 0x9ab0bf;
      groundHex = 0x5c7c3a;
      stoneHex = 0x898278;
      waterHex = 0x3b6c7a;
    }

    this.scene.background = new THREE.Color(skyHex);
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color = new THREE.Color(skyHex);
    }

    // Broad rolling wilderness meadow floor
    const meadow = new THREE.Mesh(
      new THREE.CircleGeometry(130, 48),
      new THREE.MeshStandardMaterial({ color: groundHex, roughness: 0.92 })
    );
    meadow.rotation.x = -Math.PI / 2;
    meadow.position.y = -0.04;
    meadow.receiveShadow = !this.isSoftwareGl;
    this.environmentGroup.add(meadow);

    // Camp Ground Pad (Expands with expansionTier)
    const tierInfo = SIM_EXPANSIONS.find(e => e.tier === this.expansionTier) || SIM_EXPANSIONS[0];
    const campFloor = new THREE.Mesh(
      new THREE.CylinderGeometry(tierInfo.radius, tierInfo.radius + 0.4, 0.08, 36),
      new THREE.MeshStandardMaterial({ color: stoneHex, roughness: 0.88 })
    );
    campFloor.position.y = 0;
    campFloor.receiveShadow = !this.isSoftwareGl;
    this.environmentGroup.add(campFloor);

    // Camp Boundary Ring Markers
    const ringGeo = new THREE.RingGeometry(tierInfo.radius - 0.15, tierInfo.radius + 0.15, 48);
    ringGeo.rotateX(-Math.PI / 2);
    this.borderRingMesh = new THREE.Mesh(
      ringGeo,
      new THREE.MeshBasicMaterial({ color: 0xe2b659, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
    );
    this.borderRingMesh.position.y = 0.06;
    this.environmentGroup.add(this.borderRingMesh);

    // Winding River / Lagoon & Water Lilies
    const riverWidth = this.currentLandscape === 'wetland_oasis' ? 24 : 14;
    const riverX = this.currentLandscape === 'wetland_oasis' ? -22 : -18.5;
    const river = new THREE.Mesh(
      new THREE.PlaneGeometry(riverWidth, 150),
      new THREE.MeshStandardMaterial({ color: waterHex, roughness: 0.15, metalness: 0.3 })
    );
    river.rotation.x = -Math.PI / 2;
    river.position.set(riverX, -0.01, -5);
    this.environmentGroup.add(river);

    // Monet Water Lilies on river (extra lush in Wetland Oasis)
    const lilyStep = this.currentLandscape === 'wetland_oasis' ? 4.0 : 7.5;
    for (let z = -35; z <= 25; z += lilyStep) {
      const cluster = this.createWaterLilyCluster();
      cluster.position.set(-15 + Math.sin(z * 0.7) * 3.0, 0.02, z);
      this.environmentGroup.add(cluster);
      if (this.currentLandscape === 'wetland_oasis') {
        const extra = this.createWaterLilyCluster();
        extra.position.set(-20 + Math.cos(z) * 2.5, 0.02, z + 1.8);
        this.environmentGroup.add(extra);
      }
    }

    // Timber Riverbank Supply Dock (-8.5, 7.5)
    const dock = new THREE.Group();
    const plankMat = new THREE.MeshStandardMaterial({ color: 0x6b4b2e, roughness: 0.85 });
    const postMat = new THREE.MeshStandardMaterial({ color: 0x4a331d, roughness: 0.92 });
    const deck = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.25, 4.4), plankMat);
    deck.position.y = 0.16;
    dock.add(deck);
    for (const px of [-2.2, 2.2]) {
      for (const pz of [-1.8, 1.8]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 1.1, 6), postMat);
        post.position.set(px, 0.5, pz);
        dock.add(post);
      }
    }
    // Dock Banner Signpost
    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 0.65, 0.12),
      new THREE.MeshStandardMaterial({ color: 0xd99b38, roughness: 0.6 })
    );
    signBoard.position.set(0, 1.55, -2.0);
    dock.add(signBoard);
    dock.position.set(-8.5, 0, 7.5);
    this.environmentGroup.add(dock);

    // Distant Canyon Stone Arch & Mountain Ridges (Prominent in Mountain Pass)
    const archDistZ = this.currentLandscape === 'mountain_pass' ? -38 : -68;
    const peakDistZ = this.currentLandscape === 'mountain_pass' ? -44 : -75;
    const mtnMat = new THREE.MeshStandardMaterial({
      color: this.currentLandscape === 'mountain_pass' ? 0x5c6d7a : 0x4f636e,
      roughness: 0.95,
    });
    for (const side of [-1, 1]) {
      const peak = new THREE.Mesh(
        new THREE.ConeGeometry(this.currentLandscape === 'mountain_pass' ? 22 : 28, 36, 7),
        mtnMat
      );
      peak.position.set(side * (this.currentLandscape === 'mountain_pass' ? 24 : 42), 14, peakDistZ);
      this.environmentGroup.add(peak);
    }
    const canyonArch = new THREE.Mesh(
      new THREE.TorusGeometry(this.currentLandscape === 'mountain_pass' ? 16 : 24, 2.2, 6, 18, Math.PI * 0.72),
      new THREE.MeshStandardMaterial({ color: 0x49535c, roughness: 0.9 })
    );
    canyonArch.rotation.z = Math.PI * 0.14;
    canyonArch.position.set(this.currentLandscape === 'mountain_pass' ? 2 : 12, 6, archDistZ);
    this.environmentGroup.add(canyonArch);

    if (this.currentLandscape === 'mountain_pass') {
      const waterfall = new THREE.Mesh(
        new THREE.PlaneGeometry(5.5, 22),
        new THREE.MeshBasicMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
      );
      waterfall.position.set(2, 9, archDistZ - 2);
      this.environmentGroup.add(waterfall);
    }

    // Sunlit Canopy Trees & Wildflower Clusters framing the perimeter
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const dist = 24 + (i % 3) * 5;
      const tx = Math.cos(angle) * dist;
      const tz = Math.sin(angle) * dist;
      if (tx < -12 && tx > -25) continue; // Don't put trees inside the river

      const tree = this.createSunlitCanopyTree();
      tree.position.set(tx, 0, tz);
      this.environmentGroup.add(tree);

      const flowers = this.createWildflowerCluster();
      flowers.position.set(tx * 0.85, 0, tz * 0.85);
      this.environmentGroup.add(flowers);
    }
  }

  private buildCampStructures() {
    // 1. Central Storytelling Campfire Hearth (0, 0)
    const hearth = new THREE.Group();
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x5c574f, roughness: 0.9 });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 0), stoneMat);
      rock.position.set(Math.cos(a) * 0.9, 0.18, Math.sin(a) * 0.9);
      hearth.add(rock);
    }
    const logMat = new THREE.MeshStandardMaterial({ color: 0x3b2615, roughness: 0.95 });
    for (let i = 0; i < 3; i++) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.3, 5), logMat);
      log.rotation.z = Math.PI / 2;
      log.rotation.y = (i * Math.PI) / 3;
      log.position.y = 0.16;
      hearth.add(log);
    }
    this.campfireFlameMesh = new THREE.Mesh(
      new THREE.ConeGeometry(0.42, 0.95, 6),
      new THREE.MeshBasicMaterial({ color: 0xff7b1a })
    );
    this.campfireFlameMesh.position.y = 0.55;
    hearth.add(this.campfireFlameMesh);

    this.firePointLight = new THREE.PointLight(0xff8c24, 2.2, 12);
    this.firePointLight.position.y = 1.1;
    hearth.add(this.firePointLight);
    this.scene.add(hearth);

    // 2. Barter & Coinage Checkout Counter (0, 6.2)
    const counter = new THREE.Group();
    const timberMat = new THREE.MeshStandardMaterial({ color: 0x69482c, roughness: 0.8 });
    const stoneTopMat = new THREE.MeshStandardMaterial({ color: 0xc2b296, roughness: 0.65 });

    const base = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.0, 1.3), timberMat);
    base.position.y = 0.5;
    counter.add(base);

    const top = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.18, 1.45), stoneTopMat);
    top.position.y = 1.08;
    counter.add(top);

    // Barter Balance Scale & Cowrie Bowl on Counter
    const scalePost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.07, 0.55, 6),
      new THREE.MeshStandardMaterial({ color: 0xd9a036, metalness: 0.4, roughness: 0.4 })
    );
    scalePost.position.set(-0.9, 1.42, 0);
    counter.add(scalePost);

    const scaleBeam = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.05, 0.05),
      new THREE.MeshStandardMaterial({ color: 0xd9a036, metalness: 0.4, roughness: 0.4 })
    );
    scaleBeam.position.set(-0.9, 1.65, 0);
    counter.add(scaleBeam);

    // Canopy posts
    for (const px of [-1.85, 1.85]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.6, 6), timberMat);
      post.position.set(px, 1.3, 0);
      counter.add(post);
    }
    const awning = new THREE.Mesh(
      new THREE.BoxGeometry(4.3, 0.14, 2.0),
      new THREE.MeshStandardMaterial({ color: 0xb84a27, roughness: 0.85 })
    );
    awning.position.set(0, 2.62, 0);
    awning.rotation.x = 0.12;
    counter.add(awning);

    // Glowing Serve Zone Marker behind counter
    const padGeo = new THREE.RingGeometry(0.55, 0.82, 24);
    padGeo.rotateX(-Math.PI / 2);
    const pad = new THREE.Mesh(
      padGeo,
      new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.65, side: THREE.DoubleSide })
    );
    pad.position.set(0, 0.06, 1.45);
    counter.add(pad);

    counter.position.set(4.6, 0, 3.8);
    counter.rotation.y = -0.35;
    this.scene.add(counter);

    // 3. Chronicle & Supply Tablet Pedestal (6.5, -1.2)
    const lectern = new THREE.Group();
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.48, 1.15, 7), stoneMat);
    ped.position.y = 0.58;
    lectern.add(ped);
    const tablet = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.62, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, emissive: 0xd97706, emissiveIntensity: 0.35, roughness: 0.3 })
    );
    tablet.position.set(0, 1.35, 0);
    tablet.rotation.x = -0.45;
    lectern.add(tablet);
    lectern.position.set(6.5, 0, -0.5);
    this.scene.add(lectern);
  }

  private initStarterRacks() {
    this.addRack({
      id: 'rack_berries_1',
      label: 'Wild Berry Stand',
      productType: 'berries',
      stock: 4,
      maxStock: 6,
      price: this.prices.berries,
      x: -4.6,
      z: -2.4,
      rotationY: 0.25,
    });
    this.addRack({
      id: 'rack_flint_1',
      label: 'Flint Tool Bench',
      productType: 'flint',
      stock: 3,
      maxStock: 6,
      price: this.prices.flint,
      x: 4.6,
      z: -2.4,
      rotationY: -0.25,
    });
    this.addRack({
      id: 'rack_wheat_1',
      label: 'Emmer Wheat Bin',
      productType: 'wheat',
      stock: 1,
      maxStock: 8,
      price: this.prices.wheat,
      x: -4.8,
      z: 2.2,
      rotationY: 0.15,
    });
    this.syncRacksCallback();
  }

  private initStarterDockCrates() {
    this.spawnDockCrate('berries', SIM_CATALOG.berries.crateUnits);
    this.spawnDockCrate('wheat', SIM_CATALOG.wheat.crateUnits);
  }

  private initForageNodes() {
    const spots: { productType: 'berries' | 'flint'; x: number; z: number }[] = [
      { productType: 'berries', x: -11, z: -12 },
      { productType: 'berries', x: 11, z: -13 },
      { productType: 'flint', x: -10, z: -18 },
      { productType: 'flint', x: 12, z: -19 },
    ];
    for (let i = 0; i < spots.length; i++) {
      const s = spots[i];
      const mesh = this.createForageNodeMesh(s.productType);
      mesh.position.set(s.x, 0, s.z);
      this.scene.add(mesh);
      this.forageNodes.push({
        id: `forage_${i}`,
        productType: s.productType,
        x: s.x,
        z: s.z,
        cooldown: 0,
        mesh,
      });
    }
  }

  private initWildernessHazards() {
    // 1. Prowling Sabertooth Cat circling the northern wilderness edge
    const predatorMesh = this.createSabertoothMesh();
    predatorMesh.position.set(0, 0, -16);
    this.scene.add(predatorMesh);
    this.hazards.push({
      id: 'hazard_sabertooth',
      type: 'predator',
      baseX: 0,
      baseZ: -16.5,
      x: 0,
      z: -16.5,
      phase: 0,
      mesh: predatorMesh,
    });

    // 2. Rolling Canyon Boulders patrolling northern pass
    for (const bx of [-7.5, 7.5]) {
      const boulder = new THREE.Group();
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.95, 1),
        new THREE.MeshStandardMaterial({ color: 0x6b645c, roughness: 0.9 })
      );
      rock.position.y = 0.85;
      boulder.add(rock);
      boulder.position.set(bx, 0, -14.5);
      this.scene.add(boulder);
      this.hazards.push({
        id: `hazard_boulder_${bx}`,
        type: 'boulder',
        baseX: bx,
        baseZ: -15,
        x: bx,
        z: -15,
        phase: bx < 0 ? 0 : Math.PI,
        mesh: boulder,
      });
    }
  }

  // --- RACKS, CRATES & MESH FACTORIES ---

  private addRack(state: SimRackState) {
    const group = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x6d4a2b, roughness: 0.85 });
    const trimMat = new THREE.MeshStandardMaterial({ color: SIM_CATALOG[state.productType].colorHex, roughness: 0.55 });

    // Timber Stand Legs & Two Shelves
    for (const lx of [-0.95, 0.95]) {
      for (const lz of [-0.45, 0.45]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.45, 0.14), woodMat);
        leg.position.set(lx, 0.72, lz);
        group.add(leg);
      }
    }
    const lowerShelf = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.1, 1.05), woodMat);
    lowerShelf.position.y = 0.55;
    group.add(lowerShelf);

    const upperShelf = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.1, 1.05), woodMat);
    upperShelf.position.y = 1.15;
    group.add(upperShelf);

    // Color-coded Category Header Banner
    const sign = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.28, 0.1), trimMat);
    sign.position.set(0, 1.62, 0);
    group.add(sign);

    // Visual product slots (up to maxStock)
    const stockMeshes: THREE.Object3D[] = [];
    for (let i = 0; i < state.maxStock; i++) {
      const itemMesh = this.createProductPropMesh(state.productType);
      const row = i < state.maxStock / 2 ? 0 : 1;
      const col = i % Math.ceil(state.maxStock / 2);
      const xOff = -0.68 + col * 0.45;
      const yOff = row === 0 ? 0.62 : 1.22;
      itemMesh.position.set(xOff, yOff, 0);
      itemMesh.visible = i < state.stock;
      group.add(itemMesh);
      stockMeshes.push(itemMesh);
    }

    group.position.set(state.x, 0, state.z);
    group.rotation.y = state.rotationY;
    this.scene.add(group);

    this.racks.push({
      ...state,
      mesh: group,
      stockMeshes,
    });
  }

  private refreshRackVisuals(rack: RackEntity) {
    for (let i = 0; i < rack.stockMeshes.length; i++) {
      rack.stockMeshes[i].visible = i < rack.stock;
    }
  }

  private createProductPropMesh(type: SimProductType): THREE.Object3D {
    const g = new THREE.Group();
    if (type === 'berries') {
      const basket = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.12, 0.18, 7),
        new THREE.MeshStandardMaterial({ color: 0x8b5e34, roughness: 0.9 })
      );
      basket.position.y = 0.09;
      g.add(basket);
      const fruit = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 6, 6),
        new THREE.MeshStandardMaterial({ color: 0xd93838, roughness: 0.5 })
      );
      fruit.position.y = 0.19;
      g.add(fruit);
    } else if (type === 'flint') {
      const blade = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.15, 0),
        new THREE.MeshStandardMaterial({ color: 0x333842, roughness: 0.25, metalness: 0.35 })
      );
      blade.scale.set(0.7, 1.4, 0.5);
      blade.position.y = 0.18;
      g.add(blade);
    } else if (type === 'wheat') {
      const sack = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.18, 0),
        new THREE.MeshStandardMaterial({ color: 0xdab24c, roughness: 0.85 })
      );
      sack.scale.set(1.0, 1.25, 0.85);
      sack.position.y = 0.18;
      g.add(sack);
    } else {
      const totem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.12, 0.32, 6),
        new THREE.MeshStandardMaterial({ color: 0xf4ebd0, emissive: 0xd97706, emissiveIntensity: 0.2, roughness: 0.35 })
      );
      totem.position.y = 0.16;
      g.add(totem);
    }
    return g;
  }

  public spawnDockCrate(productType: SimProductType, units: number) {
    const idx = this.dockCrates.length;
    const col = idx % 3;
    const row = Math.floor(idx / 3) % 3;
    const x = -9.9 + col * 1.4;
    const z = 6.3 + row * 1.2;

    const crate = new THREE.Group();
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.72, 0.85),
      new THREE.MeshStandardMaterial({ color: 0x9c6e3b, roughness: 0.85 })
    );
    box.position.y = 0.36;
    crate.add(box);

    const band = new THREE.Mesh(
      new THREE.BoxGeometry(0.88, 0.16, 0.88),
      new THREE.MeshStandardMaterial({ color: SIM_CATALOG[productType].colorHex, roughness: 0.5 })
    );
    band.position.y = 0.52;
    crate.add(band);

    crate.position.set(x, 0.28, z);
    this.scene.add(crate);

    this.dockCrates.push({
      id: `crate_${Date.now()}_${Math.random()}`,
      productType,
      units,
      x,
      z,
      mesh: crate,
    });
    if (this.callbacks.onDockCountChange) {
      this.callbacks.onDockCountChange(this.dockCrates.length);
    }
  }

  private createForageNodeMesh(type: 'berries' | 'flint'): THREE.Group {
    const g = new THREE.Group();
    if (type === 'berries') {
      const bush = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.75, 1),
        new THREE.MeshStandardMaterial({ color: 0x3a6b2b, roughness: 0.9 })
      );
      bush.position.y = 0.55;
      g.add(bush);
      const bMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.4 });
      for (let i = 0; i < 6; i++) {
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.1, 5, 5), bMat);
        b.position.set(Math.cos(i) * 0.55, 0.65 + (i % 2) * 0.22, Math.sin(i) * 0.55);
        g.add(b);
      }
    } else {
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.65, 0),
        new THREE.MeshStandardMaterial({ color: 0x2c303a, roughness: 0.35, metalness: 0.25 })
      );
      rock.position.y = 0.45;
      g.add(rock);
    }
    return g;
  }

  private createHumanoidMesh(skinHex: number, tunicHex: number, isPlayer: boolean): THREE.Group {
    const person = new THREE.Group();
    const skinMat = new THREE.MeshStandardMaterial({ color: skinHex, roughness: 0.72 });
    const furMat = new THREE.MeshStandardMaterial({ color: tunicHex, roughness: 0.9 });

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.78, 7), furMat);
    torso.position.y = 1.05;
    person.add(torso);

    const mantle = new THREE.Mesh(new THREE.ConeGeometry(0.46, 0.32, 7), furMat);
    mantle.position.y = 1.38;
    person.add(mantle);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), skinMat);
    head.position.y = 1.68;
    person.add(head);

    const hair = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.23, 0),
      new THREE.MeshStandardMaterial({ color: 0x221812, roughness: 0.9 })
    );
    hair.position.set(0, 1.75, -0.04);
    person.add(hair);

    const legGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.68, 6);
    const leftLeg = new THREE.Mesh(legGeo, skinMat);
    leftLeg.position.set(-0.15, 0.36, 0);
    person.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, skinMat);
    rightLeg.position.set(0.15, 0.36, 0);
    person.add(rightLeg);

    const armGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.58, 5);
    const leftArm = new THREE.Mesh(armGeo, skinMat);
    leftArm.position.set(-0.36, 1.15, 0);
    person.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, skinMat);
    rightArm.position.set(0.36, 1.15, 0);
    person.add(rightArm);

    // Contact shadow
    const cs = new THREE.Mesh(
      new THREE.CircleGeometry(0.55, 12),
      new THREE.MeshBasicMaterial({ color: 0x110c08, transparent: true, opacity: 0.38, depthWrite: false })
    );
    cs.rotateX(-Math.PI / 2);
    cs.position.y = 0.05;
    person.add(cs);

    if (isPlayer) {
      this.leftLegMesh = leftLeg;
      this.rightLegMesh = rightLeg;
      this.leftArmMesh = leftArm;
      this.rightArmMesh = rightArm;

      // Carried crate in hands
      this.carriedBoxMesh = new THREE.Group();
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.62, 0.5, 0.62),
        new THREE.MeshStandardMaterial({ color: 0xa6743d, roughness: 0.85 })
      );
      this.carriedBoxMesh.add(box);
      this.carriedBoxMesh.position.set(0, 1.15, 0.56);
      this.carriedBoxMesh.visible = false;
      person.add(this.carriedBoxMesh);

      // Golden Respawn Invulnerability Halo
      const invulnGeo = new THREE.TorusGeometry(0.95, 0.05, 6, 24);
      const invulnMat = new THREE.MeshBasicMaterial({
        color: 0xffd700,
        transparent: true,
        opacity: 0,
      });
      this.invulnRingMesh = new THREE.Mesh(invulnGeo, invulnMat);
      this.invulnRingMesh.rotation.x = Math.PI / 2;
      this.invulnRingMesh.position.y = 0.16;
      this.invulnRingMesh.visible = false;
      person.add(this.invulnRingMesh);
    }

    return person;
  }

  private createSabertoothMesh(): THREE.Group {
    const beast = new THREE.Group();
    const furMat = new THREE.MeshStandardMaterial({ color: 0x995c2e, roughness: 0.85 });
    const tuskMat = new THREE.MeshStandardMaterial({ color: 0xf5f0e6, roughness: 0.3 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.75, 1.7), furMat);
    body.position.y = 0.85;
    beast.add(body);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.55, 0.65), furMat);
    head.position.set(0, 1.15, 0.85);
    beast.add(head);

    for (const side of [-0.18, 0.18]) {
      const tusk = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.4, 5), tuskMat);
      tusk.rotation.x = 0.25;
      tusk.position.set(side, 0.78, 1.12);
      beast.add(tusk);
    }

    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff4400 });
    for (const side of [-0.16, 0.16]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 4, 4), eyeMat);
      eye.position.set(side, 1.28, 1.18);
      beast.add(eye);
    }

    for (const x of [-0.35, 0.35]) {
      for (const z of [-0.55, 0.55]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.75, 5), furMat);
        leg.position.set(x, 0.38, z);
        beast.add(leg);
      }
    }
    return beast;
  }

  private createWaterLilyCluster(): THREE.Group {
    const cluster = new THREE.Group();
    const padMat = new THREE.MeshStandardMaterial({ color: 0x5a8838, roughness: 0.6 });
    for (let i = 0; i < 3; i++) {
      const pad = new THREE.Mesh(new THREE.CircleGeometry(0.55, 10), padMat);
      pad.rotateX(-Math.PI / 2);
      pad.position.set((i - 1) * 0.65, 0, (Math.random() - 0.5) * 0.4);
      cluster.add(pad);
    }
    const flower = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.2, 0),
      new THREE.MeshStandardMaterial({ color: 0xfffae0, emissive: 0xffea77, emissiveIntensity: 0.2 })
    );
    flower.position.y = 0.12;
    cluster.add(flower);
    return cluster;
  }

  private createWildflowerCluster(): THREE.Group {
    const cluster = new THREE.Group();
    const colors = [0xdd2222, 0x8833cc, 0xffbb11, 0x2288ff];
    for (let i = 0; i < 6; i++) {
      const c = colors[i % colors.length];
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.4, 4),
        new THREE.MeshStandardMaterial({ color: 0x336622 })
      );
      const px = ((i % 3) - 1) * 0.6;
      const pz = (Math.floor(i / 3) - 0.5) * 0.6;
      stem.position.set(px, 0.2, pz);
      cluster.add(stem);
      const blossom = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 5, 5),
        new THREE.MeshStandardMaterial({ color: c, roughness: 0.4 })
      );
      blossom.position.set(px, 0.42, pz);
      cluster.add(blossom);
    }
    return cluster;
  }

  private createSunlitCanopyTree(): THREE.Group {
    const tree = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a3424, roughness: 0.95 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 6.0, 7), woodMat);
    trunk.position.y = 3.0;
    tree.add(trunk);

    const isGolden = Math.random() > 0.5;
    const leafMat = new THREE.MeshStandardMaterial({
      color: isGolden ? 0xc49d28 : 0x558f32,
      roughness: 0.85,
    });
    for (let i = 0; i < 3; i++) {
      const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(2.1, 1), leafMat);
      foliage.position.set((i - 1) * 0.9, 5.8 + i * 0.7, (i % 2 - 0.5) * 0.8);
      tree.add(foliage);
    }
    return tree;
  }

  // --- PLACEMENT HOLOGRAM PREVIEW ---

  private initPlacementPreview() {
    const g = new THREE.Group();
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 1.5, 1.05),
      new THREE.MeshBasicMaterial({ color: 0x22c55e, wireframe: true, transparent: true, opacity: 0.85 })
    );
    box.position.y = 0.75;
    g.add(box);
    g.visible = false;
    this.placementPreviewMesh = g;
    this.scene.add(g);
  }

  public enterPlacementMode(productType: SimProductType, rackCost: number) {
    this.placementMode = { productType, rackCost };
    this.placementRotationY = 0;
  }

  public cancelPlacementMode() {
    this.placementMode = null;
    if (this.placementPreviewMesh) this.placementPreviewMesh.visible = false;
  }

  public rotatePlacement() {
    this.placementRotationY += Math.PI / 4;
  }

  // --- MYTH SURGE GLSL SHADER & SOFT ROUND PARTICLE VORTEX ---

  private initMythSurgeSystem() {
    // 1. Soft Radial-Glow Round Ember Particles via Custom GLSL Shader (NO white squares!)
    const geo = new THREE.BufferGeometry();
    this.mythParticlePositions = new Float32Array(this.mythSurgeParticleCount * 3);
    this.mythParticleMeta = [];

    for (let i = 0; i < this.mythSurgeParticleCount; i++) {
      const angle = (i / this.mythSurgeParticleCount) * Math.PI * 2 * 3;
      const radius = 1.25 + Math.random() * 2.1;
      const y = Math.random() * 4.2;
      const speedY = 1.4 + Math.random() * 2.2;
      const spin = 2.6 + Math.random() * 3.8;

      this.mythParticlePositions[i * 3 + 0] = Math.cos(angle) * radius;
      this.mythParticlePositions[i * 3 + 1] = y;
      this.mythParticlePositions[i * 3 + 2] = Math.sin(angle) * radius;
      this.mythParticleMeta.push({ angle, radius, speedY, spin });
    }
    geo.setAttribute('position', new THREE.BufferAttribute(this.mythParticlePositions, 3));

    this.mythParticleShaderMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uOpacity: { value: 0.0 },
        uSize: { value: this.isSoftwareGl ? 18.0 : 24.0 },
      },
      vertexShader: `
        uniform float uSize;
        varying float vHeight;
        void main() {
          vHeight = position.y;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = uSize * (8.0 / max(2.5, -mvPosition.z));
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        varying float vHeight;
        void main() {
          vec2 c = gl_PointCoord - vec2(0.5);
          float d = length(c);
          if (d > 0.5) discard;
          float glow = smoothstep(0.5, 0.05, d);
          vec3 amber = vec3(0.95, 0.52, 0.08);
          vec3 gold = vec3(1.0, 0.85, 0.25);
          vec3 col = mix(amber, gold, smoothstep(0.0, 4.0, vHeight));
          gl_FragColor = vec4(col, glow * uOpacity);
        }
      `,
    });

    this.mythSurgeParticles = new THREE.Points(geo, this.mythParticleShaderMat);
    this.mythSurgeParticles.frustumCulled = false;
    this.scene.add(this.mythSurgeParticles);

    // 2. Ground Sacred-Geometry Shockwave Shader Disc
    const auraGeo = new THREE.PlaneGeometry(11, 11);
    auraGeo.rotateX(-Math.PI / 2);

    this.mythSurgeShaderMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: 0 },
        uWaveProgress: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uIntensity;
        uniform float uWaveProgress;
        varying vec2 vUv;

        void main() {
          vec2 centered = (vUv - 0.5) * 2.0;
          float dist = length(centered);
          if (dist > 1.0) discard;

          float angle = atan(centered.y, centered.x);
          float ripple = sin(dist * 16.0 - uTime * 8.0) * 0.5 + 0.5;
          float shockRing = smoothstep(0.08, 0.0, abs(dist - uWaveProgress));
          float rays = pow(sin(angle * 8.0 + uTime * 3.0) * 0.5 + 0.5, 3.0);
          float falloff = smoothstep(1.0, 0.15, dist);

          float alpha = (ripple * 0.25 + shockRing * 0.75 + rays * 0.28) * falloff * clamp(uIntensity, 0.0, 1.0) * 0.75;
          vec3 goldCore = vec3(1.0, 0.84, 0.28);
          vec3 amberEdge = vec3(0.95, 0.45, 0.08);
          vec3 col = mix(amberEdge, goldCore, shockRing * 0.7 + ripple * 0.3);

          gl_FragColor = vec4(col, alpha);
        }
      `,
    });

    this.mythSurgeShockwaveMesh = new THREE.Mesh(auraGeo, this.mythSurgeShaderMat);
    this.mythSurgeShockwaveMesh.position.y = 0.09;
    this.mythSurgeShockwaveMesh.frustumCulled = false;
    this.mythSurgeShockwaveMesh.visible = false;
    this.scene.add(this.mythSurgeShockwaveMesh);
  }

  public triggerMythSurge(amount: number = 25, intensity: number = 1.6) {
    this.mythSurgeIntensity = Math.min(2.0, Math.max(this.mythSurgeIntensity, 0.4) + intensity);
    this.mythSurgeShockwaveRadius = 0.05;
    soundEngine.playMythSound();
    if (this.callbacks.onMythTrigger) {
      this.callbacks.onMythTrigger(amount);
    }
  }

  // --- WEATHER & ANIMAL MIGRATIONS ---

  private initRainParticles() {
    const count = 900;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 44;
      positions[i * 3 + 1] = Math.random() * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 44;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xbde0ff,
      size: 0.14,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
    });
    this.rainParticles = new THREE.Points(geo, mat);
    this.rainParticles.frustumCulled = false;
    this.scene.add(this.rainParticles);
  }

  public setEventWeather(weather: 'clear_sun' | 'rain' | 'storm' | 'mist', active: boolean) {
    this.currentWeather = weather;
    this.weatherActive = active;

    if (active && (weather === 'rain' || weather === 'storm')) {
      soundEngine.playRainStart();
      if (weather === 'storm') soundEngine.playThunder();
    } else if (!active && this.sunLight) {
      this.sunLight.intensity = 1.85;
    }

    let skyHex = 0xa3c8b4;
    if (this.currentLandscape === 'wetland_oasis') skyHex = 0x8cbab0;
    if (this.currentLandscape === 'mountain_pass') skyHex = 0x9ab0bf;

    if (active) {
      if (weather === 'rain') skyHex = 0x7b968a;
      if (weather === 'storm') skyHex = 0x58696b;
      if (weather === 'mist') skyHex = 0x9fb0ab;
    }

    this.scene.background = new THREE.Color(skyHex);
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color = new THREE.Color(skyHex);
      this.scene.fog.density = active && weather === 'mist' ? 0.022 : 0.012;
    }
  }

  public triggerAnimalMigration(animalType: 'mammoths' | 'gazelles', active: boolean = true) {
    this.activeAnimalMigration = active ? animalType : null;
    while (this.migratingHerdGroup.children.length > 0) {
      this.migratingHerdGroup.remove(this.migratingHerdGroup.children[0]);
    }

    if (active) {
      if (animalType === 'mammoths') {
        soundEngine.playMammothTrumpet();
        for (let i = 0; i < 3; i++) {
          const m = this.createMammothMesh();
          m.position.set(-28, 0, -24 + i * 14);
          this.migratingHerdGroup.add(m);
        }
      } else {
        for (let i = 0; i < 5; i++) {
          const g = this.createGazelleMesh();
          g.position.set(17 + (i % 2) * 2.8, 0, -22 + i * 9);
          this.migratingHerdGroup.add(g);
        }
      }
    }
  }

  private createMammothMesh(): THREE.Group {
    const mammoth = new THREE.Group();
    const furMat = new THREE.MeshStandardMaterial({ color: 0x4a3424, roughness: 0.95 });
    const tuskMat = new THREE.MeshStandardMaterial({ color: 0xf5f0e6, roughness: 0.3 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.6, 2.8), furMat);
    body.position.y = 1.8;
    mammoth.add(body);

    const head = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.3), furMat);
    head.position.set(0, 2.2, 1.5);
    mammoth.add(head);

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.1, 1.8, 5), furMat);
    trunk.position.set(0, 1.2, 2.1);
    trunk.rotation.x = -0.25;
    mammoth.add(trunk);

    for (const side of [-0.45, 0.45]) {
      const tusk = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.1, 5, 14, Math.PI * 0.75), tuskMat);
      tusk.position.set(side, 1.4, 2.0);
      tusk.rotation.y = side < 0 ? -0.4 : 0.4;
      tusk.rotation.x = -0.3;
      mammoth.add(tusk);
    }

    for (const x of [-0.65, 0.65]) {
      for (const z of [-0.9, 0.9]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.22, 1.4, 6), furMat);
        leg.position.set(x, 0.7, z);
        mammoth.add(leg);
      }
    }
    return mammoth;
  }

  private createGazelleMesh(): THREE.Group {
    const gazelle = new THREE.Group();
    const coatMat = new THREE.MeshStandardMaterial({ color: 0xc28a4b, roughness: 0.7 });
    const hornMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.4 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 1.3), coatMat);
    body.position.y = 0.85;
    gazelle.add(body);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.5), coatMat);
    head.position.set(0, 1.35, 0.75);
    gazelle.add(head);

    for (const side of [-0.1, 0.1]) {
      const horn = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.04, 0.45, 4), hornMat);
      horn.position.set(side, 1.65, 0.65);
      gazelle.add(horn);
    }

    for (const x of [-0.2, 0.2]) {
      for (const z of [-0.45, 0.45]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.8, 4), coatMat);
        leg.position.set(x, 0.4, z);
        gazelle.add(leg);
      }
    }
    return gazelle;
  }

  // --- INTERACTION & SIMULATOR PUBLIC API ---

  public setTitleMode(isTitle: boolean) {
    this.isTitleMode = isTitle;
    if (!isTitle) {
      this.camera.position.set(this.playerX, this.playerY + 5.1, this.playerZ + 7.6);
      this.camera.lookAt(this.playerX, this.playerY + 1.35, this.playerZ - 1.5);
      this.renderer.render(this.scene, this.camera);
    }
  }

  public setLandscape(landscape: SapiensLandscape) {
    this.currentLandscape = landscape;
    this.buildEnvironment();
  }

  public setExpansionTier(tier: number) {
    this.expansionTier = tier;
    this.buildEnvironment();
  }

  public setCampOpen(open: boolean) {
    this.isCampOpen = open;
  }

  public setPrices(prices: Record<SimProductType, number>) {
    this.prices = { ...prices };
    for (const r of this.racks) {
      r.price = prices[r.productType];
    }
    this.syncRacksCallback();
  }

  public hireStaff(role: 'restocker' | 'barterer') {
    if (role === 'restocker' && !this.restockerHired) {
      this.restockerHired = true;
      this.restockerMesh = this.createHumanoidMesh(0x8e6245, 0x2f6b47, false);
      this.restockerMesh.position.set(-6, 0, 5);
      this.scene.add(this.restockerMesh);
    } else if (role === 'barterer' && !this.bartererHired) {
      this.bartererHired = true;
      this.bartererMesh = this.createHumanoidMesh(0x9a6d4e, 0x9b5a1e, false);
      this.bartererMesh.position.set(4.1, 0, 5.1);
      this.bartererMesh.rotation.y = Math.PI - 0.35;
      this.scene.add(this.bartererMesh);
    }
  }

  public toggleCameraView() {
    this.firstPerson = !this.firstPerson;
    this.playerGroup.visible = !this.firstPerson;
  }

  public triggerInteract() {
    if (this.isTitleMode) return;

    // 1. Placement mode has priority
    if (this.placementMode && this.placementPreviewMesh) {
      if (this.placementPreviewValid) {
        const px = this.placementPreviewMesh.position.x;
        const pz = this.placementPreviewMesh.position.z;
        const pType = this.placementMode.productType;
        this.addRack({
          id: `rack_${pType}_${Date.now()}`,
          label: `${SIM_CATALOG[pType].name.split(' ')[0]} Rack`,
          productType: pType,
          stock: 0,
          maxStock: SIM_CATALOG[pType].crateUnits,
          price: this.prices[pType],
          x: px,
          z: pz,
          rotationY: this.placementRotationY,
        });
        soundEngine.playDiscovery();
        this.syncRacksCallback();
        if (this.callbacks.onRackPlaced) {
          this.callbacks.onRackPlaced(px, pz, this.placementRotationY, pType);
        }
        this.cancelPlacementMode();
      } else {
        soundEngine.playStumble();
        this.callbacks.onFeedMessage?.('Blocked spot! Move into open camp ground.', 'warn');
      }
      return;
    }

    const prompt = this.computeNearestPrompt();
    if (!prompt) return;

    if (prompt.actionType === 'terminal') {
      soundEngine.playDrum();
      this.callbacks.onOpenTerminal?.();
      return;
    }

    if (prompt.actionType === 'pickup_crate' && !this.carriedCrate) {
      let bestIdx = -1;
      let bestDist = 3.2;
      for (let i = 0; i < this.dockCrates.length; i++) {
        const d = Math.hypot(this.playerX - this.dockCrates[i].x, this.playerZ - this.dockCrates[i].z);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      }
      if (bestIdx >= 0) {
        const picked = this.dockCrates.splice(bestIdx, 1)[0];
        this.scene.remove(picked.mesh);
        this.carriedCrate = { productType: picked.productType, units: picked.units };
        if (this.carriedBoxMesh) this.carriedBoxMesh.visible = true;
        soundEngine.playGather();
        this.callbacks.onCarriedChange?.(this.carriedCrate);
        this.callbacks.onDockCountChange?.(this.dockCrates.length);
        this.callbacks.onCratePickedUp?.(picked.productType, picked.units);
      }
      return;
    }

    if (prompt.actionType === 'stock_rack' && this.carriedCrate) {
      const rack = this.findNearestRack(3.2, this.carriedCrate.productType);
      if (rack) {
        const space = rack.maxStock - rack.stock;
        const added = Math.min(space, this.carriedCrate.units);
        if (added > 0) {
          rack.stock += added;
          this.refreshRackVisuals(rack);
          this.carriedCrate.units -= added;
          soundEngine.playGemCollect(rack.stock);
          this.callbacks.onRackStocked?.(rack.productType, added);
          if (this.carriedCrate.units <= 0) {
            this.carriedCrate = null;
            if (this.carriedBoxMesh) this.carriedBoxMesh.visible = false;
          }
          this.callbacks.onCarriedChange?.(this.carriedCrate);
          this.syncRacksCallback();
        }
      }
      return;
    }

    if (prompt.actionType === 'checkout') {
      this.completeFrontCustomerTrade();
      return;
    }

    if (prompt.actionType === 'forage') {
      for (const node of this.forageNodes) {
        if (node.cooldown <= 0 && Math.hypot(this.playerX - node.x, this.playerZ - node.z) < 2.8) {
          node.cooldown = 14;
          node.mesh.scale.setScalar(0.5);
          this.spawnDockCrate(node.productType, 4);
          soundEngine.playGather();
          this.callbacks.onForageCollected?.(node.productType);
          this.callbacks.onFeedMessage?.(`Foraged ${SIM_CATALOG[node.productType].name} crate delivered to Dock!`, 'good');
          break;
        }
      }
    }
  }

  public completeFrontCustomerTrade() {
    const queue = this.getQueueCustomers();
    if (queue.length === 0) return;

    const front = queue[0];
    const totalShells = front.basket.reduce((s, i) => s + i.qty * i.unitPrice, 0);
    const totalItems = front.basket.reduce((s, i) => s + i.qty, 0);
    const checkout: SimCheckoutState = {
      customerName: front.name,
      customerTribe: front.tribe,
      items: front.basket,
      totalShells,
      scannedCount: totalItems,
      totalItems,
    };

    front.state = 'leaving';
    front.targetX = 4;
    front.targetZ = -20;

    soundEngine.playDiscovery();
    this.triggerMythSurge(20, 1.3);
    this.callbacks.onTradeCompleted?.(checkout);
    this.syncQueueCallback();
  }

  private getQueueCustomers(): CustomerEntity[] {
    return this.customers.filter(c => c.state === 'queuing');
  }

  private findNearestRack(maxDist: number, matchType?: SimProductType): RackEntity | null {
    let best: RackEntity | null = null;
    let bestD = maxDist;
    for (const r of this.racks) {
      if (matchType && r.productType !== matchType) continue;
      if (r.stock >= r.maxStock) continue;
      const d = Math.hypot(this.playerX - r.x, this.playerZ - r.z);
      if (d < bestD) {
        bestD = d;
        best = r;
      }
    }
    return best;
  }

  private computeNearestPrompt(): SimInteractionPrompt | null {
    if (this.placementMode) {
      return {
        key: 'E',
        label: this.placementPreviewValid ? 'Place Camp Rack' : 'Blocked Area',
        sublabel: '[R] Rotate · [Esc] Cancel',
        actionType: 'place_rack',
      };
    }

    // Check Barter Counter Checkout (player stands near serve zone at 5.1, 5.1)
    const queue = this.getQueueCustomers();
    if (queue.length > 0 && Math.hypot(this.playerX - 4.9, this.playerZ - 5.0) < 3.6) {
      const total = queue[0].basket.reduce((s, i) => s + i.qty * i.unitPrice, 0);
      return {
        key: 'E',
        label: `Complete Trade with ${queue[0].name} (+${total} Shells)`,
        sublabel: `${queue[0].tribe} · Barter & Coinage`,
        actionType: 'checkout',
      };
    }

    // Check Stocking Rack if carrying crate
    if (this.carriedCrate) {
      const rack = this.findNearestRack(3.2, this.carriedCrate.productType);
      if (rack) {
        return {
          key: 'E',
          label: `Stock ${rack.label} (${rack.stock}/${rack.maxStock})`,
          sublabel: `Carrying ${this.carriedCrate.units} units`,
          actionType: 'stock_rack',
        };
      }
    }

    // Check Picking Up Crate from Dock
    if (!this.carriedCrate) {
      for (const c of this.dockCrates) {
        if (Math.hypot(this.playerX - c.x, this.playerZ - c.z) < 3.0) {
          return {
            key: 'E',
            label: `Pick Up ${SIM_CATALOG[c.productType].name} Crate`,
            sublabel: `${c.units} units · Carry to matching rack`,
            actionType: 'pickup_crate',
          };
        }
      }
    }

    // Check Terminal Pedestal (6.5, -0.5)
    if (Math.hypot(this.playerX - 6.5, this.playerZ - (-0.5)) < 2.8) {
      return {
        key: 'E',
        label: 'Open Chronicle & Supply Terminal',
        sublabel: 'Order crates, buy racks, hire band helpers',
        actionType: 'terminal',
      };
    }

    // Check Forage Nodes
    for (const node of this.forageNodes) {
      if (node.cooldown <= 0 && Math.hypot(this.playerX - node.x, this.playerZ - node.z) < 2.8) {
        return {
          key: 'E',
          label: `Forage Wild ${SIM_CATALOG[node.productType].name}`,
          sublabel: 'Sends free supply crate to Riverbank Dock',
          actionType: 'forage',
        };
      }
    }

    return null;
  }

  private syncRacksCallback() {
    if (this.callbacks.onRacksUpdate) {
      this.callbacks.onRacksUpdate(
        this.racks.map(r => ({
          id: r.id,
          label: r.label,
          productType: r.productType,
          stock: r.stock,
          maxStock: r.maxStock,
          price: r.price,
          x: r.x,
          z: r.z,
          rotationY: r.rotationY,
        }))
      );
    }
  }

  private syncQueueCallback() {
    const queue = this.getQueueCustomers();
    const front = queue[0]
      ? {
          customerName: queue[0].name,
          customerTribe: queue[0].tribe,
          items: queue[0].basket,
          totalShells: queue[0].basket.reduce((s, i) => s + i.qty * i.unitPrice, 0),
          scannedCount: 0,
          totalItems: queue[0].basket.reduce((s, i) => s + i.qty, 0),
        }
      : null;
    this.callbacks.onQueueChange?.(queue.length, front);
  }

  // --- BUMP & 2-BUMP RESPAWN ---

  private handleHazardBump(type: 'boulder' | 'predator') {
    if (this.respawnInvulnTimer > 0 || this.bumpCooldownTimer > 0) return;

    this.bumpCooldownTimer = 1.1;
    this.cameraShakeTimer = 0.45;
    this.bumpCount += 1;

    // Physical knockback away from northern hazard zone
    this.playerZ = Math.min(8, this.playerZ + 2.4);

    if (this.bumpCount >= 2) {
      this.callbacks.onBump?.(type, 2, true);
      this.triggerRespawn();
    } else {
      soundEngine.playStumble();
      soundEngine.playBeastRoar();
      this.callbacks.onBump?.(type, 1, false);
    }
  }

  public triggerRespawn() {
    this.bumpCount = 0;
    this.playerX = 0;
    this.playerY = 0;
    this.playerZ = 3.2;
    this.playerVelY = 0;
    this.isJumping = false;
    this.respawnInvulnTimer = 3.2;
    this.cameraShakeTimer = 0;
    soundEngine.playRespawn();
    this.callbacks.onRespawn?.();
  }

  // --- MAIN UPDATE LOOP ---

  public update(dt: number, controls: World3DControls) {
    // Flame flicker
    if (this.campfireFlameMesh) {
      const s = 0.9 + Math.sin(Date.now() * 0.015) * 0.14;
      this.campfireFlameMesh.scale.set(1, s, 1);
    }

    if (this.isTitleMode) {
      const t = Date.now() * 0.00025;
      this.camera.position.set(Math.sin(t) * 15, 7.2, Math.cos(t) * 15);
      this.camera.lookAt(0, 1.3, 1);
      return;
    }

    // Camera yaw rotate via Q/E-like turn keys if pressed
    if (controls.turnLeft) this.camYaw += 2.1 * dt;
    if (controls.turnRight) this.camYaw -= 2.1 * dt;

    // Player movement relative to camera yaw
    let moveX = 0;
    let moveZ = 0;
    if (controls.forward) moveZ -= 1;
    if (controls.backward) moveZ += 1;
    if (controls.left) moveX -= 1;
    if (controls.right) moveX += 1;

    const isMoving = moveX !== 0 || moveZ !== 0;
    if (isMoving) {
      const len = Math.hypot(moveX, moveZ);
      moveX /= len;
      moveZ /= len;

      const sinY = Math.sin(this.camYaw);
      const cosY = Math.cos(this.camYaw);
      const worldDirX = moveX * cosY + moveZ * sinY;
      const worldDirZ = -moveX * sinY + moveZ * cosY;

      const speed = controls.sprint ? 10.5 : 6.8;
      this.playerX += worldDirX * speed * dt;
      this.playerZ += worldDirZ * speed * dt;

      // Clamp to playable wilderness bounds
      this.playerX = Math.max(-13.5, Math.min(20, this.playerX));
      this.playerZ = Math.max(-22, Math.min(13, this.playerZ));

      const targetYaw = Math.atan2(worldDirX, worldDirZ);
      let diff = targetYaw - this.playerYaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.playerYaw += diff * Math.min(1, dt * 12);

      this.walkPhase += dt * (controls.sprint ? 14 : 9);
    }

    // Jump physics
    if (controls.jump && !this.isJumping) {
      this.isJumping = true;
      this.playerVelY = 7.4;
      soundEngine.playJumpSound();
    }
    if (this.isJumping) {
      this.playerY += this.playerVelY * dt;
      this.playerVelY -= 19.5 * dt;
      if (this.playerY <= 0) {
        this.playerY = 0;
        this.playerVelY = 0;
        this.isJumping = false;
      }
    }

    // Apply player transform & gait animation
    this.playerGroup.position.set(this.playerX, this.playerY, this.playerZ);
    this.playerGroup.rotation.y = this.playerYaw;

    const swing = isMoving ? Math.sin(this.walkPhase) * 0.55 : 0;
    if (this.leftLegMesh && this.rightLegMesh) {
      this.leftLegMesh.rotation.x = swing;
      this.rightLegMesh.rotation.x = -swing;
    }
    if (this.leftArmMesh && this.rightArmMesh) {
      if (this.carriedCrate) {
        this.leftArmMesh.rotation.x = -0.95;
        this.rightArmMesh.rotation.x = -0.95;
      } else {
        this.leftArmMesh.rotation.x = -swing * 0.7;
        this.rightArmMesh.rotation.x = swing * 0.7;
      }
    }

    // Invulnerability Halo & Cooldowns
    if (this.bumpCooldownTimer > 0) this.bumpCooldownTimer -= dt;
    if (this.respawnInvulnTimer > 0) {
      this.respawnInvulnTimer -= dt;
      if (this.invulnRingMesh) {
        this.invulnRingMesh.visible = true;
        (this.invulnRingMesh.material as THREE.MeshBasicMaterial).opacity =
          0.45 + Math.sin(Date.now() * 0.015) * 0.3;
        this.invulnRingMesh.rotation.z += dt * 4;
      }
    } else if (this.invulnRingMesh) {
      this.invulnRingMesh.visible = false;
    }

    // Placement Mode Hologram Preview
    if (this.placementMode && this.placementPreviewMesh) {
      const px = Math.round((this.playerX + Math.sin(this.playerYaw) * 2.1) * 2) / 2;
      const pz = Math.round((this.playerZ + Math.cos(this.playerYaw) * 2.1) * 2) / 2;
      this.placementPreviewValid = isPlacementValid(
        px,
        pz,
        this.expansionTier,
        this.racks.map(r => ({ x: r.x, z: r.z }))
      );
      this.placementPreviewMesh.visible = true;
      this.placementPreviewMesh.position.set(px, 0, pz);
      this.placementPreviewMesh.rotation.y = this.placementRotationY;
      const mat = (this.placementPreviewMesh.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial;
      mat.color.setHex(this.placementPreviewValid ? 0x22c55e : 0xef4444);
    }

    // Forage Nodes Cooldown Recovery
    for (const node of this.forageNodes) {
      if (node.cooldown > 0) {
        node.cooldown -= dt;
        if (node.cooldown <= 0) {
          node.cooldown = 0;
          node.mesh.scale.setScalar(1.0);
        }
      }
    }

    // Wilderness Hazards & 2-Bump Collision Check
    for (const h of this.hazards) {
      h.phase += dt * (h.type === 'predator' ? 1.3 : 1.8);
      if (h.type === 'predator') {
        h.x = Math.sin(h.phase * 0.7) * 9.5;
        h.z = -16.5 + Math.cos(h.phase * 0.7) * 2.5;
        h.mesh.position.set(h.x, Math.abs(Math.sin(h.phase * 4)) * 0.22, h.z);
        h.mesh.rotation.y = Math.cos(h.phase * 0.7) > 0 ? Math.PI / 2 : -Math.PI / 2;
      } else {
        h.x = h.baseX + Math.sin(h.phase) * 3.2;
        h.z = h.baseZ;
        h.mesh.position.set(h.x, 0, h.z);
        h.mesh.rotation.z -= Math.cos(h.phase) * dt * 2.5;
      }

      if (Math.hypot(this.playerX - h.x, this.playerZ - h.z) < 1.5 && this.playerY < 1.1) {
        this.handleHazardBump(h.type);
      }
    }

    // AI Customers (Browse Racks -> Queue at Barter Counter)
    this.updateCustomers(dt);

    // Hired Staff NPCs
    this.updateStaff(dt);

    // Sync Context Interaction Prompt (throttled ~10Hz)
    this.promptSyncTimer += dt;
    if (this.promptSyncTimer >= 0.1) {
      this.promptSyncTimer = 0;
      const prompt = this.computeNearestPrompt();
      const keyStr = prompt ? `${prompt.actionType}:${prompt.label}` : '';
      if (keyStr !== this.lastPromptKey) {
        this.lastPromptKey = keyStr;
        this.callbacks.onPromptChange?.(prompt);
      }
    }

    // Myth Surge GLSL Shader & Round Ember Particle Vortex
    if (this.mythSurgeParticles && this.mythParticleShaderMat) {
      if (this.mythSurgeIntensity > 0) {
        this.mythSurgeIntensity = Math.max(0, this.mythSurgeIntensity - dt * 0.45);
        this.mythParticleShaderMat.uniforms.uOpacity.value = Math.min(0.85, this.mythSurgeIntensity * 0.65);

        const pos = this.mythSurgeParticles.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < this.mythSurgeParticleCount; i++) {
          const meta = this.mythParticleMeta[i];
          meta.angle += dt * meta.spin;
          let y = pos[i * 3 + 1] + meta.speedY * dt;
          if (y > 4.2) y = 0.1;
          pos[i * 3 + 1] = y;
          const r = meta.radius * (0.95 + (y / 4.2) * 0.45);
          pos[i * 3 + 0] = this.playerX + Math.cos(meta.angle) * r;
          pos[i * 3 + 2] = this.playerZ + Math.sin(meta.angle) * r;
        }
        this.mythSurgeParticles.geometry.attributes.position.needsUpdate = true;
      } else {
        this.mythParticleShaderMat.uniforms.uOpacity.value = 0;
      }
    }

    if (this.mythSurgeShockwaveMesh && this.mythSurgeShaderMat) {
      if (this.mythSurgeIntensity > 0) {
        this.mythSurgeShockwaveRadius = (this.mythSurgeShockwaveRadius + dt * 0.85) % 1.0;
        this.mythSurgeShockwaveMesh.visible = true;
        this.mythSurgeShockwaveMesh.position.set(this.playerX, 0.09, this.playerZ);
        this.mythSurgeShaderMat.uniforms.uTime.value += dt;
        this.mythSurgeShaderMat.uniforms.uIntensity.value = Math.min(1.0, this.mythSurgeIntensity);
        this.mythSurgeShaderMat.uniforms.uWaveProgress.value = this.mythSurgeShockwaveRadius;
      } else {
        this.mythSurgeShockwaveMesh.visible = false;
        this.mythSurgeShaderMat.uniforms.uIntensity.value = 0;
      }
    }

    // Seasonal Weather Particles
    if (this.rainParticles) {
      if (this.weatherActive && (this.currentWeather === 'rain' || this.currentWeather === 'storm')) {
        const mat = this.rainParticles.material as THREE.PointsMaterial;
        mat.opacity += (0.72 - mat.opacity) * dt * 3;
        const pos = this.rainParticles.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < pos.length / 3; i++) {
          pos[i * 3 + 1] -= dt * 28.0;
          if (pos[i * 3 + 1] < 0) {
            pos[i * 3 + 1] = 20;
          }
        }
        this.rainParticles.geometry.attributes.position.needsUpdate = true;

        if (this.currentWeather === 'storm') {
          this.nextLightningTime -= dt;
          if (this.nextLightningTime <= 0) {
            this.nextLightningTime = 5.5 + Math.random() * 5.0;
            this.lightningTimer = 0.12;
            soundEngine.playThunder();
          }
          if (this.lightningTimer > 0) {
            this.lightningTimer -= dt;
            this.sunLight.intensity = 3.2;
          } else {
            this.sunLight.intensity = 1.15;
          }
        }
      } else {
        const mat = this.rainParticles.material as THREE.PointsMaterial;
        mat.opacity = Math.max(0, mat.opacity - dt * 2);
      }
    }

    // Migrating Animal Herd Motion
    if (this.activeAnimalMigration && this.migratingHerdGroup.children.length > 0) {
      for (const animal of this.migratingHerdGroup.children) {
        animal.position.z += 3.2 * dt;
        animal.position.y = Math.abs(Math.sin(Date.now() * 0.01)) * 0.18;
        if (animal.position.z > 28) animal.position.z = -30;
      }
    }

    // Camera Follow (1st or 3rd Person Simulator Camera)
    let shakeX = 0;
    let shakeY = 0;
    if (this.cameraShakeTimer > 0) {
      this.cameraShakeTimer -= dt;
      shakeX = (Math.random() - 0.5) * 0.35;
      shakeY = (Math.random() - 0.5) * 0.35;
    }

    if (this.firstPerson) {
      this.camera.position.set(this.playerX + shakeX, this.playerY + 1.65 + shakeY, this.playerZ);
      const lookX = this.playerX - Math.sin(this.camYaw) * 8;
      const lookZ = this.playerZ - Math.cos(this.camYaw) * 8;
      const lookY = this.playerY + 1.65 - Math.sin(this.camPitch - 0.3) * 4;
      this.camera.lookAt(lookX, lookY, lookZ);
    } else {
      const dist = 7.6;
      const camH = 3.4 + this.camPitch * 4.2;
      const targetCamX = this.playerX + Math.sin(this.camYaw) * dist + shakeX;
      const targetCamY = this.playerY + camH + shakeY;
      const targetCamZ = this.playerZ + Math.cos(this.camYaw) * dist;

      const smooth = 1 - Math.exp(-10 * dt);
      this.camera.position.x += (targetCamX - this.camera.position.x) * smooth;
      this.camera.position.y += (targetCamY - this.camera.position.y) * smooth;
      this.camera.position.z += (targetCamZ - this.camera.position.z) * smooth;
      this.camera.lookAt(this.playerX, this.playerY + 1.35, this.playerZ - 1.5);
    }
  }

  private updateCustomers(dt: number) {
    // Spawn visiting tribespeople when Camp is Open
    if (this.isCampOpen && this.customers.length < 4) {
      this.customerSpawnTimer -= dt;
      if (this.customerSpawnTimer <= 0) {
        this.customerSpawnTimer = 4.2 + Math.random() * 2.5;
        const stocked = this.racks.filter(r => r.stock > 0);
        if (stocked.length > 0) {
          const targetRack = stocked[Math.floor(Math.random() * stocked.length)];
          const profile = CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)];
          const mesh = this.createHumanoidMesh(0xa37351, 0x7c4829, false);
          mesh.position.set(2.5, 0, -13);
          this.scene.add(mesh);

          this.customers.push({
            id: `cust_${Date.now()}_${Math.random()}`,
            name: profile.name,
            tribe: profile.tribe,
            state: 'browsing',
            targetRackId: targetRack.id,
            targetX: targetRack.x,
            targetZ: targetRack.z + 1.3,
            basket: [],
            waitTimer: 1.0,
            mesh,
          });
        }
      }
    }

    let queueChanged = false;
    for (let i = this.customers.length - 1; i >= 0; i--) {
      const c = this.customers[i];
      const dx = c.targetX - c.mesh.position.x;
      const dz = c.targetZ - c.mesh.position.z;
      const dist = Math.hypot(dx, dz);

      if (dist > 0.25) {
        const step = Math.min(dist, 3.2 * dt);
        c.mesh.position.x += (dx / dist) * step;
        c.mesh.position.z += (dz / dist) * step;
        c.mesh.rotation.y = Math.atan2(dx, dz);
      } else {
        if (c.state === 'browsing') {
          c.waitTimer -= dt;
          if (c.waitTimer <= 0) {
            const rack = this.racks.find(r => r.id === c.targetRackId);
            if (rack && rack.stock > 0) {
              const qty = Math.min(rack.stock, 1 + Math.floor(Math.random() * 2));
              rack.stock -= qty;
              this.refreshRackVisuals(rack);
              c.basket.push({ productType: rack.productType, qty, unitPrice: rack.price });
              this.syncRacksCallback();

              const qIndex = this.getQueueCustomers().length;
              c.state = 'queuing';
              c.targetX = 4.2 - qIndex * 0.48;
              c.targetZ = 2.3 - qIndex * 1.3;
              queueChanged = true;
            } else {
              c.state = 'leaving';
              c.targetX = 3;
              c.targetZ = -18;
            }
          }
        } else if (c.state === 'queuing') {
          const queueList = this.getQueueCustomers();
          const idx = queueList.indexOf(c);
          c.targetX = 4.2 - idx * 0.48;
          c.targetZ = 2.3 - idx * 1.3;
          c.mesh.rotation.y = -0.35;
        } else if (c.state === 'leaving') {
          this.scene.remove(c.mesh);
          this.customers.splice(i, 1);
        }
      }
    }

    if (queueChanged) {
      this.syncQueueCallback();
    }
  }

  private updateStaff(dt: number) {
    // 1. Gatherer & Restocker NPC
    if (this.restockerHired && this.restockerMesh) {
      if (this.restockerTask.phase === 'idle') {
        // Look for a dock crate whose matching rack has space
        for (const crate of this.dockCrates) {
          const rack = this.racks.find(r => r.productType === crate.productType && r.stock < r.maxStock);
          if (rack) {
            this.restockerTask = { phase: 'to_dock', crate, rack };
            break;
          }
        }
      } else if (this.restockerTask.phase === 'to_dock' && this.restockerTask.crate) {
        const c = this.restockerTask.crate;
        const dx = c.x - this.restockerMesh.position.x;
        const dz = c.z - this.restockerMesh.position.z;
        const d = Math.hypot(dx, dz);
        if (d > 0.6) {
          this.restockerMesh.position.x += (dx / d) * 3.8 * dt;
          this.restockerMesh.position.z += (dz / d) * 3.8 * dt;
          this.restockerMesh.rotation.y = Math.atan2(dx, dz);
        } else {
          const idx = this.dockCrates.indexOf(c);
          if (idx >= 0) {
            this.dockCrates.splice(idx, 1);
            this.scene.remove(c.mesh);
            this.callbacks.onDockCountChange?.(this.dockCrates.length);
            this.restockerTask.carried = { productType: c.productType, units: c.units };
            this.restockerTask.phase = 'to_rack';
          } else {
            this.restockerTask = { phase: 'idle' };
          }
        }
      } else if (this.restockerTask.phase === 'to_rack' && this.restockerTask.rack && this.restockerTask.carried) {
        const r = this.restockerTask.rack;
        const dx = r.x - this.restockerMesh.position.x;
        const dz = r.z - this.restockerMesh.position.z;
        const d = Math.hypot(dx, dz);
        if (d > 1.0) {
          this.restockerMesh.position.x += (dx / d) * 3.8 * dt;
          this.restockerMesh.position.z += (dz / d) * 3.8 * dt;
          this.restockerMesh.rotation.y = Math.atan2(dx, dz);
        } else {
          const add = Math.min(r.maxStock - r.stock, this.restockerTask.carried.units);
          r.stock += add;
          this.refreshRackVisuals(r);
          this.syncRacksCallback();
          this.callbacks.onFeedMessage?.(`Helper restocked ${r.label} (+${add})`, 'good');
          this.restockerTask = { phase: 'idle' };
        }
      }
    }

    // 2. Sumerian Barter Scribe NPC
    if (this.bartererHired && this.bartererMesh) {
      const queue = this.getQueueCustomers();
      if (queue.length > 0 && Math.hypot(queue[0].mesh.position.x - 4.2, queue[0].mesh.position.z - 2.3) < 0.7) {
        this.bartererTimer += dt;
        if (this.bartererTimer >= 2.2) {
          this.bartererTimer = 0;
          this.completeFrontCustomerTrade();
        }
      } else {
        this.bartererTimer = 0;
      }
    }
  }

  // --- POINTER ORBIT & LIFECYCLE ---

  private setupPointerOrbit() {
    const dom = this.renderer.domElement;
    dom.addEventListener('pointerdown', e => {
      this.isDraggingCamera = true;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
    });
    window.addEventListener('pointermove', e => {
      if (!this.isDraggingCamera || this.isTitleMode) return;
      const dx = e.clientX - this.lastPointerX;
      const dy = e.clientY - this.lastPointerY;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
      this.camYaw -= dx * 0.006;
      this.camPitch = Math.max(0.1, Math.min(0.95, this.camPitch + dy * 0.004));
    });
    window.addEventListener('pointerup', () => {
      this.isDraggingCamera = false;
    });
  }

  private startLoop() {
    const tick = () => {
      this.renderer.render(this.scene, this.camera);
      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.animFrameId = requestAnimationFrame(tick);
      }
    };
    if (this.isSoftwareGl) {
      this.afterDraw(tick);
    } else {
      this.animFrameId = requestAnimationFrame(tick);
    }
  }

  private afterDraw(callback: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.animFrameId = window.setTimeout(poll, 6);
      } else {
        if (sync) gl.deleteSync(sync);
        this.animFrameId = window.setTimeout(callback, 45);
      }
    };
    this.animFrameId = window.setTimeout(poll, 6);
  }

  private onWindowResize = () => {
    if (!this.container) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public dispose() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      clearTimeout(this.animFrameId);
    }
    window.removeEventListener('resize', this.onWindowResize);
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
