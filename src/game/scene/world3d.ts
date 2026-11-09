import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { HistoricalEra, LandmarkInfo, SapiensLandscape } from '../../types/game';
import { WORLD_LANDMARKS } from '../rules';

export interface World3DControls {
  forward?: boolean;
  backward?: boolean;
  left?: boolean;
  right?: boolean;
  action?: boolean;
  sprint?: boolean;
  jump?: boolean;
  slide?: boolean;
  laneLeft?: boolean;
  laneRight?: boolean;
}

export interface PickupItem {
  id: string;
  type: 'flint' | 'berries' | 'ivory' | 'amber';
  x: number;
  z: number;
  mesh: THREE.Group;
  completed: boolean;
}

export interface ObstacleItem {
  id: string;
  type: 'jump' | 'slide' | 'block';
  lane: -1 | 0 | 1;
  z: number;
  mesh: THREE.Group;
  cleared: boolean;
  hit: boolean;
}

export interface PowerUpItem {
  id: string;
  type: 'magnet' | 'shield' | 'surge';
  lane: -1 | 0 | 1;
  z: number;
  mesh: THREE.Group;
  collected: boolean;
}

export interface DilemmaGateItem {
  id: string;
  dilemmaId: string;
  leftChoiceTitle: string;
  rightChoiceTitle: string;
  z: number;
  mesh: THREE.Group;
  passed: boolean;
}

export interface World3DCallbacks {
  onPickup?: (type: 'flint' | 'berries' | 'ivory' | 'amber') => void;
  onPowerUp?: (type: 'magnet' | 'shield' | 'surge') => void;
  onObstacleHit?: (shieldAbsorbed: boolean) => void;
  onBump?: (obstacleType: 'jump' | 'slide' | 'block', bumpNumber: number, isSecondBump: boolean) => void;
  onRespawn?: () => void;
  onJump?: () => void;
  onSlide?: () => void;
  onLaneChange?: (lane: number) => void;
  onDilemmaGate?: (dilemmaId: string, choiceIndex: 0 | 1) => void;
  onDistanceUpdate?: (distance: number, speed: number) => void;
  onBeastAlert?: (isAlert: boolean) => void;
  onGameOver?: (reason: string) => void;
}

export class World3D {
  public container: HTMLElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;

  // Render & Loop State
  private isSoftwareGl: boolean = false;
  private animFrameId: number = 0;
  private isTitleMode: boolean = true;
  private currentLandscape: SapiensLandscape = 'river_meadow';
  private currentWeather: 'clear_sun' | 'rain' | 'storm' | 'mist' = 'clear_sun';
  private weatherActive: boolean = false;
  private lightningTimer: number = 0;
  private nextLightningTime: number = 5.0;

  // Temple Run Lane Coordinates: Left (-2.4), Center (0), Right (+2.4)
  public static readonly LANE_WIDTH = 2.4;
  private currentLane: -1 | 0 | 1 = 0;
  private playerTargetX: number = 0;
  private playerX: number = 0;
  private playerY: number = 0;
  private playerZ: number = 0;
  private prevPlayerZ: number = 0;

  // Collision & 2-Bump Respawn Tracking
  private bumpCount: number = 0;
  private respawnInvulnerableTimer: number = 0;
  private cameraShakeTimer: number = 0;
  private invulnRingMesh: THREE.Mesh | null = null;
  private damageFlashTimer: number = 0;

  // Environmental Effects
  private rainParticles: THREE.Points | null = null;
  private migratingHerdGroup: THREE.Group = new THREE.Group();
  private activeAnimalMigration: 'mammoths' | 'gazelles' | null = null;

  // Physics & Locomotion
  private baseSpeed: number = 17.0;
  private currentSpeed: number = 17.0;
  private distanceTraveled: number = 0;
  private isJumping: boolean = false;
  private jumpTimer: number = 0;
  private jumpDuration: number = 0.65;
  private isSliding: boolean = false;
  private slideTimer: number = 0;
  private slideDuration: number = 0.68;
  private isSprinting: boolean = false;

  // Power-Ups Active State
  private activePowerUp: 'magnet' | 'shield' | 'surge' | null = null;
  private powerUpTimeLeft: number = 0;
  private shieldMesh: THREE.Mesh | null = null;

  // Pursuer: The Legendary Prehistoric Sabertooth Cat
  private beastGroup: THREE.Group = new THREE.Group();
  private beastDistance: number = 10.5;
  private beastTargetDistance: number = 10.5;
  private beastAlertTimer: number = 0;

  // Sapiens Human Chieftain Model
  private playerGroup: THREE.Group = new THREE.Group();
  private leftLegMesh: THREE.Mesh | null = null;
  private rightLegMesh: THREE.Mesh | null = null;
  private rightArmMesh: THREE.Mesh | null = null;
  private spearMesh: THREE.Group | null = null;

  // Track Segments (Procedural Infinite Lush Earth Trail)
  private trackSegments: THREE.Group[] = [];
  private static readonly SEGMENT_LENGTH = 38;
  private static readonly NUM_SEGMENTS = 8;
  private nextSegmentZ: number = 0;

  // Active Runner Items
  private pickups: PickupItem[] = [];
  private obstacles: ObstacleItem[] = [];
  private powerUps: PowerUpItem[] = [];
  private dilemmaGates: DilemmaGateItem[] = [];

  // Lighting references for natural Earth sun
  private sunLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;

  // Callbacks & Touch/Swipe Tracking
  private callbacks: World3DCallbacks = {};
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private isTouching: boolean = false;

  constructor(
    container: HTMLElement,
    onPickupOrCallbacks?:
      | ((type: 'flint' | 'berries' | 'ivory' | 'amber') => void)
      | World3DCallbacks,
    onJumpLegacy?: () => void,
    onSlideLegacy?: () => void
  ) {
    this.container = container;

    if (typeof onPickupOrCallbacks === 'function') {
      this.callbacks = {
        onPickup: onPickupOrCallbacks,
        onJump: onJumpLegacy,
        onSlide: onSlideLegacy,
      };
    } else if (onPickupOrCallbacks) {
      this.callbacks = onPickupOrCallbacks;
    }

    // 1. Detect Software WebGL
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

    // 2. High-Performance Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2)
    );
    this.renderer.setSize(
      container.clientWidth || window.innerWidth,
      container.clientHeight || window.innerHeight
    );
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // 3. Scene & Natural Atmosphere (Warm Sunlit Earth, NOT all blue!)
    this.scene = new THREE.Scene();
    const skyColor = 0xa3c8b4; // Sunlit misty forest horizon
    this.scene.background = new THREE.Color(skyColor);
    this.scene.fog = new THREE.FogExp2(skyColor, 0.014);

    // 4. Studio Environment Lighting
    const pmremGen = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGen.fromScene(new RoomEnvironment()).texture;
    pmremGen.dispose();

    // Warm Golden Sun (Morning sun filtering through canopy like Image 3)
    this.sunLight = new THREE.DirectionalLight(0xfffae0, 1.85);
    this.sunLight.position.set(24, 45, -20);
    this.sunLight.castShadow = !this.isSoftwareGl;
    sunLightSetup: {
      this.sunLight.shadow.mapSize.width = 1024;
      this.sunLight.shadow.mapSize.height = 1024;
      this.sunLight.shadow.camera.near = 0.5;
      this.sunLight.shadow.camera.far = 120;
    }
    this.scene.add(this.sunLight);

    // Natural Sky & Earth Fill Light (Soft sky-blue & lush warm meadow grass bounce)
    this.hemiLight = new THREE.HemisphereLight(0xddeeff, 0x5a7d36, 1.05);
    this.scene.add(this.hemiLight);

    // 5. Camera Setup (Temple Run third-person view)
    this.camera = new THREE.PerspectiveCamera(
      56,
      (container.clientWidth || window.innerWidth) /
        (container.clientHeight || window.innerHeight),
      0.1,
      260
    );
    this.camera.position.set(0, 4.4, 7.5);
    this.camera.lookAt(0, 1.5, -6);

    // 6. Build Sapiens Human Chieftain Character
    this.playerGroup = this.createSapiensChieftainCharacter();
    this.scene.add(this.playerGroup);

    // 7. Build Pursuer Sabertooth Cat
    this.beastGroup = this.createSabertoothBeast();
    this.scene.add(this.beastGroup);

    // 8. Distant Mountain Arch & Valley Ridge (Inspired by Image 2)
    this.createDistantMountainArch();

    // 9. Build Initial Track Segments (Meadow, Wildflowers, Winding Stream, Water Lilies)
    this.initTrack();

    // 10. Input & Touch Listeners
    this.setupTouchAndSwipe();
    window.addEventListener('resize', this.onWindowResize);

    // 11. Start 60fps Loop
    this.startLoop();
  }

  // --- 1. DISTANT MOUNTAIN ARCH & VALLEY RIDGE (Image 2) ---

  private createDistantMountainArch() {
    const backdropGroup = new THREE.Group();

    // Distant mountain ranges with misty canyon
    const mountainMat = new THREE.MeshStandardMaterial({
      color: 0x48606c,
      roughness: 0.95,
      metalness: 0.05,
    });

    for (const side of [-1, 1]) {
      const ridge = new THREE.Mesh(new THREE.ConeGeometry(45, 65, 7), mountainMat);
      ridge.position.set(side * 65, 22, -150);
      ridge.scale.set(1.4, 1.0, 0.8);
      backdropGroup.add(ridge);
    }

    // Majestic Stone Bridge Arch framing the misty sky (Directly from Image 2)
    const archMat = new THREE.MeshStandardMaterial({
      color: 0x3d4a52,
      roughness: 0.9,
    });
    const archBeam = new THREE.Mesh(new THREE.TorusGeometry(32, 3.2, 6, 18, Math.PI * 0.65), archMat);
    archBeam.rotation.z = Math.PI * 0.18;
    archBeam.position.set(0, 16, -135);
    backdropGroup.add(archBeam);

    this.scene.add(backdropGroup);
  }

  // --- 2. PROCEDURAL 3-LANE RUNNER TRACK (Lush Earth, Wildflowers & Water Lilies) ---

  private initTrack() {
    this.nextSegmentZ = 18;
    for (let i = 0; i < World3D.NUM_SEGMENTS; i++) {
      const segZ = this.nextSegmentZ - i * World3D.SEGMENT_LENGTH;
      const seg = this.createTrackSegment(segZ, i === 0);
      this.trackSegments.push(seg);
      this.scene.add(seg);
    }
    this.nextSegmentZ -= World3D.NUM_SEGMENTS * World3D.SEGMENT_LENGTH;
  }

  private createTrackSegment(zPos: number, isInitialBuffer: boolean): THREE.Group {
    const seg = new THREE.Group();
    seg.position.z = zPos;

    // 1. Natural Stone & Earth Trail (Width 8.2m, Length 38m)
    const trailGeo = new THREE.PlaneGeometry(8.2, World3D.SEGMENT_LENGTH);
    trailGeo.rotateX(-Math.PI / 2);

    let trailColor = 0xb09c7a; // Sunlit sandstone & meadow dirt
    if (this.currentLandscape === 'wetland_oasis') trailColor = 0x8a927d; // Mossy riverside flagstone
    if (this.currentLandscape === 'mountain_pass') trailColor = 0x8f8476; // Mountain stone trail

    const trailMat = new THREE.MeshStandardMaterial({
      color: trailColor,
      roughness: 0.88,
      metalness: 0.05,
    });
    const trailMesh = new THREE.Mesh(trailGeo, trailMat);
    trailMesh.receiveShadow = !this.isSoftwareGl;
    seg.add(trailMesh);

    // Natural stone border curbs
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x5a4d3f, roughness: 0.92 });
    for (const side of [-4.2, 4.2]) {
      const curb = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.2, World3D.SEGMENT_LENGTH),
        curbMat
      );
      curb.position.set(side, 0.1, 0);
      seg.add(curb);
    }

    // 2. Lush Meadow Flanks with Rolling Green Banks (Inspired by Image 3)
    const meadowGeo = new THREE.PlaneGeometry(45, World3D.SEGMENT_LENGTH);
    meadowGeo.rotateX(-Math.PI / 2);
    const meadowMat = new THREE.MeshStandardMaterial({
      color: 0x4a7c2c, // Rich vibrant green grass
      roughness: 0.9,
    });

    const leftBank = new THREE.Mesh(meadowGeo, meadowMat);
    leftBank.position.set(-26.5, -0.05, 0);
    seg.add(leftBank);

    const rightBank = new THREE.Mesh(meadowGeo, meadowMat);
    rightBank.position.set(26.5, -0.05, 0);
    seg.add(rightBank);

    // 3. Winding Crystal Stream alongside track with Floating Water Lilies (Inspired by Image 1 & 3)
    const streamGeo = new THREE.PlaneGeometry(6.5, World3D.SEGMENT_LENGTH);
    streamGeo.rotateX(-Math.PI / 2);
    const streamMat = new THREE.MeshStandardMaterial({
      color: 0x2e6b66, // Clear sparkling turquoise-green pond water
      roughness: 0.12,
      metalness: 0.35,
    });
    const stream = new THREE.Mesh(streamGeo, streamMat);
    stream.position.set(7.8, -0.12, 0);
    seg.add(stream);

    // Floating Water Lily Pads & Lotus Blossoms (Directly from Image 1)
    for (let l = -12; l <= 12; l += 7) {
      const lilyPad = this.createWaterLilyCluster();
      lilyPad.position.set(7.8 + (Math.random() - 0.5) * 2.2, -0.08, l + (Math.random() - 0.5) * 2);
      seg.add(lilyPad);
    }

    // 4. Blooming Wildflower Beds along Banks (Red Poppies, Purple Lupines, Yellow Buttercups - Image 3)
    for (let f = -15; f <= 15; f += 5.5) {
      // Left flower bed
      const leftFlowers = this.createWildflowerCluster();
      leftFlowers.position.set(-4.8 - Math.random() * 2.5, 0, f);
      seg.add(leftFlowers);

      // Right bank flower bed
      const rightFlowers = this.createWildflowerCluster();
      rightFlowers.position.set(4.8 + Math.random() * 2.2, 0, f);
      seg.add(rightFlowers);
    }

    // 5. Sunlit Oak & Cedar Trees framing the canopy (Image 2 & 3)
    for (let t = -14; t <= 14; t += 12) {
      const leftTree = this.createSunlitCanopyTree();
      leftTree.position.set(-8.5 - Math.random() * 4, 0, t);
      seg.add(leftTree);

      const rightTree = this.createSunlitCanopyTree();
      rightTree.position.set(13.5 + Math.random() * 4, 0, t);
      seg.add(rightTree);
    }

    // 6. Populate Interactive Sapiens Runner Items (Pickups, Obstacles, Dilemma Gates)
    if (!isInitialBuffer) {
      this.populateSegmentItems(seg, zPos);
    }

    return seg;
  }

  // Water Lily Pad with Lotus Blossom (From Monet-inspired Image 1)
  private createWaterLilyCluster(): THREE.Group {
    const cluster = new THREE.Group();

    // 2-3 Green circular lily pads
    const padMat = new THREE.MeshStandardMaterial({
      color: 0x5a8838, // Yellow-green water lily pad
      roughness: 0.6,
    });
    for (let i = 0; i < 3; i++) {
      const pad = new THREE.Mesh(new THREE.CircleGeometry(0.55 + Math.random() * 0.25, 12), padMat);
      pad.rotateX(-Math.PI / 2);
      pad.position.set((i - 1) * 0.65, 0, (Math.random() - 0.5) * 0.4);
      cluster.add(pad);
    }

    // Open Lotus / Water Lily Flower (White/Yellow blossom)
    const flowerMat = new THREE.MeshStandardMaterial({
      color: 0xfffae0,
      emissive: 0xffea77,
      emissiveIntensity: 0.25,
      roughness: 0.3,
    });
    const flower = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), flowerMat);
    flower.position.set(0, 0.12, 0);
    cluster.add(flower);

    return cluster;
  }

  // Dense Clusters of Wildflowers (Crimson poppies, purple lupines, yellow buttercups - Image 3)
  private createWildflowerCluster(): THREE.Group {
    const cluster = new THREE.Group();

    const colors = [
      0xdd2222, // Crimson Poppy
      0x8833cc, // Purple Lupine
      0xffbb11, // Golden Buttercup
      0x2288ff, // Bluebell
    ];

    for (let i = 0; i < 8; i++) {
      const c = colors[Math.floor(Math.random() * colors.length)];
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.45, 4),
        new THREE.MeshStandardMaterial({ color: 0x336622 })
      );
      const px = (Math.random() - 0.5) * 1.8;
      const pz = (Math.random() - 0.5) * 1.8;
      stem.position.set(px, 0.22, pz);
      cluster.add(stem);

      const blossom = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 5, 5),
        new THREE.MeshStandardMaterial({ color: c, roughness: 0.4 })
      );
      blossom.position.set(px, 0.46, pz);
      cluster.add(blossom);
    }

    return cluster;
  }

  // Majestic Sunlit Canopy Tree (Inspired by Images 2 and 3)
  private createSunlitCanopyTree(): THREE.Group {
    const tree = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a3424, roughness: 0.95 });

    // Trunk with natural slight curve (like Image 2)
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.85, 6.5, 7), woodMat);
    trunk.position.y = 3.25;
    trunk.rotation.z = (Math.random() - 0.5) * 0.18;
    tree.add(trunk);

    // Warm sun-kissed leafy foliage (Yellow-green & golden autumn tones - Image 2 & 3)
    const isGoldenAutumn = Math.random() > 0.5;
    const leafMat = new THREE.MeshStandardMaterial({
      color: isGoldenAutumn ? 0xc49d28 : 0x558f32,
      roughness: 0.85,
    });

    for (let i = 0; i < 4; i++) {
      const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(2.2 + Math.random() * 0.8, 1), leafMat);
      foliage.position.set(
        (Math.random() - 0.5) * 2.2,
        6.2 + i * 1.1,
        (Math.random() - 0.5) * 2.2
      );
      tree.add(foliage);
    }

    return tree;
  }

  // --- 3. POPULATE SAPIENS INTERACTIVE ITEMS & OBSTACLES ---

  private populateSegmentItems(seg: THREE.Group, segZ: number) {
    const lanes: Array<-1 | 0 | 1> = [-1, 0, 1];

    // 1. Dilemma Totem Gate (every ~180-240m)
    const shouldSpawnGate =
      Math.abs(segZ) > 100 &&
      Math.floor(Math.abs(segZ) / 180) !== Math.floor(Math.abs(segZ - World3D.SEGMENT_LENGTH) / 180);

    if (shouldSpawnGate) {
      const gate = this.createSapiensDilemmaGate();
      gate.position.set(0, 0, 0);
      seg.add(gate);

      this.dilemmaGates.push({
        id: `gate_${Math.abs(segZ)}`,
        dilemmaId: 'gossip_vs_foraging',
        leftChoiceTitle: 'Gossip Alliance',
        rightChoiceTitle: 'Strict Foraging',
        z: segZ,
        mesh: gate,
        passed: false,
      });
      return;
    }

    // 2. Obstacles (Fallen mossy log jump, Ancient stone arch slide, Limestone boulder block)
    const obstacleLane = lanes[Math.floor(Math.random() * lanes.length)];
    const roll = Math.random();
    const obsType: 'jump' | 'slide' | 'block' =
      roll < 0.42 ? 'jump' : roll < 0.78 ? 'slide' : 'block';

    const obsMesh = this.createObstacleMesh(obsType);
    obsMesh.position.set(obstacleLane * World3D.LANE_WIDTH, 0, 4);
    seg.add(obsMesh);

    this.obstacles.push({
      id: `obs_${Math.random()}`,
      type: obsType,
      lane: obstacleLane,
      z: segZ + 4,
      mesh: obsMesh,
      cleared: false,
      hit: false,
    });

    // 3. Golden Amber Gem Pickups (Arcs in free lanes)
    const freeLanes = lanes.filter(l => l !== obstacleLane);
    const gemLane = freeLanes[Math.floor(Math.random() * freeLanes.length)];

    for (let g = -10; g <= 10; g += 3.5) {
      const gemMesh = this.createAmberGemMesh();
      gemMesh.position.set(gemLane * World3D.LANE_WIDTH, 0.65, g);
      seg.add(gemMesh);

      this.pickups.push({
        id: `gem_${Math.random()}`,
        type: 'amber',
        x: gemLane * World3D.LANE_WIDTH,
        z: segZ + g,
        mesh: gemMesh,
        completed: false,
      });
    }

    // 4. Special Prehistoric Pickups & Power-Ups
    const pRoll = Math.random();
    if (pRoll < 0.28) {
      const pType: 'magnet' | 'shield' | 'surge' =
        pRoll < 0.12 ? 'magnet' : pRoll < 0.2 ? 'shield' : 'surge';
      const pLane = lanes[Math.floor(Math.random() * lanes.length)];
      const pMesh = this.createPowerUpMesh(pType);
      pMesh.position.set(pLane * World3D.LANE_WIDTH, 0.85, -8);
      seg.add(pMesh);

      this.powerUps.push({
        id: `pw_${Math.random()}`,
        type: pType,
        lane: pLane,
        z: segZ - 8,
        mesh: pMesh,
        collected: false,
      });
    } else if (pRoll < 0.55) {
      const resType: 'berries' | 'flint' | 'ivory' =
        pRoll < 0.38 ? 'berries' : pRoll < 0.48 ? 'flint' : 'ivory';
      const rLane = lanes[Math.floor(Math.random() * lanes.length)];
      const rMesh = this.createResourceMesh(resType);
      rMesh.position.set(rLane * World3D.LANE_WIDTH, 0.45, -8);
      seg.add(rMesh);

      this.pickups.push({
        id: `res_${Math.random()}`,
        type: resType,
        x: rLane * World3D.LANE_WIDTH,
        z: segZ - 8,
        mesh: rMesh,
        completed: false,
      });
    }
  }

  // Prehistoric Obstacles (Mossy fallen log, Ancient stone arch, Boulder)
  private createObstacleMesh(type: 'jump' | 'slide' | 'block'): THREE.Group {
    const group = new THREE.Group();

    if (type === 'jump') {
      // Fallen mossy oak trunk across the lane
      const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a3422, roughness: 0.95 });
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 2.3, 7), woodMat);
      log.rotation.z = Math.PI / 2;
      log.position.y = 0.34;
      group.add(log);

      // Soft green moss on top
      const mossMat = new THREE.MeshStandardMaterial({ color: 0x4e7732, roughness: 0.9 });
      const moss = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2, 0), mossMat);
      moss.position.set(0.3, 0.55, 0);
      group.add(moss);
    } else if (type === 'slide') {
      // Low Ancient Stone Arch (Inspired by the stone bridge arch in Image 2)
      const stoneMat = new THREE.MeshStandardMaterial({ color: 0x5a554e, roughness: 0.88 });
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.35, 0.6), stoneMat);
      lintel.position.y = 1.68;
      group.add(lintel);

      for (const side of [-1, 1]) {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 1.7, 6), stoneMat);
        pillar.position.set(side * 1.05, 0.85, 0);
        group.add(pillar);
      }
    } else {
      // Weathered limestone boulder
      const rockMat = new THREE.MeshStandardMaterial({ color: 0x6e685f, roughness: 0.9 });
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.05, 1), rockMat);
      rock.position.y = 1.05;
      rock.scale.set(1.1, 1.5, 0.9);
      group.add(rock);
    }

    return group;
  }

  // Golden Amber Gem (Temple Run coin)
  private createAmberGemMesh(): THREE.Group {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffbb11,
      emissive: 0xcc7700,
      emissiveIntensity: 0.45,
      roughness: 0.2,
      metalness: 0.3,
    });
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), mat);
    group.add(gem);
    return group;
  }

  // Collectible Sapiens Resources
  private createResourceMesh(type: 'berries' | 'flint' | 'ivory'): THREE.Group {
    const group = new THREE.Group();
    if (type === 'berries') {
      const bush = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 6, 6),
        new THREE.MeshStandardMaterial({ color: 0x3d542d, roughness: 0.9 })
      );
      bush.position.y = 0.2;
      group.add(bush);
      const bMat = new THREE.MeshStandardMaterial({ color: 0xcc2233 });
      for (let i = 0; i < 5; i++) {
        const berry = new THREE.Mesh(new THREE.SphereGeometry(0.08, 4, 4), bMat);
        berry.position.set((Math.random() - 0.5) * 0.4, 0.3 + Math.random() * 0.2, (Math.random() - 0.5) * 0.4);
        group.add(berry);
      }
    } else if (type === 'flint') {
      const mat = new THREE.MeshStandardMaterial({ color: 0x222228, roughness: 0.25, metalness: 0.2 });
      const flint = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 0), mat);
      flint.position.y = 0.25;
      group.add(flint);
    } else {
      const mat = new THREE.MeshStandardMaterial({ color: 0xf0ead6, roughness: 0.3 });
      const tusk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, 0.8, 5), mat);
      tusk.rotation.z = Math.PI / 3;
      tusk.position.y = 0.3;
      group.add(tusk);
    }
    return group;
  }

  // Prehistoric Power-Ups (Prometheus Torch, Lion-Man Shield, Cognitive Surge)
  private createPowerUpMesh(type: 'magnet' | 'shield' | 'surge'): THREE.Group {
    const group = new THREE.Group();

    if (type === 'magnet') {
      // Prometheus Fire Torch
      const wood = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.08, 0.7, 5),
        new THREE.MeshStandardMaterial({ color: 0x4a321a })
      );
      group.add(wood);
      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.2, 0.45, 5),
        new THREE.MeshBasicMaterial({ color: 0xff6600 })
      );
      flame.position.y = 0.45;
      group.add(flame);
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.38, 0.04, 6, 16),
        new THREE.MeshBasicMaterial({ color: 0xffaa00 })
      );
      ring.rotation.x = Math.PI / 2;
      group.add(ring);
    } else if (type === 'shield') {
      // Lion-Man Ivory Amulet
      const amulet = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.32, 0),
        new THREE.MeshStandardMaterial({ color: 0xe8e2d4, roughness: 0.4 })
      );
      group.add(amulet);
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.42, 0.04, 6, 16),
        new THREE.MeshBasicMaterial({ color: 0xffeeaa })
      );
      group.add(ring);
    } else {
      // Cognitive Surge Star
      const star = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.34, 0),
        new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xee2200, emissiveIntensity: 0.6 })
      );
      group.add(star);
    }

    return group;
  }

  // Historical Sapiens Dilemma Gate spanning across the path
  private createSapiensDilemmaGate(): THREE.Group {
    const gate = new THREE.Group();
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x4a433c, roughness: 0.9 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x3a2818, roughness: 0.95 });

    for (const x of [-4.2, 0, 4.2]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.4, 4.5, 7), stoneMat);
      col.position.set(x, 2.25, 0);
      gate.add(col);
    }

    const lintel = new THREE.Mesh(new THREE.BoxGeometry(9.0, 0.6, 0.8), woodMat);
    lintel.position.set(0, 4.6, 0);
    gate.add(lintel);

    // Left Choice Banner (Gossip Theory)
    const leftBanner = new THREE.Mesh(
      new THREE.PlaneGeometry(2.0, 1.2),
      new THREE.MeshBasicMaterial({ color: 0xaa8800, side: THREE.DoubleSide })
    );
    leftBanner.position.set(-World3D.LANE_WIDTH, 3.4, 0);
    gate.add(leftBanner);

    // Right Choice Banner (Strict Foraging)
    const rightBanner = new THREE.Mesh(
      new THREE.PlaneGeometry(2.0, 1.2),
      new THREE.MeshBasicMaterial({ color: 0x228855, side: THREE.DoubleSide })
    );
    rightBanner.position.set(World3D.LANE_WIDTH, 3.4, 0);
    gate.add(rightBanner);

    return gate;
  }

  // --- 4. SAPIENS HUMAN CHIEFTAIN CHARACTER ---

  private createSapiensChieftainCharacter(): THREE.Group {
    const player = new THREE.Group();
    const skinMat = new THREE.MeshStandardMaterial({ color: 0x9c6c4c, roughness: 0.7 });
    const furMat = new THREE.MeshStandardMaterial({ color: 0x402b1c, roughness: 0.95 });
    const spearMat = new THREE.MeshStandardMaterial({ color: 0x5a432e, roughness: 0.8 });
    const flintMat = new THREE.MeshStandardMaterial({ color: 0x222226, roughness: 0.3, metalness: 0.1 });

    // Torso Tunic
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.8, 7), furMat);
    torso.position.y = 1.1;
    player.add(torso);

    // Fur Mantle
    const mantle = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.35, 7), furMat);
    mantle.position.y = 1.45;
    player.add(mantle);

    // Head with Hair
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), skinMat);
    head.position.y = 1.75;
    player.add(head);

    const hair = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 0), furMat);
    hair.position.set(0, 1.82, -0.05);
    player.add(hair);

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.1, 0.09, 0.7, 6);
    this.leftLegMesh = new THREE.Mesh(legGeo, skinMat);
    this.leftLegMesh.position.set(-0.16, 0.45, 0);
    player.add(this.leftLegMesh);

    this.rightLegMesh = new THREE.Mesh(legGeo, skinMat);
    this.rightLegMesh.position.set(0.16, 0.45, 0);
    player.add(this.rightLegMesh);

    // Arm with Hunting Spear
    const armGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.6, 5);
    this.rightArmMesh = new THREE.Mesh(armGeo, skinMat);
    this.rightArmMesh.position.set(0.38, 1.25, 0.1);
    this.rightArmMesh.rotation.x = -Math.PI / 4;
    player.add(this.rightArmMesh);

    this.spearMesh = new THREE.Group();
    const spearShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.2, 5), spearMat);
    spearShaft.position.set(0.44, 1.25, 0.2);
    spearShaft.rotation.x = -0.3;
    this.spearMesh.add(spearShaft);

    const spearHead = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.32, 4), flintMat);
    spearHead.position.set(0.44, 2.3, -0.15);
    spearHead.rotation.x = -0.3;
    this.spearMesh.add(spearHead);
    player.add(this.spearMesh);

    // Shield Aura Dome
    const shieldGeo = new THREE.IcosahedronGeometry(1.3, 2);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      wireframe: true,
      transparent: true,
      opacity: 0,
    });
    this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    this.shieldMesh.position.y = 1.1;
    player.add(this.shieldMesh);

    // Contact Shadow Disc
    const csMat = new THREE.MeshBasicMaterial({ color: 0x110c08, transparent: true, opacity: 0.45 });
    const cs = new THREE.Mesh(new THREE.CircleGeometry(0.65, 12), csMat);
    cs.rotateX(-Math.PI / 2);
    cs.position.y = 0.02;
    player.add(cs);

    return player;
  }

  // --- 5. PREHISTORIC PURSUER (SABERTOOTH CAT) ---

  private createSabertoothBeast(): THREE.Group {
    const beast = new THREE.Group();
    const furMat = new THREE.MeshStandardMaterial({ color: 0x995c2e, roughness: 0.85 });
    const tuskMat = new THREE.MeshStandardMaterial({ color: 0xf5f0e6, roughness: 0.3 });

    // Muscular Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 1.8), furMat);
    body.position.y = 0.9;
    beast.add(body);

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.6, 0.7), furMat);
    head.position.set(0, 1.2, -0.9);
    beast.add(head);

    // 2 Giant Curved Sabertooth Tusks
    for (const side of [-0.2, 0.2]) {
      const tusk = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.45, 5), tuskMat);
      tusk.rotation.x = -0.2;
      tusk.position.set(side, 0.8, -1.2);
      beast.add(tusk);
    }

    // Glowing Amber Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff4400 });
    for (const side of [-0.18, 0.18]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 4, 4), eyeMat);
      eye.position.set(side, 1.35, -1.25);
      beast.add(eye);
    }

    // 4 Running Legs
    const legGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.8, 5);
    for (const x of [-0.4, 0.4]) {
      for (const z of [-0.6, 0.6]) {
        const leg = new THREE.Mesh(legGeo, furMat);
        leg.position.set(x, 0.4, z);
        beast.add(leg);
      }
    }

    return beast;
  }

  // --- 6. TOUCH & SWIPE CONTROLS ---

  private setupTouchAndSwipe() {
    const dom = this.renderer.domElement;

    const onStart = (clientX: number, clientY: number) => {
      this.touchStartX = clientX;
      this.touchStartY = clientY;
      this.isTouching = true;
    };

    const onEnd = (clientX: number, clientY: number) => {
      if (!this.isTouching || this.isTitleMode) return;
      this.isTouching = false;

      const dx = clientX - this.touchStartX;
      const dy = clientY - this.touchStartY;
      const dist = Math.hypot(dx, dy);

      if (dist < 25) {
        const halfWidth = window.innerWidth / 2;
        if (clientX < halfWidth * 0.7) {
          this.shiftLane(-1);
        } else if (clientX > halfWidth * 1.3) {
          this.shiftLane(1);
        } else {
          this.triggerJump();
        }
        return;
      }

      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 30) this.shiftLane(1);
        else if (dx < -30) this.shiftLane(-1);
      } else {
        if (dy < -30) this.triggerJump();
        else if (dy > 30) this.triggerSlide();
      }
    };

    dom.addEventListener('pointerdown', e => onStart(e.clientX, e.clientY));
    dom.addEventListener('pointerup', e => onEnd(e.clientX, e.clientY));
  }

  public shiftLane(direction: -1 | 1) {
    if (this.isTitleMode) return;
    const newLane = (this.currentLane + direction) as -1 | 0 | 1;
    if (newLane >= -1 && newLane <= 1) {
      this.currentLane = newLane;
      this.playerTargetX = this.currentLane * World3D.LANE_WIDTH;
      if (this.callbacks.onLaneChange) {
        this.callbacks.onLaneChange(this.currentLane);
      }
    }
  }

  public triggerJump() {
    if (this.isTitleMode || this.isJumping) return;
    this.isJumping = true;
    this.jumpTimer = 0;
    if (this.callbacks.onJump) {
      this.callbacks.onJump();
    }
  }

  public triggerSlide() {
    if (this.isTitleMode || this.isSliding) return;
    this.isSliding = true;
    this.slideTimer = 0;
    if (this.callbacks.onSlide) {
      this.callbacks.onSlide();
    }
  }

  // --- 7. MAIN GAME LOOP ---

  public update(dt: number, controls: World3DControls) {
    if (this.isTitleMode) {
      const t = Date.now() * 0.0004;
      this.camera.position.x = Math.sin(t) * 12;
      this.camera.position.y = 6 + Math.cos(t * 0.6) * 2;
      this.camera.position.z = Math.cos(t) * 16;
      this.camera.lookAt(0, 2, -12);
      return;
    }

    // Direct Lane Inputs
    if (controls.laneLeft || controls.left) {
      this.shiftLane(-1);
      controls.laneLeft = false;
      controls.left = false;
    }
    if (controls.laneRight || controls.right) {
      this.shiftLane(1);
      controls.laneRight = false;
      controls.right = false;
    }
    if (controls.jump) {
      this.triggerJump();
      controls.jump = false;
    }
    if (controls.slide) {
      this.triggerSlide();
      controls.slide = false;
    }
    this.isSprinting = !!controls.sprint;

    // Power-Up Countdown
    if (this.activePowerUp && this.powerUpTimeLeft > 0) {
      this.powerUpTimeLeft -= dt;
      if (this.powerUpTimeLeft <= 0) {
        this.activePowerUp = null;
        if (this.shieldMesh) (this.shieldMesh.material as THREE.MeshBasicMaterial).opacity = 0;
      }
    }

    // Dynamic Speed
    let targetSpeed = this.baseSpeed + Math.min(8.0, this.distanceTraveled * 0.005);
    if (this.isSprinting) targetSpeed *= 1.35;
    if (this.activePowerUp === 'surge') targetSpeed *= 1.5;

    this.currentSpeed += (targetSpeed - this.currentSpeed) * dt * 4;

    // Forward Step
    const forwardStep = this.currentSpeed * dt;
    this.playerZ -= forwardStep;
    this.distanceTraveled += forwardStep;

    if (this.callbacks.onDistanceUpdate) {
      this.callbacks.onDistanceUpdate(this.distanceTraveled, this.currentSpeed);
    }

    // Lane Interpolation with roll tilt
    this.playerX += (this.playerTargetX - this.playerX) * dt * 17.0;

    // Jump Physics
    if (this.isJumping) {
      this.jumpTimer += dt;
      const progress = this.jumpTimer / this.jumpDuration;
      if (progress >= 1.0) {
        this.isJumping = false;
        this.playerY = 0;
      } else {
        this.playerY = Math.sin(progress * Math.PI) * 2.2;
      }
    } else {
      this.playerY = 0;
    }

    // Slide Physics
    if (this.isSliding) {
      this.slideTimer += dt;
      if (this.slideTimer >= this.slideDuration) {
        this.isSliding = false;
      }
    }

    // Apply Player Transform
    this.playerGroup.position.set(this.playerX, this.playerY, this.playerZ);

    const lateralVel = this.playerTargetX - this.playerX;
    this.playerGroup.rotation.z = -lateralVel * 0.12;

    // Leg Swings
    const legFreq = this.currentSpeed * 0.7;
    const legAngle = Math.sin(Date.now() * 0.012 * legFreq) * 0.65;
    if (this.leftLegMesh && this.rightLegMesh) {
      this.leftLegMesh.rotation.x = legAngle;
      this.rightLegMesh.rotation.x = -legAngle;
    }
    if (this.rightArmMesh) {
      this.rightArmMesh.rotation.x = -Math.PI / 4 + legAngle * 0.4;
    }

    // Squash & Stretch
    if (this.isSliding) {
      this.playerGroup.scale.set(1.15, 0.52, 1.35);
    } else if (this.isJumping) {
      this.playerGroup.scale.set(0.92, 1.18, 0.92);
    } else {
      this.playerGroup.scale.set(1.0, 1.0, 1.0);
    }

    // Shield Visual
    if (this.shieldMesh) {
      if (this.activePowerUp === 'shield' || this.activePowerUp === 'surge') {
        (this.shieldMesh.material as THREE.MeshBasicMaterial).opacity =
          0.35 + Math.sin(Date.now() * 0.01) * 0.15;
        this.shieldMesh.rotation.y += dt * 3;
      } else {
        (this.shieldMesh.material as THREE.MeshBasicMaterial).opacity = 0;
      }
    }

    // Pursuer Sabertooth Update
    if (this.beastAlertTimer > 0) {
      this.beastAlertTimer -= dt;
      this.beastTargetDistance = 3.6;
      if (this.beastAlertTimer <= 0) {
        this.beastTargetDistance = 10.5;
        if (this.callbacks.onBeastAlert) this.callbacks.onBeastAlert(false);
      }
    }
    this.beastDistance += (this.beastTargetDistance - this.beastDistance) * dt * 3.5;
    this.beastGroup.position.set(this.playerX * 0.85, 0, this.playerZ + this.beastDistance);
    this.beastGroup.position.y = Math.abs(Math.sin(Date.now() * 0.015 * legFreq)) * 0.35;

    // Cycle Track Segments
    for (let i = 0; i < this.trackSegments.length; i++) {
      const seg = this.trackSegments[i];
      if (seg.position.z > this.playerZ + 32) {
        seg.position.z = this.nextSegmentZ;
        this.nextSegmentZ -= World3D.SEGMENT_LENGTH;

        while (seg.children.length > 0) {
          seg.remove(seg.children[0]);
        }
        const rebuilt = this.createTrackSegment(seg.position.z, false);
        while (rebuilt.children.length > 0) {
          seg.add(rebuilt.children[0]);
        }
      }
    }

    // Pickups & Magnet
    const isMagnetActive = this.activePowerUp === 'magnet' || this.activePowerUp === 'surge';

    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      if (p.completed) continue;

      if (isMagnetActive) {
        const distZ = Math.abs(this.playerZ - p.z);
        if (distZ < 15.0) {
          p.x += (this.playerX - p.x) * dt * 8;
          p.mesh.position.x = p.x;
        }
      }

      const dx = this.playerX - p.x;
      const dz = this.playerZ - p.z;
      if (Math.hypot(dx, dz) < 1.7) {
        p.completed = true;
        p.mesh.visible = false;
        if (this.callbacks.onPickup) {
          this.callbacks.onPickup(p.type);
        }
      } else if (p.z > this.playerZ + 15) {
        this.pickups.splice(i, 1);
      }
    }

    // Power-Ups
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const pw = this.powerUps[i];
      if (pw.collected) continue;

      const laneX = pw.lane * World3D.LANE_WIDTH;
      const dx = this.playerX - laneX;
      const dz = this.playerZ - pw.z;

      if (Math.hypot(dx, dz) < 1.8) {
        pw.collected = true;
        pw.mesh.visible = false;
        this.activePowerUp = pw.type;
        this.powerUpTimeLeft = pw.type === 'surge' ? 6.5 : 8.5;
        if (this.callbacks.onPowerUp) {
          this.callbacks.onPowerUp(pw.type);
        }
      } else if (pw.z > this.playerZ + 15) {
        this.powerUps.splice(i, 1);
      }
    }

    // Obstacle Collisions
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      if (obs.cleared || obs.hit) continue;

      const obsX = obs.lane * World3D.LANE_WIDTH;
      const dz = this.playerZ - obs.z;

      if (Math.abs(dz) < 1.25 && Math.abs(this.playerX - obsX) < 1.1) {
        let isSafe = false;

        if (obs.type === 'jump') {
          if (this.isJumping && this.playerY > 0.95) {
            isSafe = true;
          }
        } else if (obs.type === 'slide') {
          if (this.isSliding) {
            isSafe = true;
          }
        }

        if (isSafe) {
          obs.cleared = true;
        } else {
          obs.hit = true;
          this.handleObstacleHit();
        }
      } else if (obs.z > this.playerZ + 15) {
        this.obstacles.splice(i, 1);
      }
    }

    // Dilemma Gates
    for (let i = this.dilemmaGates.length - 1; i >= 0; i--) {
      const gate = this.dilemmaGates[i];
      if (gate.passed) continue;

      if (this.playerZ < gate.z && gate.z - this.playerZ < 2.0) {
        gate.passed = true;
        const choiceIdx = this.playerX < 0 ? 0 : 1;
        if (this.callbacks.onDilemmaGate) {
          this.callbacks.onDilemmaGate(gate.dilemmaId, choiceIdx);
        }
      } else if (gate.z > this.playerZ + 15) {
        this.dilemmaGates.splice(i, 1);
      }
    }

    // Camera Tracking
    const targetCamX = this.playerX * 0.45;
    const targetCamY = this.playerY * 0.35 + (this.isSliding ? 3.4 : 4.6);
    const targetCamZ = this.playerZ + 7.2;

    const camSmooth = 1 - Math.exp(-12 * dt);
    this.camera.position.x += (targetCamX - this.camera.position.x) * camSmooth;
    this.camera.position.y += (targetCamY - this.camera.position.y) * camSmooth;
    this.camera.position.z += (targetCamZ - this.camera.position.z) * camSmooth;

    this.camera.lookAt(this.playerX * 0.7, this.playerY + 1.35, this.playerZ - 8.5);

    const targetFov = this.activePowerUp === 'surge' ? 68 : this.isSprinting ? 62 : 56;
    this.camera.fov += (targetFov - this.camera.fov) * dt * 5;
    this.camera.updateProjectionMatrix();
  }

  private handleObstacleHit() {
    if (this.activePowerUp === 'shield' || this.activePowerUp === 'surge') {
      this.activePowerUp = null;
      this.powerUpTimeLeft = 0;
      if (this.shieldMesh) (this.shieldMesh.material as THREE.MeshBasicMaterial).opacity = 0;
      if (this.callbacks.onObstacleHit) {
        this.callbacks.onObstacleHit(true);
      }
      return;
    }

    this.beastAlertTimer = 5.0;
    if (this.callbacks.onBeastAlert) {
      this.callbacks.onBeastAlert(true);
    }
    if (this.callbacks.onObstacleHit) {
      this.callbacks.onObstacleHit(false);
    }
  }

  // --- 8. LIFECYCLE ---

  private startLoop() {
    let lastTime = performance.now();
    const tick = () => {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

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
        this.animFrameId = window.setTimeout(callback, 50);
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

  public setTitleMode(isTitle: boolean) {
    this.isTitleMode = isTitle;
    if (!isTitle) {
      this.distanceTraveled = 0;
      this.playerZ = 0;
      this.playerX = 0;
      this.currentLane = 0;
      this.playerTargetX = 0;
      this.beastDistance = 10.5;
      this.beastTargetDistance = 10.5;
    }
  }

  public setEra(_era: HistoricalEra) {}

  public setLandscape(landscape: SapiensLandscape) {
    this.currentLandscape = landscape;
    let skyHex = 0xa3c8b4;
    let sunHex = 0xfffae0;
    let sunInt = 1.85;
    let hemiSky = 0xddeeff;
    let hemiGround = 0x5a7d36;

    if (landscape === 'wetland_oasis') {
      skyHex = 0x82b2a6; // Monet water lily pond teal-green mist (Image 1)
      sunHex = 0xfcf3d4;
      sunInt = 1.75;
      hemiSky = 0xcde8e4;
      hemiGround = 0x3d6e55;
    } else if (landscape === 'mountain_pass') {
      skyHex = 0x94abbb; // Sunlit mountain canyon haze (Image 2)
      sunHex = 0xfff0d8;
      sunInt = 2.0;
      hemiSky = 0xd2e3f4;
      hemiGround = 0x64614a;
    } else {
      // river_meadow
      skyHex = 0xa3c8b4; // Sun-drenched wildflower meadow (Image 3)
      sunHex = 0xfffae0;
      sunInt = 1.85;
      hemiSky = 0xddeeff;
      hemiGround = 0x5a7d36;
    }

    this.scene.background = new THREE.Color(skyHex);
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color = new THREE.Color(skyHex);
    }
    if (this.sunLight) {
      this.sunLight.color.setHex(sunHex);
      this.sunLight.intensity = sunInt;
    }
    if (this.hemiLight) {
      this.hemiLight.color.setHex(hemiSky);
      this.hemiLight.groundColor.setHex(hemiGround);
    }
  }

  public setBiome(landscape: SapiensLandscape) {
    this.setLandscape(landscape);
  }

  public setMegafaunaExtinct(_isExtinct: boolean) {}

  public getNearbyLandmark(): LandmarkInfo | null {
    for (const landmark of WORLD_LANDMARKS) {
      const landmarkDist = Math.abs(this.distanceTraveled - landmark.z * -1);
      if (landmarkDist < 14) {
        return landmark;
      }
    }
    return null;
  }

  public getPlayerPosition(): { x: number; z: number } {
    return { x: this.playerX, z: this.playerZ };
  }

  public getCurrentLane(): number {
    return this.currentLane;
  }

  public getDistanceTraveled(): number {
    return this.distanceTraveled;
  }

  public dispose() {
    cancelAnimationFrame(this.animFrameId);
    clearTimeout(this.animFrameId);
    window.removeEventListener('resize', this.onWindowResize);
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
