import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export interface World3DControls {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  action: boolean;
}

export interface PickupItem {
  id: string;
  type: 'flint' | 'berries' | 'ivory';
  x: number;
  z: number;
  mesh: THREE.Group;
  completed: boolean;
}

export class World3D {
  public container: HTMLElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private isSoftwareGl: boolean = false;
  private animFrameId: number = 0;
  private clock: THREE.Clock;
  private onPickupCallback?: (type: 'flint' | 'berries' | 'ivory') => void;

  // Scene Entities
  private playerGroup: THREE.Group;
  private playerPos = new THREE.Vector3(0, 0, 4);
  private playerTargetPos = new THREE.Vector3(0, 0, 4);
  private playerAngle: number = 0;
  private playerWalkCycle: number = 0;
  private playerSpeed: number = 6.5;

  // Camera settings
  private cameraTarget = new THREE.Vector3(0, 1.2, 4);
  private isTitleMode: boolean = true;
  private titleOrbitAngle: number = 0;

  // World elements
  private pickups: PickupItem[] = [];
  private mammothGroup: THREE.Group;
  private campfireLight: THREE.PointLight;
  private flameParticles: THREE.Mesh[] = [];
  private wheatStalks: THREE.Group[] = [];
  private tribeMembers: { group: THREE.Group; baseAngle: number; radius: number }[] = [];

  // Reusable scratch math objects for zero-GC loop
  private _scratchV1 = new THREE.Vector3();
  private _scratchV2 = new THREE.Vector3();

  constructor(
    container: HTMLElement,
    onPickup?: (type: 'flint' | 'berries' | 'ivory') => void
  ) {
    this.container = container;
    this.onPickupCallback = onPickup;
    this.clock = new THREE.Clock();

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

    // 2. Renderer Setup
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
    this.renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // 3. Scene & Camera Setup
    this.scene = new THREE.Scene();
    const skyHorizonColor = 0x1f1610; // Warm savannah dusk
    this.scene.background = new THREE.Color(skyHorizonColor);
    this.scene.fog = new THREE.FogExp2(skyHorizonColor, 0.022);

    this.camera = new THREE.PerspectiveCamera(
      48,
      (container.clientWidth || window.innerWidth) / (container.clientHeight || window.innerHeight),
      0.1,
      140
    );
    this.camera.position.set(0, 10, 18);

    // 4. Procedural Studio Reflection (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Lighting Rig (Warm Key + Cool Fill + Campfire Point)
    const hemiLight = new THREE.HemisphereLight(0xffe8d6, 0x3d352e, 0.75);
    this.scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xffeedd, 1.8);
    sunLight.position.set(24, 35, 18);
    if (!this.isSoftwareGl) {
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 1024;
      sunLight.shadow.mapSize.height = 1024;
      sunLight.shadow.camera.near = 1;
      sunLight.shadow.camera.far = 90;
      const d = 30;
      sunLight.shadow.camera.left = -d;
      sunLight.shadow.camera.right = d;
      sunLight.shadow.camera.top = d;
      sunLight.shadow.camera.bottom = -d;
      sunLight.shadow.bias = -0.0005;
      sunLight.shadow.normalBias = 0.02;
    }
    this.scene.add(sunLight);

    // Campfire flickering light
    this.campfireLight = new THREE.PointLight(0xff7722, 2.5, 22, 1.2);
    this.campfireLight.position.set(0, 1.2, 0);
    this.scene.add(this.campfireLight);

    // Build World Geometry
    this.createTerrain();
    this.createHearthAndCamp();
    this.playerGroup = this.createPlayerCharacter();
    this.scene.add(this.playerGroup);

    this.mammothGroup = this.createWoollyMammoth();
    this.mammothGroup.position.set(15, this.groundHeightAt(15, -12), -12);
    this.scene.add(this.mammothGroup);

    this.createMegaliths();
    this.createFoliageAndRocks();
    this.createPickups();
    this.createWheatFields();
    this.createTribeMembers();

    // Resize listener
    window.addEventListener('resize', this.onWindowResize);

    // Start 60fps loop with software GL pacing
    this.startLoop();
  }

  // Smooth terrain elevation
  public groundHeightAt(x: number, z: number): number {
    return (
      Math.sin(x * 0.05) * 0.7 +
      Math.cos(z * 0.05) * 0.7 +
      Math.sin(x * 0.12 + z * 0.08) * 0.35
    );
  }

  // 1. Procedural Terrain & River
  private createTerrain() {
    const geo = new THREE.PlaneGeometry(160, 160, 64, 64);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);
      pos.setY(i, this.groundHeightAt(vx, vz));
    }
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color: 0x5a4a38, // Earthy steppe savannah
      roughness: 0.92,
      metalness: 0.05,
      flatShading: true,
    });
    const terrainMesh = new THREE.Mesh(geo, mat);
    terrainMesh.receiveShadow = !this.isSoftwareGl;
    this.scene.add(terrainMesh);

    // River bed curve
    const riverGeo = new THREE.PlaneGeometry(12, 140, 12, 40);
    riverGeo.rotateX(-Math.PI / 2);
    const rPos = riverGeo.attributes.position;
    for (let i = 0; i < rPos.count; i++) {
      const rx = rPos.getX(i) - 28;
      const rz = rPos.getZ(i);
      rPos.setX(i, rx + Math.sin(rz * 0.06) * 6);
      rPos.setY(i, this.groundHeightAt(rx, rz) - 0.45);
    }
    riverGeo.computeVertexNormals();
    const riverMat = new THREE.MeshStandardMaterial({
      color: 0x224455,
      roughness: 0.15,
      metalness: 0.3,
    });
    const riverMesh = new THREE.Mesh(riverGeo, riverMat);
    this.scene.add(riverMesh);
  }

  // 2. Campfire Hearth, Embers & Tribal Tents
  private createHearthAndCamp() {
    const campGroup = new THREE.Group();
    campGroup.position.set(0, this.groundHeightAt(0, 0), 0);

    // Stone ring around fire (8 stones)
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.9 });
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const stoneGeo = new THREE.DodecahedronGeometry(0.25, 0);
      const stone = new THREE.Mesh(stoneGeo, stoneMat);
      stone.position.set(Math.cos(angle) * 1.1, 0.15, Math.sin(angle) * 1.1);
      stone.scale.set(1 + Math.random() * 0.3, 0.7, 1 + Math.random() * 0.3);
      campGroup.add(stone);
    }

    // Charred logs (4 criss-crossed logs)
    const logMat = new THREE.MeshStandardMaterial({ color: 0x241812, roughness: 0.95 });
    const logGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.6, 6);
    for (let i = 0; i < 4; i++) {
      const log = new THREE.Mesh(logGeo, logMat);
      log.rotation.x = Math.PI / 2 + 0.1;
      log.rotation.z = (i * Math.PI) / 4;
      log.position.y = 0.15;
      campGroup.add(log);
    }

    // Glowing ember bed
    const emberMat = new THREE.MeshBasicMaterial({ color: 0xff3300 });
    const emberMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.08, 12), emberMat);
    emberMesh.position.y = 0.06;
    campGroup.add(emberMesh);

    // Flame particles
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    for (let i = 0; i < 7; i++) {
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.65, 5), flameMat);
      flame.position.set((Math.random() - 0.5) * 0.4, 0.35 + i * 0.06, (Math.random() - 0.5) * 0.4);
      campGroup.add(flame);
      this.flameParticles.push(flame);
    }

    // Contact shadow beneath hearth
    const shadowGeo = new THREE.CircleGeometry(2.4, 16);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x110c08, transparent: true, opacity: 0.5 });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.position.y = 0.02;
    campGroup.add(shadow);

    // 3 Hide Tents / Shelters
    for (let t = 0; t < 3; t++) {
      const tentAngle = (t / 3) * Math.PI * 2 + 0.4;
      const tx = Math.cos(tentAngle) * 5.5;
      const tz = Math.sin(tentAngle) * 5.5;
      const tent = this.createPrimitiveTent();
      tent.position.set(tx, this.groundHeightAt(tx, tz), tz);
      tent.rotation.y = tentAngle + Math.PI;
      this.scene.add(tent);
    }

    this.scene.add(campGroup);
  }

  // Composite 3-12 Part Primitive Tent
  private createPrimitiveTent(): THREE.Group {
    const tent = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.9 });
    const hideMat = new THREE.MeshStandardMaterial({ color: 0x8a6e4b, roughness: 0.85, metalness: 0.05 });

    // 4 crossing wooden poles
    const poleGeo = new THREE.CylinderGeometry(0.06, 0.08, 3.4, 5);
    for (let i = 0; i < 4; i++) {
      const pole = new THREE.Mesh(poleGeo, woodMat);
      const a = (i * Math.PI) / 2;
      pole.position.set(Math.cos(a) * 0.7, 1.4, Math.sin(a) * 0.7);
      pole.rotation.x = -Math.sin(a) * 0.35;
      pole.rotation.z = Math.cos(a) * 0.35;
      tent.add(pole);
    }

    // Animal hide drape cone
    const hideGeo = new THREE.ConeGeometry(1.6, 2.5, 7, 1, true, 0.3, Math.PI * 1.7);
    const hide = new THREE.Mesh(hideGeo, hideMat);
    hide.position.y = 1.25;
    tent.add(hide);

    // Contact shadow
    const csGeo = new THREE.CircleGeometry(1.8, 12);
    csGeo.rotateX(-Math.PI / 2);
    const csMat = new THREE.MeshBasicMaterial({ color: 0x110c08, transparent: true, opacity: 0.45 });
    const cs = new THREE.Mesh(csGeo, csMat);
    cs.position.y = 0.02;
    tent.add(cs);

    return tent;
  }

  // Composite 8-10 Part Sapiens Player Character
  private createPlayerCharacter(): THREE.Group {
    const player = new THREE.Group();
    const skinMat = new THREE.MeshStandardMaterial({ color: 0x9c6c4c, roughness: 0.7 });
    const furMat = new THREE.MeshStandardMaterial({ color: 0x402b1c, roughness: 0.95 });
    const spearMat = new THREE.MeshStandardMaterial({ color: 0x5a432e, roughness: 0.8 });
    const flintMat = new THREE.MeshStandardMaterial({ color: 0x222226, roughness: 0.3, metalness: 0.1 });

    // 1. Torso Tunic
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.8, 7), furMat);
    torso.position.y = 1.1;
    torso.name = 'torso';
    player.add(torso);

    // 2. Fur Mantle / Shoulders
    const mantle = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.35, 7), furMat);
    mantle.position.y = 1.45;
    player.add(mantle);

    // 3. Head & Beard/Hair
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), skinMat);
    head.position.y = 1.75;
    player.add(head);

    const hair = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 0), furMat);
    hair.position.set(0, 1.82, -0.05);
    player.add(hair);

    // 4. Carved Bone Amulet
    const amulet = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.04), new THREE.MeshStandardMaterial({ color: 0xe5e0d3, roughness: 0.4 }));
    amulet.position.set(0, 1.35, 0.32);
    player.add(amulet);

    // 5. Left & Right Legs
    const legGeo = new THREE.CylinderGeometry(0.1, 0.09, 0.7, 6);
    const leftLeg = new THREE.Mesh(legGeo, skinMat);
    leftLeg.position.set(-0.16, 0.45, 0);
    leftLeg.name = 'leftLeg';
    player.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, skinMat);
    rightLeg.position.set(0.16, 0.45, 0);
    rightLeg.name = 'rightLeg';
    player.add(rightLeg);

    // 6. Right Arm holding Spear
    const armGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.6, 5);
    const rightArm = new THREE.Mesh(armGeo, skinMat);
    rightArm.position.set(0.38, 1.25, 0.1);
    rightArm.rotation.x = -Math.PI / 4;
    rightArm.name = 'rightArm';
    player.add(rightArm);

    // 7. Hunting Spear with Knapped Flint Point
    const spearShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.2, 5), spearMat);
    spearShaft.position.set(0.44, 1.25, 0.2);
    spearShaft.rotation.x = -0.3;
    player.add(spearShaft);

    const spearHead = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.32, 4), flintMat);
    spearHead.position.set(0.44, 2.3, -0.15);
    spearHead.rotation.x = -0.3;
    player.add(spearHead);

    // 8. Contact Shadow Disc
    const csGeo = new THREE.CircleGeometry(0.65, 12);
    csGeo.rotateX(-Math.PI / 2);
    const csMat = new THREE.MeshBasicMaterial({ color: 0x110c08, transparent: true, opacity: 0.45 });
    const cs = new THREE.Mesh(csGeo, csMat);
    cs.position.y = 0.02;
    player.add(cs);

    return player;
  }

  // Composite 12-Part Woolly Mammoth
  private createWoollyMammoth(): THREE.Group {
    const mammoth = new THREE.Group();
    const woolMat = new THREE.MeshStandardMaterial({ color: 0x3d2716, roughness: 0.95 });
    const tuskMat = new THREE.MeshStandardMaterial({ color: 0xeee7db, roughness: 0.3, metalness: 0.1 });

    // 1. Massive Hump & Torso
    const body = new THREE.Mesh(new THREE.SphereGeometry(2.1, 10, 8), woolMat);
    body.scale.set(1.1, 1.2, 1.6);
    body.position.y = 3.2;
    mammoth.add(body);

    // 2. Distinct Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), woolMat);
    head.position.set(0, 3.8, 1.8);
    mammoth.add(head);

    // 3. Trunk (3 jointed segments)
    const trunkMat = woolMat;
    const t1 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.28, 1.0, 6), trunkMat);
    t1.position.set(0, 2.9, 2.6);
    t1.rotation.x = 0.4;
    mammoth.add(t1);

    const t2 = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.2, 1.0, 6), trunkMat);
    t2.position.set(0, 2.1, 3.0);
    t2.rotation.x = 0.8;
    mammoth.add(t2);

    const t3 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.14, 0.9, 6), trunkMat);
    t3.position.set(0, 1.5, 3.5);
    t3.rotation.x = 1.3;
    mammoth.add(t3);

    // 4. Curved Ivory Tusks (Left & Right)
    for (const side of [-1, 1]) {
      const tusk = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.14, 6, 12, Math.PI * 0.75), tuskMat);
      tusk.position.set(side * 0.8, 3.0, 2.4);
      tusk.rotation.y = side * 0.4;
      tusk.rotation.z = side * 0.3;
      mammoth.add(tusk);
    }

    // 5. Mammoth Ears
    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.6, 0.5), woolMat);
      ear.position.set(side * 1.2, 3.9, 1.6);
      mammoth.add(ear);
    }

    // 6. Four Pillars / Legs
    const legGeo = new THREE.CylinderGeometry(0.48, 0.52, 2.4, 7);
    for (const lx of [-0.9, 0.9]) {
      for (const lz of [-1.1, 1.1]) {
        const leg = new THREE.Mesh(legGeo, woolMat);
        leg.position.set(lx, 1.2, lz);
        mammoth.add(leg);
      }
    }

    // Contact Shadow
    const csGeo = new THREE.CircleGeometry(2.8, 14);
    csGeo.rotateX(-Math.PI / 2);
    const csMat = new THREE.MeshBasicMaterial({ color: 0x110c08, transparent: true, opacity: 0.5 });
    const cs = new THREE.Mesh(csGeo, csMat);
    cs.position.y = 0.02;
    mammoth.add(cs);

    mammoth.scale.set(0.9, 0.9, 0.9);
    return mammoth;
  }

  // Composite 4-Part Göbekli Tepe T-Pillars
  private createMegaliths() {
    const megalithMat = new THREE.MeshStandardMaterial({ color: 0x8c7c68, roughness: 0.85 });
    const positions = [
      { x: -16, z: -14, rot: 0.4 },
      { x: -12, z: -18, rot: 0.9 },
      { x: -20, z: -10, rot: -0.2 },
    ];

    positions.forEach(p => {
      const pillar = new THREE.Group();
      // Base plinth
      const base = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.4, 1.8), megalithMat);
      pillar.add(base);

      // Vertical shaft with carved animal relief bevels
      const shaft = new THREE.Mesh(new THREE.BoxGeometry(1.2, 4.2, 0.8), megalithMat);
      shaft.position.y = 2.2;
      pillar.add(shaft);

      // Horizontal T-Head lintel
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.0, 1.0), megalithMat);
      lintel.position.y = 4.6;
      pillar.add(lintel);

      // Contact shadow
      const csGeo = new THREE.CircleGeometry(2.2, 12);
      csGeo.rotateX(-Math.PI / 2);
      const cs = new THREE.Mesh(csGeo, new THREE.MeshBasicMaterial({ color: 0x110c08, transparent: true, opacity: 0.45 }));
      cs.position.y = 0.02;
      pillar.add(cs);

      pillar.position.set(p.x, this.groundHeightAt(p.x, p.z), p.z);
      pillar.rotation.y = p.rot;
      this.scene.add(pillar);
    });
  }

  // Scattered Ancient Acacia/Pine Trees & Rock Formations
  private createFoliageAndRocks() {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2b1f, roughness: 0.9 });
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x2e4726, roughness: 0.85 });
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x615b54, roughness: 0.8 });

    // Trees (clustered around perimeter)
    const treeCoords = [
      { x: -22, z: 12 }, { x: -18, z: 24 }, { x: 8, z: 22 },
      { x: 26, z: 10 }, { x: 30, z: -8 }, { x: -8, z: -30 },
      { x: 12, z: -26 }, { x: -30, z: -5 }, { x: 22, z: 28 },
    ];

    treeCoords.forEach((c, idx) => {
      const tree = new THREE.Group();
      const trunkH = 3.5 + (idx % 3) * 0.8;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.38, trunkH, 6), trunkMat);
      trunk.position.y = trunkH / 2;
      tree.add(trunk);

      // 3 overlapping leaf canopy spheres
      for (let i = 0; i < 3; i++) {
        const rad = 1.6 - i * 0.25;
        const leaves = new THREE.Mesh(new THREE.DodecahedronGeometry(rad, 1), leavesMat);
        leaves.position.set((Math.random() - 0.5) * 0.6, trunkH + i * 0.9, (Math.random() - 0.5) * 0.6);
        tree.add(leaves);
      }

      // Contact shadow
      const cs = new THREE.Mesh(new THREE.CircleGeometry(2.2, 10), new THREE.MeshBasicMaterial({ color: 0x110c08, transparent: true, opacity: 0.4 }));
      cs.rotateX(-Math.PI / 2);
      cs.position.y = 0.02;
      tree.add(cs);

      tree.position.set(c.x, this.groundHeightAt(c.x, c.z), c.z);
      this.scene.add(tree);
    });

    // Boulder outcrops
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.3;
      const dist = 18 + Math.random() * 25;
      const rx = Math.cos(angle) * dist;
      const rz = Math.sin(angle) * dist;
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2 + Math.random() * 0.8, 0), rockMat);
      rock.position.set(rx, this.groundHeightAt(rx, rz) + 0.4, rz);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.scale.set(1.4, 0.8, 1.2);
      this.scene.add(rock);
    }
  }

  // 3. Collectible Field Pickups (Flint, Berries, Ivory)
  private createPickups() {
    const pickupDefs: Array<{ type: 'flint' | 'berries' | 'ivory'; x: number; z: number }> = [
      { type: 'flint', x: 7, z: 5 },
      { type: 'flint', x: -9, z: 9 },
      { type: 'flint', x: 12, z: -5 },
      { type: 'berries', x: -6, z: -8 },
      { type: 'berries', x: 9, z: 12 },
      { type: 'berries', x: -14, z: 4 },
      { type: 'ivory', x: 18, z: -9 },
      { type: 'ivory', x: -18, z: -20 },
    ];

    pickupDefs.forEach((def, idx) => {
      const g = new THREE.Group();
      if (def.type === 'flint') {
        const mat = new THREE.MeshStandardMaterial({ color: 0x222228, roughness: 0.25, metalness: 0.2 });
        for (let i = 0; i < 3; i++) {
          const nodule = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22, 0), mat);
          nodule.position.set((i - 1) * 0.2, 0.15, (Math.random() - 0.5) * 0.2);
          g.add(nodule);
        }
      } else if (def.type === 'berries') {
        const bush = new THREE.Mesh(new THREE.SphereGeometry(0.45, 6, 6), new THREE.MeshStandardMaterial({ color: 0x3d542d, roughness: 0.9 }));
        bush.position.y = 0.35;
        g.add(bush);
        const berryMat = new THREE.MeshStandardMaterial({ color: 0xbb2233, roughness: 0.4 });
        for (let b = 0; b < 6; b++) {
          const berry = new THREE.Mesh(new THREE.SphereGeometry(0.09, 5, 5), berryMat);
          berry.position.set((Math.random() - 0.5) * 0.6, 0.4 + Math.random() * 0.3, (Math.random() - 0.5) * 0.6);
          g.add(berry);
        }
      } else {
        // Mammoth Ivory fragment
        const mat = new THREE.MeshStandardMaterial({ color: 0xf2ebd9, roughness: 0.3, metalness: 0.1 });
        const bone = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 0.9, 6), mat);
        bone.rotation.z = Math.PI / 3;
        bone.position.y = 0.18;
        g.add(bone);
      }

      // Contact shadow
      const cs = new THREE.Mesh(new THREE.CircleGeometry(0.6, 8), new THREE.MeshBasicMaterial({ color: 0x110c08, transparent: true, opacity: 0.4 }));
      cs.rotateX(-Math.PI / 2);
      cs.position.y = 0.02;
      g.add(cs);

      g.position.set(def.x, this.groundHeightAt(def.x, def.z), def.z);
      this.scene.add(g);

      this.pickups.push({
        id: `pickup_${idx}`,
        type: def.type,
        x: def.x,
        z: def.z,
        mesh: g,
        completed: false,
      });
    });
  }

  // 4. Agricultural Emmer Wheat Fields (Animated waving stalks)
  private createWheatFields() {
    const wheatMat = new THREE.MeshStandardMaterial({ color: 0xd4a359, roughness: 0.8 });
    const fieldOriginX = 14;
    const fieldOriginZ = 8;

    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 6; col++) {
        const wx = fieldOriginX + col * 0.9;
        const wz = fieldOriginZ + row * 0.9;
        const stalkGroup = new THREE.Group();

        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.2, 4), wheatMat);
        stem.position.y = 0.6;
        stalkGroup.add(stem);

        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.35, 5), wheatMat);
        ear.position.y = 1.25;
        stalkGroup.add(ear);

        stalkGroup.position.set(wx, this.groundHeightAt(wx, wz), wz);
        this.scene.add(stalkGroup);
        this.wheatStalks.push(stalkGroup);
      }
    }
  }

  // 5. Tribe Members gathering around Campfire
  private createTribeMembers() {
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xa87756, roughness: 0.75 });
    const furMat = new THREE.MeshStandardMaterial({ color: 0x543825, roughness: 0.95 });

    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + 0.3;
      const radius = 2.4 + (i % 2) * 0.6;
      const member = new THREE.Group();

      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.7, 6), furMat);
      body.position.y = 0.6;
      member.add(body);

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 7, 7), skinMat);
      head.position.y = 1.15;
      member.add(head);

      const cs = new THREE.Mesh(new THREE.CircleGeometry(0.5, 8), new THREE.MeshBasicMaterial({ color: 0x110c08, transparent: true, opacity: 0.4 }));
      cs.rotateX(-Math.PI / 2);
      cs.position.y = 0.02;
      member.add(cs);

      const mx = Math.cos(angle) * radius;
      const mz = Math.sin(angle) * radius;
      member.position.set(mx, this.groundHeightAt(mx, mz), mz);
      member.rotation.y = angle + Math.PI; // Looking toward the fire
      this.scene.add(member);

      this.tribeMembers.push({ group: member, baseAngle: angle, radius });
    }
  }

  // Set Title vs Playing Camera Mode
  public setTitleMode(isTitle: boolean) {
    this.isTitleMode = isTitle;
    if (!isTitle) {
      // Snap camera close to player position for action
      this.cameraTarget.copy(this.playerPos);
    }
  }

  // Update Game Loop with Controls
  public update(dt: number, controls: World3DControls) {
    const elapsed = this.clock.getElapsedTime();

    // 1. Campfire flicker & flame particle animation
    if (this.campfireLight) {
      this.campfireLight.intensity = 2.2 + Math.sin(elapsed * 12) * 0.6 + Math.cos(elapsed * 7) * 0.4;
    }
    this.flameParticles.forEach((flame, idx) => {
      flame.scale.y = 0.7 + Math.sin(elapsed * 10 + idx) * 0.35;
      flame.position.y = 0.3 + Math.sin(elapsed * 8 + idx * 2) * 0.1;
    });

    // 2. Wheat waving in wind
    this.wheatStalks.forEach((stalk, idx) => {
      stalk.rotation.z = Math.sin(elapsed * 2.5 + idx * 0.4) * 0.15;
    });

    // 3. Idle Mammoth breathing & ear twitch
    if (this.mammothGroup) {
      this.mammothGroup.position.y = this.groundHeightAt(this.mammothGroup.position.x, this.mammothGroup.position.z) + Math.sin(elapsed * 1.5) * 0.04;
      this.mammothGroup.rotation.y = -0.3 + Math.sin(elapsed * 0.8) * 0.08;
    }

    // 4. Tribe members ambient storytelling gestures
    this.tribeMembers.forEach((member, i) => {
      member.group.rotation.x = Math.sin(elapsed * 2 + i) * 0.05;
      member.group.position.y = this.groundHeightAt(member.group.position.x, member.group.position.z) + (Math.sin(elapsed * 2.5 + i) > 0.8 ? 0.04 : 0);
    });

    // 5. Title Mode vs Playing Mode Camera
    if (this.isTitleMode) {
      this.titleOrbitAngle += dt * 0.25;
      const orbitR = 24;
      const cx = Math.cos(this.titleOrbitAngle) * orbitR;
      const cz = Math.sin(this.titleOrbitAngle) * orbitR;
      const cy = 11 + Math.sin(this.titleOrbitAngle * 0.8) * 3;
      this.camera.position.set(cx, cy, cz);
      this.camera.lookAt(0, 2.5, 0);
      return;
    }

    // --- PLAYING CONTROLS & PLAYER MOVEMENT ---
    let moveX = 0;
    let moveZ = 0;
    if (controls.forward) moveZ -= 1;
    if (controls.backward) moveZ += 1;
    if (controls.left) moveX -= 1;
    if (controls.right) moveX += 1;

    const isMoving = moveX !== 0 || moveZ !== 0;

    if (isMoving) {
      this._scratchV1.set(moveX, 0, moveZ).normalize();
      const speed = this.playerSpeed * dt;
      this.playerPos.x += this._scratchV1.x * speed;
      this.playerPos.z += this._scratchV1.z * speed;

      // Bound player within steppe limits
      this.playerPos.x = Math.max(-45, Math.min(45, this.playerPos.x));
      this.playerPos.z = Math.max(-45, Math.min(45, this.playerPos.z));

      // Calculate target angle
      this.playerAngle = Math.atan2(this._scratchV1.x, this._scratchV1.z);

      // Walk cycle bob
      this.playerWalkCycle += dt * 14;
      const leftLeg = this.playerGroup.getObjectByName('leftLeg');
      const rightLeg = this.playerGroup.getObjectByName('rightLeg');
      const rightArm = this.playerGroup.getObjectByName('rightArm');
      if (leftLeg && rightLeg) {
        leftLeg.rotation.x = Math.sin(this.playerWalkCycle) * 0.6;
        rightLeg.rotation.x = -Math.sin(this.playerWalkCycle) * 0.6;
      }
      if (rightArm) {
        rightArm.rotation.x = -Math.PI / 4 + Math.sin(this.playerWalkCycle) * 0.3;
      }
    } else {
      const leftLeg = this.playerGroup.getObjectByName('leftLeg');
      const rightLeg = this.playerGroup.getObjectByName('rightLeg');
      if (leftLeg && rightLeg) {
        leftLeg.rotation.x *= 0.8;
        rightLeg.rotation.x *= 0.8;
      }
    }

    // Set player position and ground height
    this.playerPos.y = this.groundHeightAt(this.playerPos.x, this.playerPos.z);
    this.playerGroup.position.copy(this.playerPos);
    this.playerGroup.rotation.y = this.playerAngle;

    // Check Proximity to Pickups (Gathering items)
    for (const pickup of this.pickups) {
      if (!pickup.completed) {
        const dist = Math.hypot(this.playerPos.x - pickup.x, this.playerPos.z - pickup.z);
        if (dist < 2.0) {
          pickup.completed = true;
          this.scene.remove(pickup.mesh);
          if (this.onPickupCallback) {
            this.onPickupCallback(pickup.type);
          }
        }
      }
    }

    // Camera follow with exponential damping
    const targetCamX = this.playerPos.x;
    const targetCamY = this.playerPos.y + 6.5;
    const targetCamZ = this.playerPos.z + 10.5;

    const smoothFactor = 1 - Math.exp(-8 * dt);
    this.camera.position.x += (targetCamX - this.camera.position.x) * smoothFactor;
    this.camera.position.y += (targetCamY - this.camera.position.y) * smoothFactor;
    this.camera.position.z += (targetCamZ - this.camera.position.z) * smoothFactor;

    this.cameraTarget.set(this.playerPos.x, this.playerPos.y + 1.2, this.playerPos.z);
    this.camera.lookAt(this.cameraTarget);
  }

  // Software WebGL pacing with afterDraw sync
  private afterDraw(callback: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.animFrameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.animFrameId = window.setTimeout(callback, 80);
      }
    };
    this.animFrameId = window.setTimeout(poll, 5);
  }

  private startLoop() {
    const tick = () => {
      const rawDt = this.clock.getDelta();
      const dt = Math.min(rawDt, 0.05); // Clamp dt to <= 0.05s

      // Default mock controls if tick called directly; actual controls passed via Game loop
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

  public renderScene() {
    this.renderer.render(this.scene, this.camera);
  }

  public getPlayerPosition(): { x: number; z: number } {
    return { x: this.playerPos.x, z: this.playerPos.z };
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
    cancelAnimationFrame(this.animFrameId);
    clearTimeout(this.animFrameId);
    window.removeEventListener('resize', this.onWindowResize);
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
