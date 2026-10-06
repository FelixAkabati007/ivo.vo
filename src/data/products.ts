export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviews: number;
  image: string;
  description: string;
  features: string[];
  inStock: boolean;
  badge?: string;
}

const categories = [
  'Smartphones', 'Laptops', 'Audio', 'Wearables', 'Cameras',
  'Tablets', 'Gaming', 'Accessories', 'Smart Home', 'TVs'
];

const productNames: Record<string, string[]> = {
  Smartphones: [
    'Nova Pro X1', 'Zenith Ultra 5G', 'Pulse Edge', 'Aurora S24', 'Vertex Pro Max',
    'Lunar Phone 15', 'Titan X Pro', 'Echo Lite 4', 'Prism Z Fold', 'Quantum A55',
    'Stellar Note 9', 'Nebula Mini', 'Horizon Ultra', 'Flux Phone SE', 'Arcadia Pro',
    'Vortex 12 Pro', 'Celestia 8', 'Ion Plus', 'Radiant X', 'Spark Lite'
  ],
  Laptops: [
    'AeroBook Pro 16', 'ZenithPad Ultra', 'CloudBook Air', 'Fusion X1 Carbon', 'PrismBook Studio',
    'NovaPad 14', 'VertexBook Pro', 'Lunar Laptop 15', 'TitanBook ROG', 'EchoBook Slim',
    'StellarPad Creator', 'NebulaBook Flex', 'HorizonPad Elite', 'FluxBook Gaming', 'ArcadiaBook Pro',
    'VortexPad 13', 'CelestiaBook Air', 'IonBook Work', 'RadiantPad X', 'SparkBook Mini',
  ],
  Audio: [
    'SonicWave Pro', 'HarmonyPods Ultra', 'BassForge X3', 'ClarityBuds ANC', 'Resonance 7.1',
    'PulseBeat Elite', 'EchoSphere 360', 'WaveRider Pro', 'SoundCraft Studio', 'VibeCore Max',
    'ThunderBass XL', 'SilentStorm ANC', 'CrystalClear Buds', 'RhythmBox Portable', 'AudioNest Pro',
    'DeepBass Sub', 'MelodyLink Wireless', 'ToneMaster DJ', 'BeatSync Earbuds', 'AcousticPure',
  ],
  Wearables: [
    'ChronoFit Ultra', 'PulseTrack Pro', 'VitaBand 7', 'SmartRing X', 'HealthGuard Watch',
    'FitSphere Elite', 'BioSense Band', 'ActiveCore Pro', 'ThermoWatch Plus', 'NeuroBand AI',
    'GlowFit Luxe', 'StrideTracker X', 'CardioWatch Pro', 'ZenBand Calm', 'PowerFit Max',
    'FlexBand Sport', 'DreamSleep Tracker', 'AquaWatch Dive', 'SolarFit Eco', 'EdgeWatch Pro',
  ],
  Cameras: [
    'OptiLens Pro R5', 'PixelShot 4K', 'FrameMaster X', 'VisionCam Ultra', 'SnapPro Mirrorless',
    'LensCraft DSLR', 'FocusPoint Z9', 'ClarityCam 360', 'ShutterSpeed Pro', 'LightWave Cinema',
    'DepthField AR', 'ColorRange HDR', 'ZoomElite 200mm', 'WideAngle X', 'NightVision Cam',
    'ActionShot Extreme', 'PortraitPro 85mm', 'MacroLens Detail', 'DroneCam Air', 'InstaPrint Cam',
  ],
  Tablets: [
    'SlatePro 12.9', 'DrawPad Ultra', 'FlexTab Pro', 'ScreenCraft X', 'PixelTab S9',
    'NoteTab Creator', 'EduTab Plus', 'MediaTab Entertainment', 'WorkTab Office', 'GameTab Elite',
    'MiniTab 8', 'ProTab Air', 'KidsTab Safe', 'ArtistTab Pro', 'ReaderTab E-Ink',
    'TravelTab Lite', 'BusinessTab Pro', 'DesignTab Stylus', 'PhotoTab HDR', 'MusicTab Studio',
  ],
  Gaming: [
    'ThunderStick Pro', 'PhantomPad Elite', 'NexusCore X', 'HyperFrame RTX', 'BlazeConsole Pro',
    'PixelForge 5', 'GameSphere VR', 'TurboCharge Station', 'CommandDeck Pro', 'ArenaSeat X',
    'LightSpeed Mouse', 'MechKey Ultra', 'GameStream Hub', 'ProGamer Monitor', 'EliteHeadset 7.1',
    'RacingWheel Pro', 'FightStick Arcade', 'FlightSim Yoke', 'RhythmPad DJ', 'MotionSense Cam',
  ],
  Accessories: [
    'PowerVault 20K', 'ChargeHub 65W', 'CablePro USB-C', 'ScreenGuard Pro', 'LensFilter Kit',
    'MountFlex Pro', 'GripCase Ultra', 'StylusPen Pro', 'AdapterHub Multi', 'DockStation Pro',
    'LightRing LED', 'TripodFlex Carbon', 'BagTech Shield', 'CleanKit Pro', 'ProtectFilm HD',
    'MagMount Car', 'WirelessPad Qi2', 'HubStation 8-in-1', 'BatteryPack Slim', 'ExtensionSmart',
  ],
  'Smart Home': [
    'LumiBulb RGB', 'ThermoSense Pro', 'AquaPure Filter', 'AirFlow Purifier', 'SecureView Doorbell',
    'RoboClean X1', 'SleepWell Diffuser', 'PlantSense Monitor', 'EnergyTrack Hub', 'VoiceMate AI',
    'LightStrip Pro', 'SmartPlug WiFi', 'BlindMotion Auto', 'PetFeeder Smart', 'GardenSense Pro',
    'WaterLeak Alert', 'SmokeSense Pro', 'GarageDoor AI', 'ThermostatElite', 'SpeakerMesh Pro',
  ],
  TVs: [
    'VisionMax 65" OLED', 'CrystalView 55" QLED', 'UltraSlim 50" 4K', 'CinemaPro 75" 8K', 'SmartView 43" HD',
    'FrameArt 55" Gallery', 'GameView 48" 120Hz', 'OutdoorView 65"', 'CurvedEdge 55"', 'MiniLED Pro 65"',
    'ProjectBeam 4K', 'PortableView 15"', 'MirrorTV 43"', 'TransparentView 55"', 'RollableView 65"',
    'UltraWide 49" Monitor', 'StudioDisplay 32"', 'ProDisplay XDR', 'NanoCell 75"', 'NeoQuantum 85"',
  ],
};

const descriptions: Record<string, string> = {
  Smartphones: 'Experience cutting-edge mobile technology with stunning displays, powerful processors, and advanced camera systems designed for the modern lifestyle.',
  Laptops: 'Unleash your productivity with premium laptops featuring the latest processors, stunning displays, and all-day battery life for professionals and creators.',
  Audio: 'Immerse yourself in crystal-clear sound with our premium audio devices featuring advanced noise cancellation and studio-quality performance.',
  Wearables: 'Track your health and stay connected with our intelligent wearables combining style, comfort, and advanced biometric sensors.',
  Cameras: 'Capture life\'s moments in stunning detail with professional-grade cameras featuring advanced optics and intelligent shooting modes.',
  Tablets: 'Versatile computing in a sleek form factor — perfect for creativity, entertainment, and productivity on the go.',
  Gaming: 'Dominate the competition with professional gaming gear engineered for precision, speed, and immersive experiences.',
  Accessories: 'Essential accessories to enhance and protect your devices, featuring premium materials and innovative designs.',
  'Smart Home': 'Transform your living space with intelligent devices that bring convenience, security, and energy efficiency to your home.',
  TVs: 'Experience entertainment like never before with stunning displays featuring the latest in OLED, QLED, and MiniLED technology.',
};

const featureSets: Record<string, string[][]> = {
  Smartphones: [
    ['6.7" AMOLED 120Hz', '200MP Camera System', '5000mAh Battery', 'IP68 Water Resistant'],
    ['6.1" Dynamic Display', 'AI-Powered Processor', '45W Fast Charging', 'Titanium Frame'],
  ],
  Laptops: [
    ['16" Retina Display', 'M3 Pro Chip', '18hr Battery Life', 'Thunderbolt 4'],
    ['14" OLED Touchscreen', '32GB RAM', '1TB SSD', 'Backlit Keyboard'],
  ],
  Audio: [
    ['Active Noise Cancellation', '40hr Battery Life', 'Spatial Audio', 'Hi-Res Certified'],
    ['Bluetooth 5.3', 'IPX5 Water Resistant', 'Wireless Charging Case', 'Adaptive EQ'],
  ],
  Wearables: [
    ['Heart Rate Monitor', 'GPS Tracking', '7-Day Battery', 'Water Resistant 50m'],
    ['ECG Sensor', 'Sleep Tracking', 'AMOLED Display', 'Titanium Case'],
  ],
  Cameras: [
    ['45MP Full Frame Sensor', '8K Video Recording', '5-Axis Stabilization', 'Dual Card Slots'],
    ['4K 120fps', 'AI Subject Detection', 'Weather Sealed', '15 Stops Dynamic Range'],
  ],
  Tablets: [
    ['12.9" Liquid Retina XDR', 'M2 Chip', 'Apple Pencil Support', 'All-Day Battery'],
    ['11" AMOLED 120Hz', 'Stylus Included', '5G Connectivity', 'Quad Speakers'],
  ],
  Gaming: [
    ['RGB Backlit', 'Mechanical Switches', 'Programmable Buttons', 'Ergonomic Design'],
    ['Ultra-Low Latency', 'Wireless Freedom', '400hr Battery', 'Custom Profiles'],
  ],
  Accessories: [
    ['Premium Materials', 'Universal Compatibility', 'Compact Design', 'Fast Delivery'],
    ['Military-Grade Protection', 'Slim Profile', 'Precise Cutouts', 'Wireless Charging'],
  ],
  'Smart Home': [
    ['Voice Control', 'App Integration', 'Energy Efficient', 'Easy Setup'],
    ['AI-Powered', 'Multi-Room Sync', 'Privacy Mode', 'Auto-Scheduling'],
  ],
  TVs: [
    ['4K UHD Resolution', '120Hz Refresh Rate', 'Dolby Vision & Atmos', 'Smart TV Platform'],
    ['OLED Self-Lit Pixels', 'Infinite Contrast', 'G-Sync Compatible', 'Film Maker Mode'],
  ],
};

const badges = ['New', 'Sale', 'Hot', 'Limited', 'Best Seller', 'Trending', 'Exclusive', 'Premium'];

function generateImageId(index: number): string {
  const seeds = [
    'electronics', 'technology', 'device', 'gadget', 'tech',
    'computer', 'phone', 'audio', 'camera', 'watch',
    'laptop', 'headphones', 'speaker', 'monitor', 'keyboard',
    'mouse', 'tablet', 'console', 'smart', 'digital'
  ];
  return seeds[index % seeds.length] + '-' + index;
}

export function generateProducts(): Product[] {
  const products: Product[] = [];
  let id = 1;

  categories.forEach((category, catIdx) => {
    const names = productNames[category];
    const desc = descriptions[category];
    const features = featureSets[category];

    names.forEach((name, nameIdx) => {
      const basePrice = Math.floor(Math.random() * 900) + 49;
      const discount = Math.random() > 0.6 ? Math.floor(Math.random() * 30) + 5 : 0;
      const originalPrice = discount > 0 ? Math.floor(basePrice / (1 - discount / 100)) : basePrice;
      const rating = Math.round((3.5 + Math.random() * 1.5) * 10) / 10;
      const reviews = Math.floor(Math.random() * 2000) + 50;
      const hasBadge = Math.random() > 0.65;
      const imgId = generateImageId(id);

      products.push({
        id,
        name,
        category,
        price: basePrice,
        originalPrice: discount > 0 ? originalPrice : basePrice,
        rating,
        reviews,
        image: `https://picsum.photos/seed/${imgId}/600/600`,
        description: desc,
        features: features[nameIdx % features.length],
        inStock: Math.random() > 0.1,
        badge: hasBadge ? badges[Math.floor(Math.random() * badges.length)] : undefined,
      });
      id++;
    });
  });

  return products;
}

export const allProducts = generateProducts();
export const allCategories = categories;
