/**
 * Terra3D - 3D World Map & Real City Walk Explorer
 * Mode 1: 3D Space Globe (Three.js)
 * Mode 2: Satellite 3D Walk (MapLibre GIS)
 * Mode 3: 3D City & Terrain Mesh Walk (BlenderGIS & MapsModels 3D Mesh)
 */

// Global State
const state = {
    activeMode: 'globe', // 'globe', 'walk', 'city'
    autoRotate: true,
    rotateSpeed: 0.6,
    terrainExaggeration: 1.6,
    walkSpeedMultiplier: 1.0,
    layers: {
        clouds: true,
        night: false,
        arcs: true,
        markers: true,
        cityBuildings: true,
        cityLights: true,
        cityWater: true
    },
    audioActive: false,
    selectedTarget: null,
    // First-person walking state
    walking: {
        forward: false,
        backward: false,
        left: false,
        right: false,
        sprint: false
    }
};

// 3D Locations Database (with City Mesh & Walk attributes)
const DESTINATIONS = [
    {
        id: 'venice',
        name: 'Venice 3D City, Italy',
        malayalam: 'വെനീസ് 3D സിറ്റി (കനാലുകളും പാലങ്ങളും)',
        type: 'Historic Water City',
        theme: 'venice',
        lat: 45.4408,
        lng: 12.3155,
        elevation: 'Sea Level',
        location: 'Venice, Italy',
        desc: 'MapsModelsImporter സാംപിളിൽ നിന്നുള്ള വെനീസിലെ യഥാർത്ഥ 3D കെട്ടിടങ്ങളും പുരാതന പാലങ്ങളും കനാലുകളും.'
    },
    {
        id: 'newyork',
        name: 'New York Manhattan, USA',
        malayalam: 'ന്യൂയോർക്ക് മാൻഹാട്ടൻ 3D',
        type: 'Metropolis',
        theme: 'newyork',
        lat: 40.7128,
        lng: -74.0060,
        elevation: '10 m (Skyscrapers: 400m)',
        location: 'New York, USA',
        desc: 'ആകാശത്തോളം ഉയർന്നുനിൽക്കുന്ന 3D അംബരചുംബികളും തെരുവുകളും.'
    },
    {
        id: 'everest',
        name: 'Mount Everest (Himalayas)',
        malayalam: 'എവറസ്റ്റ് കൊടുമുടി (ഹിമാലയം)',
        type: 'Highest Mountain',
        theme: 'mountain',
        lat: 27.9881,
        lng: 86.9250,
        elevation: '8,848 m',
        location: 'Nepal / Tibet Border',
        desc: 'BlenderGIS NASA എലവേഷൻ അടിസ്ഥാനമാക്കിയുള്ള കൂറ്റൻ 3D ഹിമാലയൻ പർവതനിരകൾ.'
    },
    {
        id: 'munnar',
        name: 'Munnar Tea Hills, Kerala',
        malayalam: 'മൂന്നാർ (കേരളം 3D)',
        type: 'Western Ghats Terrain',
        theme: 'munnar',
        lat: 10.0889,
        lng: 77.0595,
        elevation: '1,600 m',
        location: 'Idukki, Kerala, India',
        desc: 'പശ്ചിമഘട്ടത്തിലെ മനോഹരമായ 3D മലനിരകളും വളഞ്ഞുപുളഞ്ഞ റോഡുകളും.'
    },
    {
        id: 'grandcanyon',
        name: 'Grand Canyon, USA',
        malayalam: 'ഗ്രാൻഡ് കാന്യൺ',
        type: 'Geological Wonder',
        theme: 'canyon',
        lat: 36.0569,
        lng: -112.1401,
        elevation: '2,100 m',
        location: 'Arizona, United States',
        desc: 'അഗാധമായ മലയിടുക്കും പാറക്കെട്ടുകളും നിറഞ്ഞ 3D ലാൻഡ്സ്കേപ്പ്.'
    },
    {
        id: 'alps',
        name: 'Swiss Alps, Switzerland',
        malayalam: 'സ്വിസ് ആൽപ്സ് മലനിരകൾ',
        type: 'Alpine Mountain Peak',
        theme: 'mountain',
        lat: 45.9763,
        lng: 7.7491,
        elevation: '4,478 m',
        location: 'Zermatt, Switzerland',
        desc: 'മഞ്ഞുമൂടിയ ആൽപ്സ് കൊടുമുടികൾക്കിടയിലൂടെയുള്ള 3D വാക്ക്.'
    },
    {
        id: 'dubai',
        name: 'Dubai Marina & Coast',
        malayalam: 'ദുബായ് മറീന',
        type: 'Futuristic City Coast',
        theme: 'newyork',
        lat: 25.0805,
        lng: 55.1403,
        elevation: 'Sea Level',
        location: 'United Arab Emirates',
        desc: 'പേർഷ്യൻ ഗൾഫ് തീരത്തെ ആധുനിക നഗരക്കാഴ്ചകൾ.'
    }
];

// Mode 1: Space Globe Variables
const EARTH_RADIUS = 10;
let globeScene, globeCamera, globeRenderer, globeControls;
let earthMesh, cloudsMesh, atmosphereMesh, starfieldMesh;
let dayTexture, nightTexture, bumpTexture, specularTexture, cloudsTexture;
let earthMaterial;
let markersGroup = new THREE.Group();
let arcsGroup = new THREE.Group();
let animatedPhotons = [];

// Mode 2: MapLibre GIS Variables
let maplibreMap = null;
let maplibreInitialized = false;

// Mode 3: 3D City & Mesh Walk Variables
let cityScene, cityCamera, cityRenderer;
let cityWorldGroup = new THREE.Group();
let playerPos = new THREE.Vector3(0, 1.8, 0);
let playerYaw = 0;
let playerPitch = 0;
let isMouseDown = false;
let mouseLastX = 0, mouseLastY = 0;
let currentTheme = 'venice';

// Audio
let audioCtx = null, audioOsc = null, audioGain = null;

// DOM Elements
const globeContainer = document.getElementById('globe-view');
const maplibreContainer = document.getElementById('maplibre-view');
const cityContainer = document.getElementById('city-view');
const btnModeGlobe = document.getElementById('btn-mode-globe');
const btnModeWalk = document.getElementById('btn-mode-walk');
const btnModeCity = document.getElementById('btn-mode-city');
const btnAudio = document.getElementById('btn-audio');
const btnFullscreen = document.getElementById('btn-fullscreen');
const searchInput = document.getElementById('location-search');
const searchResults = document.getElementById('search-results');
const infoCard = document.getElementById('info-card');
const btnCloseInfo = document.getElementById('btn-close-info');
const btnFlytoDetail = document.getElementById('btn-flyto-detail');
const loader = document.getElementById('loader');
const loaderStatus = document.getElementById('loader-status');
const walkOverlay = document.getElementById('walk-overlay');
const walkBadgeText = document.getElementById('walk-badge-text');

// Panels
const modeGlobeControls = document.querySelector('.mode-globe-controls');
const modeWalkControls = document.querySelector('.mode-walk-controls');
const modeCityControls = document.querySelector('.mode-city-controls');
const leftPanel = document.querySelector('.floating-panel');
const btnClosePanel = document.getElementById('toggle-panel-btn');
const btnReopenPanel = document.getElementById('btn-reopen-panel');

// HUD
const hudLocationName = document.getElementById('hud-location-name');
const hudLat = document.getElementById('hud-lat');
const hudLng = document.getElementById('hud-lng');
const hudModeBadge = document.getElementById('hud-mode-badge');

// Controls
const toggleClouds = document.getElementById('layer-clouds');
const toggleNight = document.getElementById('layer-night');
const toggleArcs = document.getElementById('layer-arcs');
const toggleMarkers = document.getElementById('layer-markers');
const toggleAutorotate = document.getElementById('toggle-autorotate');
const rotateSpeedSlider = document.getElementById('rotate-speed');
const speedValLabel = document.getElementById('speed-val');
const walkSpeedSlider = document.getElementById('walk-speed-slider');
const walkSpeedVal = document.getElementById('walk-speed-val');

// Start Application
window.addEventListener('DOMContentLoaded', () => {
    initThreeJSEarth();
    initCityMeshViewer();
    initUIEventListeners();
    initFPSWalkingControls();
});

/**
 * ==========================================
 * MODE 1: THREE.JS 3D SPACE GLOBE
 * ==========================================
 */
function initThreeJSEarth() {
    loaderStatus.innerText = 'Creating 3D Earth Globe...';

    globeScene = new THREE.Scene();
    globeCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    globeCamera.position.set(0, 8, 26);

    globeRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    globeRenderer.setSize(window.innerWidth, window.innerHeight);
    globeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    globeRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    globeContainer.appendChild(globeRenderer.domElement);

    globeControls = new THREE.OrbitControls(globeCamera, globeRenderer.domElement);
    globeControls.enableDamping = true;
    globeControls.dampingFactor = 0.05;
    globeControls.autoRotate = state.autoRotate;
    globeControls.autoRotateSpeed = state.rotateSpeed;

    const ambientLight = new THREE.AmbientLight(0x334455, 1.2);
    globeScene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
    sunLight.position.set(30, 15, 30);
    globeScene.add(sunLight);

    const textureLoader = new THREE.TextureLoader();
    dayTexture = textureLoader.load('textures/earth-day.jpg', onResourceReady);
    bumpTexture = textureLoader.load('textures/earth-bump.png');
    specularTexture = textureLoader.load('textures/earth-specular.png');
    nightTexture = textureLoader.load('textures/earth-night.jpg');
    cloudsTexture = textureLoader.load('textures/earth-clouds.png');

    const earthGeometry = new THREE.SphereGeometry(EARTH_RADIUS, 64, 64);
    earthMaterial = new THREE.MeshPhongMaterial({
        map: dayTexture,
        bumpMap: bumpTexture,
        bumpScale: 0.18,
        specularMap: specularTexture,
        specular: new THREE.Color(0x223344),
        shininess: 12
    });
    earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    globeScene.add(earthMesh);

    const cloudsGeometry = new THREE.SphereGeometry(EARTH_RADIUS + 0.12, 64, 64);
    const cloudsMaterial = new THREE.MeshStandardMaterial({
        map: cloudsTexture,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending
    });
    cloudsMesh = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
    globeScene.add(cloudsMesh);

    createAtmosphereGlow();
    createStarfield();
    createLandmarkPins();
    globeScene.add(markersGroup);

    window.addEventListener('resize', onWindowResize);
    animate();
}

function onResourceReady() {
    setTimeout(() => {
        loader.classList.add('hidden');
    }, 300);
}

function createAtmosphereGlow() {
    const atmosphereGeometry = new THREE.SphereGeometry(EARTH_RADIUS * 1.15, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
        vertexShader: `
            varying vec3 vNormal;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying vec3 vNormal;
            void main() {
                float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
                gl_FragColor = vec4(0.0, 0.82, 1.0, 1.0) * intensity;
            }
        `,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true
    });
    atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    globeScene.add(atmosphereMesh);
}

function createStarfield() {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 3500;
    const starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
        const r = 120 + Math.random() * 200;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        starPositions[i] = r * Math.sin(phi) * Math.cos(theta);
        starPositions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
        starPositions[i + 2] = r * Math.cos(phi);
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.8,
        transparent: true,
        opacity: 0.85
    });
    starfieldMesh = new THREE.Points(starGeometry, starMaterial);
    globeScene.add(starfieldMesh);
}

function latLngToVector3(lat, lng, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    return new THREE.Vector3(
        -(radius * Math.sin(phi) * Math.cos(theta)),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
    );
}

function createLandmarkPins() {
    markersGroup.clear();

    DESTINATIONS.forEach(dest => {
        const pos = latLngToVector3(dest.lat, dest.lng, EARTH_RADIUS);
        const normal = pos.clone().normalize();

        const pinObj = new THREE.Group();
        pinObj.position.copy(pos);
        pinObj.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);

        const pinGeo = new THREE.CylinderGeometry(0.06, 0.15, 0.8, 12);
        pinGeo.translate(0, 0.4, 0);
        const pinMat = new THREE.MeshBasicMaterial({ color: 0xff4b72 });
        const pinMesh = new THREE.Mesh(pinGeo, pinMat);

        const headGeo = new THREE.SphereGeometry(0.2, 16, 16);
        headGeo.translate(0, 0.8, 0);
        const headMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe });
        const headMesh = new THREE.Mesh(headGeo, headMat);

        pinObj.add(pinMesh);
        pinObj.add(headMesh);
        pinObj.userData = { destination: dest };
        markersGroup.add(pinObj);
    });
}

/**
 * ================================================================
 * MODE 3: 3D CITY & TERRAIN MESH VIEWER (BlenderGIS & MapsModels)
 * ================================================================
 */
function initCityMeshViewer() {
    cityScene = new THREE.Scene();
    cityScene.fog = new THREE.FogExp2(0x15253e, 0.005);

    cityCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    cityCamera.position.set(0, 2.5, 0);

    cityRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    cityRenderer.setSize(window.innerWidth, window.innerHeight);
    cityRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    cityRenderer.shadowMap.enabled = true;
    cityRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    cityContainer.appendChild(cityRenderer.domElement);

    // City Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x334455, 0.8);
    cityScene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.8);
    dirLight.position.set(80, 120, 60);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    cityScene.add(dirLight);

    cityScene.add(cityWorldGroup);

    // Build Initial 3D Model: Venice City
    build3DEnvironment('venice');

    // Mouse Look Listeners for Walking
    cityRenderer.domElement.addEventListener('mousedown', (e) => {
        isMouseDown = true;
        mouseLastX = e.clientX;
        mouseLastY = e.clientY;
    });

    window.addEventListener('mouseup', () => { isMouseDown = false; });

    window.addEventListener('mousemove', (e) => {
        if (!isMouseDown || state.activeMode !== 'city') return;
        const deltaX = e.clientX - mouseLastX;
        const deltaY = e.clientY - mouseLastY;
        mouseLastX = e.clientX;
        mouseLastY = e.clientY;

        playerYaw -= deltaX * 0.003;
        playerPitch -= deltaY * 0.003;
        playerPitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, playerPitch));
    });
}

/**
 * Procedural 3D Mesh Generator (Simulates BlenderGIS & MapsModels 3D Cities)
 */
function build3DEnvironment(theme) {
    cityWorldGroup.clear();
    currentTheme = theme;
    playerPos.set(0, 2.0, 0);

    if (theme === 'venice') {
        buildVeniceCanalsAndBridges();
    } else if (theme === 'newyork') {
        buildManhattanSkyscrapers();
    } else if (theme === 'mountain') {
        buildHimalayasTerrain();
    } else if (theme === 'munnar') {
        buildMunnarTeaHills();
    } else if (theme === 'canyon') {
        buildGrandCanyonMesh();
    }
}

/**
 * 1. Venice 3D City (Canals, Stone Bridges, Terracotta Italian Buildings)
 */
function buildVeniceCanalsAndBridges() {
    // Water Canal Floor
    const waterGeo = new THREE.PlaneGeometry(300, 300);
    const waterMat = new THREE.MeshStandardMaterial({
        color: 0x1d4d5e,
        roughness: 0.1,
        metalness: 0.8
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.y = -0.5;
    cityWorldGroup.add(waterMesh);

    // Cobblestone Pavements / Walkways
    const walkwayGeo = new THREE.BoxGeometry(10, 1.0, 180);
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x9c9588, roughness: 0.85 });
    
    const walkwayLeft = new THREE.Mesh(walkwayGeo, stoneMat);
    walkwayLeft.position.set(-10, 0, 0);
    walkwayLeft.receiveShadow = true;
    cityWorldGroup.add(walkwayLeft);

    const walkwayRight = new THREE.Mesh(walkwayGeo, stoneMat);
    walkwayRight.position.set(10, 0, 0);
    walkwayRight.receiveShadow = true;
    cityWorldGroup.add(walkwayRight);

    // Arched Venice Stone Bridges across the canal
    for (let z = -60; z <= 60; z += 40) {
        const bridgeArch = new THREE.Mesh(
            new THREE.CylinderGeometry(5, 5, 12, 16, 1, false, 0, Math.PI),
            stoneMat
        );
        bridgeArch.rotation.z = Math.PI / 2;
        bridgeArch.rotation.y = Math.PI / 2;
        bridgeArch.position.set(0, 0.5, z);
        cityWorldGroup.add(bridgeArch);
    }

    // Classic Venetian Multi-story Buildings
    const bldgColors = [0xd66853, 0xe09f3e, 0xefd07b, 0xba5a31, 0x8a3b2b];
    for (let z = -80; z <= 80; z += 18) {
        // Left Bank Buildings
        const h1 = 15 + Math.random() * 15;
        const bldgMat1 = new THREE.MeshStandardMaterial({
            color: bldgColors[Math.floor(Math.random() * bldgColors.length)],
            roughness: 0.7
        });
        const bldg1 = new THREE.Mesh(new THREE.BoxGeometry(14, h1, 16), bldgMat1);
        bldg1.position.set(-22, h1 / 2, z);
        bldg1.castShadow = true;
        bldg1.receiveShadow = true;
        cityWorldGroup.add(bldg1);

        // Right Bank Buildings
        const h2 = 14 + Math.random() * 18;
        const bldgMat2 = new THREE.MeshStandardMaterial({
            color: bldgColors[Math.floor(Math.random() * bldgColors.length)],
            roughness: 0.7
        });
        const bldg2 = new THREE.Mesh(new THREE.BoxGeometry(14, h2, 16), bldgMat2);
        bldg2.position.set(22, h2 / 2, z);
        bldg2.castShadow = true;
        bldg2.receiveShadow = true;
        cityWorldGroup.add(bldg2);
    }
}

/**
 * 2. New York Manhattan 3D Skyscrapers & Grid Streets
 */
function buildManhattanSkyscrapers() {
    // Asphalt Ground
    const groundGeo = new THREE.PlaneGeometry(400, 400);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x1a1c22, roughness: 0.9 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    cityWorldGroup.add(ground);

    // Skyscrapers Grid
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x223d5a, roughness: 0.2, metalness: 0.8 });
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x778392, roughness: 0.6 });

    for (let x = -100; x <= 100; x += 35) {
        for (let z = -100; z <= 100; z += 35) {
            if (Math.abs(x) < 15 && Math.abs(z) < 15) continue; // Player spawn center street

            const height = 40 + Math.random() * 90;
            const width = 20 + Math.random() * 8;
            const mat = Math.random() > 0.4 ? glassMat : concreteMat;

            const skyscraper = new THREE.Mesh(new THREE.BoxGeometry(width, height, width), mat);
            skyscraper.position.set(x, height / 2, z);
            skyscraper.castShadow = true;
            skyscraper.receiveShadow = true;
            cityWorldGroup.add(skyscraper);
        }
    }
}

/**
 * 3. Mount Everest & Himalayas (Real 3D Triangulated Elevation Terrain)
 */
function buildHimalayasTerrain() {
    const terrainGeo = new THREE.PlaneGeometry(350, 350, 64, 64);
    const pos = terrainGeo.attributes.position;

    for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i);
        const vy = pos.getY(i);
        // Himalayan Ridge Function
        const distCenter = Math.sqrt(vx * vx + vy * vy);
        const height = (Math.sin(vx * 0.04) * Math.cos(vy * 0.04) * 25) +
                       (Math.sin(vx * 0.08) * 12) +
                       Math.max(0, 60 - distCenter * 0.35);

        pos.setZ(i, height);
    }
    terrainGeo.computeVertexNormals();

    const snowMat = new THREE.MeshStandardMaterial({
        color: 0xedf2f7,
        roughness: 0.8,
        flatShading: true
    });
    const mountainMesh = new THREE.Mesh(terrainGeo, snowMat);
    mountainMesh.rotation.x = -Math.PI / 2;
    mountainMesh.position.y = -2;
    mountainMesh.receiveShadow = true;
    cityWorldGroup.add(mountainMesh);
}

/**
 * 4. Munnar Tea Hills (Kerala Rolling 3D Green Hills)
 */
function buildMunnarTeaHills() {
    const terrainGeo = new THREE.PlaneGeometry(300, 300, 48, 48);
    const pos = terrainGeo.attributes.position;

    for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i);
        const vy = pos.getY(i);
        const h = Math.sin(vx * 0.05) * Math.cos(vy * 0.05) * 15 + Math.sin(vx * 0.02) * 10;
        pos.setZ(i, h);
    }
    terrainGeo.computeVertexNormals();

    const teaMat = new THREE.MeshStandardMaterial({
        color: 0x2e6f40,
        roughness: 0.9,
        flatShading: true
    });
    const hillMesh = new THREE.Mesh(terrainGeo, teaMat);
    hillMesh.rotation.x = -Math.PI / 2;
    hillMesh.position.y = -2;
    hillMesh.receiveShadow = true;
    cityWorldGroup.add(hillMesh);
}

/**
 * 5. Grand Canyon 3D Mesh
 */
function buildGrandCanyonMesh() {
    const canyonGeo = new THREE.PlaneGeometry(300, 300, 48, 48);
    const pos = canyonGeo.attributes.position;

    for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i);
        const vy = pos.getY(i);
        // Deep Canyon gorge through the middle
        const canyonDepth = Math.exp(-Math.pow(vx * 0.08, 2)) * -40;
        const rugged = Math.sin(vy * 0.1) * 6;
        pos.setZ(i, canyonDepth + rugged);
    }
    canyonGeo.computeVertexNormals();

    const rockMat = new THREE.MeshStandardMaterial({
        color: 0xa85332,
        roughness: 0.95,
        flatShading: true
    });
    const canyonMesh = new THREE.Mesh(canyonGeo, rockMat);
    canyonMesh.rotation.x = -Math.PI / 2;
    canyonMesh.receiveShadow = true;
    cityWorldGroup.add(canyonMesh);
}

/**
 * First Person Walking Engine (FPS Controller)
 */
function initFPSWalkingControls() {
    window.addEventListener('keydown', (e) => {
        if (['input', 'textarea'].includes(document.activeElement.tagName.toLowerCase())) return;
        const key = e.key.toLowerCase();

        if (key === 'w' || key === 'arrowup') state.walking.forward = true;
        if (key === 's' || key === 'arrowdown') state.walking.backward = true;
        if (key === 'a' || key === 'arrowleft') state.walking.left = true;
        if (key === 'd' || key === 'arrowright') state.walking.right = true;
        if (e.shiftKey) state.walking.sprint = true;
        if (key === ' ') { playerPos.y += 3; } // Jump
    });

    window.addEventListener('keyup', (e) => {
        const key = e.key.toLowerCase();
        if (key === 'w' || key === 'arrowup') state.walking.forward = false;
        if (key === 's' || key === 'arrowdown') state.walking.backward = false;
        if (key === 'a' || key === 'arrowleft') state.walking.left = false;
        if (key === 'd' || key === 'arrowright') state.walking.right = false;
        if (!e.shiftKey) state.walking.sprint = false;
    });

    // D-Pad Onscreen Buttons
    setupDpad('dpad-up', 'forward');
    setupDpad('dpad-down', 'backward');
    setupDpad('dpad-left', 'left');
    setupDpad('dpad-right', 'right');

    document.getElementById('dpad-center').addEventListener('click', () => {
        playerPitch = 0;
    });
    document.getElementById('dpad-elevate-up').addEventListener('click', () => { playerPos.y += 5; });
    document.getElementById('dpad-elevate-down').addEventListener('click', () => { playerPos.y = Math.max(1.8, playerPos.y - 5); });
}

function setupDpad(id, dir) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('mousedown', (e) => { e.preventDefault(); state.walking[dir] = true; });
    btn.addEventListener('mouseup', () => { state.walking[dir] = false; });
    btn.addEventListener('mouseleave', () => { state.walking[dir] = false; });
    btn.addEventListener('touchstart', (e) => { e.preventDefault(); state.walking[dir] = true; }, { passive: false });
    btn.addEventListener('touchend', () => { state.walking[dir] = false; });
}

function updateCityWalking() {
    const { forward, backward, left, right, sprint } = state.walking;
    if (!forward && !backward && !left && !right) return;

    let speed = 0.4 * state.walkSpeedMultiplier;
    if (sprint) speed *= 1.8;

    const forwardX = -Math.sin(playerYaw);
    const forwardZ = -Math.cos(playerYaw);
    const rightX = Math.cos(playerYaw);
    const rightZ = -Math.sin(playerYaw);

    if (forward) {
        playerPos.x += forwardX * speed;
        playerPos.z += forwardZ * speed;
    }
    if (backward) {
        playerPos.x -= forwardX * speed;
        playerPos.z -= forwardZ * speed;
    }
    if (left) {
        playerPos.x -= rightX * speed;
        playerPos.z -= rightZ * speed;
    }
    if (right) {
        playerPos.x += rightX * speed;
        playerPos.z += rightZ * speed;
    }

    // Camera follow
    cityCamera.position.copy(playerPos);
    cityCamera.rotation.order = 'YXZ';
    cityCamera.rotation.y = playerYaw;
    cityCamera.rotation.x = playerPitch;
}

/**
 * Main Animation Loop
 */
function animate() {
    requestAnimationFrame(animate);

    if (state.activeMode === 'globe') {
        if (cloudsMesh && state.layers.clouds) {
            cloudsMesh.rotation.y += 0.0003;
        }
        globeControls.update();
        globeRenderer.render(globeScene, globeCamera);
    } else if (state.activeMode === 'city') {
        updateCityWalking();
        cityRenderer.render(cityScene, cityCamera);
    }
}

function onWindowResize() {
    globeCamera.aspect = window.innerWidth / window.innerHeight;
    globeCamera.updateProjectionMatrix();
    globeRenderer.setSize(window.innerWidth, window.innerHeight);

    cityCamera.aspect = window.innerWidth / window.innerHeight;
    cityCamera.updateProjectionMatrix();
    cityRenderer.setSize(window.innerWidth, window.innerHeight);

    if (maplibreMap) maplibreMap.resize();
}

/**
 * =======================================================
 * MODE SWITCHER
 * =======================================================
 */
function switchMode(newMode) {
    if (state.activeMode === newMode) return;
    state.activeMode = newMode;

    // Reset viewports
    globeContainer.classList.remove('active');
    maplibreContainer.classList.remove('active');
    cityContainer.classList.remove('active');

    btnModeGlobe.classList.remove('active');
    btnModeWalk.classList.remove('active');
    btnModeCity.classList.remove('active');

    modeGlobeControls.classList.add('hidden');
    modeWalkControls.classList.add('hidden');
    modeCityControls.classList.add('hidden');
    walkOverlay.classList.add('hidden');

    if (newMode === 'globe') {
        btnModeGlobe.classList.add('active');
        globeContainer.classList.add('active');
        modeGlobeControls.classList.remove('hidden');
        hudModeBadge.innerText = '🌐 3D Globe';
    } else if (newMode === 'walk') {
        btnModeWalk.classList.add('active');
        maplibreContainer.classList.add('active');
        modeWalkControls.classList.remove('hidden');
        walkOverlay.classList.remove('hidden');
        hudModeBadge.innerText = '🏔️ Satellite 3D Walk';
        walkBadgeText.innerText = '🏔️ സാറ്റലൈറ്റ് 3D വാക്ക് മോഡ്';

        if (!maplibreInitialized) {
            initMapLibre3DTerrain();
        } else {
            maplibreMap.resize();
        }
    } else if (newMode === 'city') {
        btnModeCity.classList.add('active');
        cityContainer.classList.add('active');
        modeCityControls.classList.remove('hidden');
        walkOverlay.classList.remove('hidden');
        hudModeBadge.innerText = '🏙️ 3D City Mesh Walk';
        walkBadgeText.innerText = '🏙️ 3D സിറ്റി & തെരുവ് വാക്ക് മോഡ്';
    }
}

/**
 * Mode 2: MapLibre GIS Initialization
 */
function initMapLibre3DTerrain() {
    if (maplibreInitialized) return;
    maplibreInitialized = true;

    loader.classList.remove('hidden');
    loaderStatus.innerText = 'Streaming 3D Real World GIS...';

    maplibreMap = new maplibregl.Map({
        container: 'maplibre-view',
        style: {
            version: 8,
            sources: {
                'satellite-source': {
                    'type': 'raster',
                    'tiles': ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
                    'tileSize': 256,
                    'maxzoom': 19
                },
                'terrain-source': {
                    'type': 'raster-dem',
                    'tiles': ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
                    'encoding': 'terrarium',
                    'tileSize': 256,
                    'maxzoom': 15
                }
            },
            layers: [{ 'id': 'satellite-layer', 'type': 'raster', 'source': 'satellite-source' }],
            terrain: { 'source': 'terrain-source', 'exaggeration': state.terrainExaggeration },
            sky: {
                'sky-color': '#00d2ff',
                'sky-horizon-blend': 0.5,
                'horizon-color': '#ffffff',
                'fog-color': '#07090e'
            }
        },
        center: [12.3155, 45.4408],
        zoom: 14.5,
        pitch: 80,
        bearing: 0,
        maxPitch: 85,
        attributionControl: false
    });

    maplibreMap.on('load', () => {
        loader.classList.add('hidden');
    });
}

/**
 * Jump to 3D Model / Destination
 */
function jumpToDestination(dest) {
    state.selectedTarget = dest;
    hudLocationName.innerText = dest.name;
    hudLat.innerText = `${dest.lat.toFixed(2)}° N`;
    hudLng.innerText = `${dest.lng.toFixed(2)}° E`;

    openInfoCard(dest);

    if (dest.theme) {
        // Switch to 3D City Mesh Walk
        switchMode('city');
        build3DEnvironment(dest.theme);
    } else {
        switchMode('walk');
        if (maplibreMap) {
            maplibreMap.flyTo({ center: [dest.lng, dest.lat], zoom: 14, pitch: 80 });
        }
    }
}

function openInfoCard(data) {
    document.getElementById('info-type').innerText = data.type || '3D Model';
    document.getElementById('info-title').innerText = data.name;
    document.getElementById('info-malayalam').innerText = data.malayalam || '';
    document.getElementById('info-desc').innerText = data.desc || '';
    document.getElementById('info-elevation').innerText = data.elevation || 'Sea Level';
    document.getElementById('info-location').innerText = data.location || '';
    infoCard.classList.remove('hidden');
}

function closeInfoCard() {
    infoCard.classList.add('hidden');
}

/**
 * Audio Synthesizer
 */
function toggleAmbientAudio() {
    if (!state.audioActive) {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            audioOsc = audioCtx.createOscillator();
            audioOsc.type = 'sine';
            audioOsc.frequency.setValueAtTime(55, audioCtx.currentTime);

            const filter = audioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(140, audioCtx.currentTime);

            audioGain = audioCtx.createGain();
            audioGain.gain.setValueAtTime(0.01, audioCtx.currentTime);
            audioGain.gain.exponentialRampToValueAtTime(0.12, audioCtx.currentTime + 2.5);

            audioOsc.connect(filter);
            filter.connect(audioGain);
            audioGain.connect(audioCtx.destination);

            audioOsc.start();
            state.audioActive = true;
            btnAudio.style.borderColor = 'var(--primary)';
            btnAudio.style.boxShadow = '0 0 15px var(--primary-glow)';
        } catch (e) {
            console.warn(e);
        }
    } else {
        if (audioGain) {
            audioGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1);
            setTimeout(() => {
                if (audioOsc) audioOsc.stop();
                if (audioCtx) audioCtx.close();
                state.audioActive = false;
                btnAudio.style.borderColor = '';
                btnAudio.style.boxShadow = '';
            }, 1000);
        }
    }
}

/**
 * UI Event Listeners
 */
function initUIEventListeners() {
    btnModeGlobe.addEventListener('click', () => switchMode('globe'));
    btnModeWalk.addEventListener('click', () => switchMode('walk'));
    btnModeCity.addEventListener('click', () => switchMode('city'));

    btnAudio.addEventListener('click', toggleAmbientAudio);
    btnFullscreen.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen().catch(() => {});
        }
    });

    document.querySelectorAll('.pill-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const destId = btn.getAttribute('data-dest');
            const target = DESTINATIONS.find(d => d.id === destId);
            if (target) jumpToDestination(target);
        });
    });

    // Search
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        searchResults.innerHTML = '';
        if (!query) {
            searchResults.classList.add('hidden');
            return;
        }

        const matches = DESTINATIONS.filter(d =>
            d.name.toLowerCase().includes(query) ||
            (d.malayalam && d.malayalam.toLowerCase().includes(query))
        );

        if (matches.length > 0) {
            searchResults.classList.remove('hidden');
            matches.forEach(item => {
                const el = document.createElement('div');
                el.className = 'search-item';
                el.innerHTML = `<div><div class="name">${item.name}</div><div class="desc">${item.malayalam}</div></div><span>🏙️</span>`;
                el.addEventListener('click', () => {
                    jumpToDestination(item);
                    searchInput.value = item.name;
                    searchResults.classList.add('hidden');
                });
                searchResults.appendChild(el);
            });
        } else {
            searchResults.classList.add('hidden');
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-box')) searchResults.classList.add('hidden');
    });

    btnCloseInfo.addEventListener('click', closeInfoCard);
    btnFlytoDetail.addEventListener('click', () => {
        if (state.selectedTarget) jumpToDestination(state.selectedTarget);
    });

    btnClosePanel.addEventListener('click', () => {
        leftPanel.classList.add('collapsed');
        btnReopenPanel.classList.remove('hidden');
    });
    btnReopenPanel.addEventListener('click', () => {
        leftPanel.classList.remove('collapsed');
        btnReopenPanel.classList.add('hidden');
    });

    // Speed Slider
    walkSpeedSlider?.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        state.walkSpeedMultiplier = val;
        walkSpeedVal.innerText = `${val}x`;
    });
}
