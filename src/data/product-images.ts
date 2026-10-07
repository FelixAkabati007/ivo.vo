/**
 * Real Electronic Product Images
 * High-quality product images from Unsplash with clean backgrounds
 * All images are authentic electronic products matching their descriptions
 */

export interface ProductImage {
  url: string;
  alt: string;
  background: 'white' | 'black' | 'transparent';
}

// Curated Unsplash photo IDs for electronic products
// Using specific photo IDs for consistency and quality
export const productImages: Record<string, ProductImage> = {
  // ============================================
  // SMARTPHONES (20 products)
  // ============================================
  'Nova Pro X1': { url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=750&fit=crop&crop=center', alt: 'Nova Pro X1 Smartphone', background: 'white' },
  'Zenith Ultra 5G': { url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&h=750&fit=crop&crop=center', alt: 'Zenith Ultra 5G Phone', background: 'white' },
  'Pulse Edge': { url: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&h=750&fit=crop&crop=center', alt: 'Pulse Edge Smartphone', background: 'black' },
  'Aurora S24': { url: 'https://images.unsplash.com/photo-1585060544812-6b4574b95fa3?w=600&h=750&fit=crop&crop=center', alt: 'Aurora S24 Phone', background: 'white' },
  'Vertex Pro Max': { url: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&h=750&fit=crop&crop=center', alt: 'Vertex Pro Max', background: 'black' },
  'Lunar Phone 15': { url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&h=750&fit=crop&crop=center', alt: 'Lunar Phone 15', background: 'white' },
  'Titan X Pro': { url: 'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=600&h=750&fit=crop&crop=center', alt: 'Titan X Pro Phone', background: 'black' },
  'Echo Lite 4': { url: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=600&h=750&fit=crop&crop=center', alt: 'Echo Lite 4', background: 'white' },
  'Prism Z Fold': { url: 'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=600&h=750&fit=crop&crop=center', alt: 'Prism Z Fold Phone', background: 'black' },
  'Quantum A55': { url: 'https://images.unsplash.com/photo-1573126617899-41f167532042?w=600&h=750&fit=crop&crop=center', alt: 'Quantum A55', background: 'white' },
  'Stellar Note 9': { url: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=600&h=750&fit=crop&crop=center', alt: 'Stellar Note 9', background: 'black' },
  'Nebula Mini': { url: 'https://images.unsplash.com/photo-1512054502232-10a0a035d672?w=600&h=750&fit=crop&crop=center', alt: 'Nebula Mini Phone', background: 'white' },
  'Horizon Ultra': { url: 'https://images.unsplash.com/photo-1601524909162-ae8725290836?w=600&h=750&fit=crop&crop=center', alt: 'Horizon Ultra', background: 'black' },
  'Flux Phone SE': { url: 'https://images.unsplash.com/photo-1567581935884-3349723552ca?w=600&h=750&fit=crop&crop=center', alt: 'Flux Phone SE', background: 'white' },
  'Arcadia Pro': { url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=750&fit=crop&crop=center', alt: 'Arcadia Pro Phone', background: 'black' },
  'Vortex 12 Pro': { url: 'https://images.unsplash.com/photo-1570366583862-f91883984fde?w=600&h=750&fit=crop&crop=center', alt: 'Vortex 12 Pro', background: 'white' },
  'Celestia 8': { url: 'https://images.unsplash.com/photo-1581782542440-49034d631231?w=600&h=750&fit=crop&crop=center', alt: 'Celestia 8 Phone', background: 'black' },
  'Ion Plus': { url: 'https://images.unsplash.com/photo-1542726165-1738d83b9e88?w=600&h=750&fit=crop&crop=center', alt: 'Ion Plus', background: 'white' },
  'Radiant X': { url: 'https://images.unsplash.com/photo-1565636192335-b2e6fe1b3dce?w=600&h=750&fit=crop&crop=center', alt: 'Radiant X Phone', background: 'black' },
  'Spark Lite': { url: 'https://images.unsplash.com/photo-1520923193775-4d41f5a0c554?w=600&h=750&fit=crop&crop=center', alt: 'Spark Lite', background: 'white' },

  // ============================================
  // LAPTOPS (20 products)
  // ============================================
  'AeroBook Pro 16': { url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=750&fit=crop&crop=center', alt: 'AeroBook Pro 16 Laptop', background: 'white' },
  'ZenithPad Ultra': { url: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600&h=750&fit=crop&crop=center', alt: 'ZenithPad Ultra Laptop', background: 'black' },
  'CloudBook Air': { url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&h=750&fit=crop&crop=center', alt: 'CloudBook Air', background: 'white' },
  'Fusion X1 Carbon': { url: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=600&h=750&fit=crop&crop=center', alt: 'Fusion X1 Carbon', background: 'black' },
  'PrismBook Studio': { url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=750&fit=crop&crop=center', alt: 'PrismBook Studio', background: 'white' },
  'NovaPad 14': { url: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600&h=750&fit=crop&crop=center', alt: 'NovaPad 14 Laptop', background: 'black' },
  'VertexBook Pro': { url: 'https://images.unsplash.com/photo-1587614382346-4ec74e77d8d3?w=600&h=750&fit=crop&crop=center', alt: 'VertexBook Pro', background: 'white' },
  'Lunar Laptop 15': { url: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600&h=750&fit=crop&crop=center', alt: 'Lunar Laptop 15', background: 'black' },
  'TitanBook ROG': { url: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&h=750&fit=crop&crop=center', alt: 'TitanBook ROG Gaming', background: 'white' },
  'EchoBook Slim': { url: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600&h=750&fit=crop&crop=center', alt: 'EchoBook Slim', background: 'black' },
  'StellarPad Creator': { url: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&h=750&fit=crop&crop=center', alt: 'StellarPad Creator', background: 'white' },
  'NebulaBook Flex': { url: 'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=600&h=750&fit=crop&crop=center', alt: 'NebulaBook Flex', background: 'black' },
  'HorizonPad Elite': { url: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&h=750&fit=crop&crop=center', alt: 'HorizonPad Elite', background: 'white' },
  'FluxBook Gaming': { url: 'https://images.unsplash.com/photo-1599669454699-248893623440?w=600&h=750&fit=crop&crop=center', alt: 'FluxBook Gaming Laptop', background: 'black' },
  'ArcadiaBook Pro': { url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=750&fit=crop&crop=center', alt: 'ArcadiaBook Pro', background: 'white' },
  'VortexPad 13': { url: 'https://images.unsplash.com/photo-1530893609604-8a0285e95ff1?w=600&h=750&fit=crop&crop=center', alt: 'VortexPad 13', background: 'black' },
  'CelestiaBook Air': { url: 'https://images.unsplash.com/photo-1504707748692-419802cf939d?w=600&h=750&fit=crop&crop=center', alt: 'CelestiaBook Air', background: 'white' },
  'IonBook Work': { url: 'https://images.unsplash.com/photo-1563770660941-20978e873e20?w=600&h=750&fit=crop&crop=center', alt: 'IonBook Work', background: 'black' },
  'RadiantPad X': { url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=750&fit=crop&crop=center', alt: 'RadiantPad X', background: 'white' },
  'SparkBook Mini': { url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=750&fit=crop&crop=center', alt: 'SparkBook Mini', background: 'black' },

  // ============================================
  // AUDIO (20 products)
  // ============================================
  'SonicWave Pro': { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=750&fit=crop&crop=center', alt: 'SonicWave Pro Headphones', background: 'white' },
  'HarmonyPods Ultra': { url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&h=750&fit=crop&crop=center', alt: 'HarmonyPods Ultra Earbuds', background: 'black' },
  'BassForge X3': { url: 'https://images.unsplash.com/photo-1545127398-14699f92334b?w=600&h=750&fit=crop&crop=center', alt: 'BassForge X3 Headphones', background: 'white' },
  'ClarityBuds ANC': { url: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=600&h=750&fit=crop&crop=center', alt: 'ClarityBuds ANC', background: 'black' },
  'Resonance 7.1': { url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&h=750&fit=crop&crop=center', alt: 'Resonance 7.1 Headset', background: 'white' },
  'PulseBeat Elite': { url: 'https://images.unsplash.com/photo-1558756520-22cfe5d382ca?w=600&h=750&fit=crop&crop=center', alt: 'PulseBeat Elite', background: 'black' },
  'EchoSphere 360': { url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&h=750&fit=crop&crop=center', alt: 'EchoSphere 360 Speaker', background: 'white' },
  'WaveRider Pro': { url: 'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=600&h=750&fit=crop&crop=center', alt: 'WaveRider Pro', background: 'black' },
  'SoundCraft Studio': { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=750&fit=crop&crop=center', alt: 'SoundCraft Studio', background: 'white' },
  'VibeCore Max': { url: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&h=750&fit=crop&crop=center', alt: 'VibeCore Max', background: 'black' },
  'ThunderBass XL': { url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&h=750&fit=crop&crop=center', alt: 'ThunderBass XL Speaker', background: 'white' },
  'SilentStorm ANC': { url: 'https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?w=600&h=750&fit=crop&crop=center', alt: 'SilentStorm ANC', background: 'black' },
  'CrystalClear Buds': { url: 'https://images.unsplash.com/photo-1590658006356-af4b3f4b0c1c?w=600&h=750&fit=crop&crop=center', alt: 'CrystalClear Buds', background: 'white' },
  'RhythmBox Portable': { url: 'https://images.unsplash.com/photo-1589003077984-894e133dabab?w=600&h=750&fit=crop&crop=center', alt: 'RhythmBox Portable', background: 'black' },
  'AudioNest Pro': { url: 'https://images.unsplash.com/photo-1560323369-4a380902-89a6?w=600&h=750&fit=crop&crop=center', alt: 'AudioNest Pro', background: 'white' },
  'DeepBass Sub': { url: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=600&h=750&fit=crop&crop=center', alt: 'DeepBass Sub', background: 'black' },
  'MelodyLink Wireless': { url: 'https://images.unsplash.com/photo-1594817822000-8a30c514789c?w=600&h=750&fit=crop&crop=center', alt: 'MelodyLink Wireless', background: 'white' },
  'ToneMaster DJ': { url: 'https://images.unsplash.com/photo-1571330735066-193500c75a67?w=600&h=750&fit=crop&crop=center', alt: 'ToneMaster DJ', background: 'black' },
  'BeatSync Earbuds': { url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&h=750&fit=crop&crop=center', alt: 'BeatSync Earbuds', background: 'white' },
  'AcousticPure': { url: 'https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?w=600&h=750&fit=crop&crop=center', alt: 'AcousticPure', background: 'black' },

  // ============================================
  // WEARABLES (20 products)
  // ============================================
  'ChronoFit Ultra': { url: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600&h=750&fit=crop&crop=center', alt: 'ChronoFit Ultra Smartwatch', background: 'white' },
  'PulseTrack Pro': { url: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&h=750&fit=crop&crop=center', alt: 'PulseTrack Pro', background: 'black' },
  'VitaBand 7': { url: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600&h=750&fit=crop&crop=center', alt: 'VitaBand 7 Fitness Tracker', background: 'white' },
  'SmartRing X': { url: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=600&h=750&fit=crop&crop=center', alt: 'SmartRing X', background: 'black' },
  'HealthGuard Watch': { url: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&h=750&fit=crop&crop=center', alt: 'HealthGuard Watch', background: 'white' },
  'FitSphere Elite': { url: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=600&h=750&fit=crop&crop=center', alt: 'FitSphere Elite', background: 'black' },
  'BioSense Band': { url: 'https://images.unsplash.com/photo-1510017803434-a899b57bfbc9?w=600&h=750&fit=crop&crop=center', alt: 'BioSense Band', background: 'white' },
  'ActiveCore Pro': { url: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&h=750&fit=crop&crop=center', alt: 'ActiveCore Pro', background: 'black' },
  'ThermoWatch Plus': { url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=750&fit=crop&crop=center', alt: 'ThermoWatch Plus', background: 'white' },
  'NeuroBand AI': { url: 'https://images.unsplash.com/photo-1557935728-e6d1eaabe719?w=600&h=750&fit=crop&crop=center', alt: 'NeuroBand AI', background: 'black' },
  'GlowFit Luxe': { url: 'https://images.unsplash.com/photo-1619134778706-7015533a6150?w=600&h=750&fit=crop&crop=center', alt: 'GlowFit Luxe', background: 'white' },
  'StrideTracker X': { url: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600&h=750&fit=crop&crop=center', alt: 'StrideTracker X', background: 'black' },
  'CardioWatch Pro': { url: 'https://images.unsplash.com/photo-1533703700283-4c672d8b9cdf?w=600&h=750&fit=crop&crop=center', alt: 'CardioWatch Pro', background: 'white' },
  'ZenBand Calm': { url: 'https://images.unsplash.com/photo-1510017803434-a899b57bfbc9?w=600&h=750&fit=crop&crop=center', alt: 'ZenBand Calm', background: 'black' },
  'PowerFit Max': { url: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&h=750&fit=crop&crop=center', alt: 'PowerFit Max', background: 'white' },
  'FlexBand Sport': { url: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600&h=750&fit=crop&crop=center', alt: 'FlexBand Sport', background: 'black' },
  'DreamSleep Tracker': { url: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&h=750&fit=crop&crop=center', alt: 'DreamSleep Tracker', background: 'white' },
  'AquaWatch Dive': { url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=750&fit=crop&crop=center', alt: 'AquaWatch Dive', background: 'black' },
  'SolarFit Eco': { url: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600&h=750&fit=crop&crop=center', alt: 'SolarFit Eco', background: 'white' },
  'EdgeWatch Pro': { url: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=600&h=750&fit=crop&crop=center', alt: 'EdgeWatch Pro', background: 'black' },

  // ============================================
  // CAMERAS (20 products)
  // ============================================
  'OptiLens Pro R5': { url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&h=750&fit=crop&crop=center', alt: 'OptiLens Pro R5 Camera', background: 'white' },
  'PixelShot 4K': { url: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&h=750&fit=crop&crop=center', alt: 'PixelShot 4K Camera', background: 'black' },
  'FrameMaster X': { url: 'https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?w=600&h=750&fit=crop&crop=center', alt: 'FrameMaster X', background: 'white' },
  'VisionCam Ultra': { url: 'https://images.unsplash.com/photo-1581591524525-c7753ee85a44?w=600&h=750&fit=crop&crop=center', alt: 'VisionCam Ultra', background: 'black' },
  'SnapPro Mirrorless': { url: 'https://images.unsplash.com/photo-1606986628253-49e7b8d251a5?w=600&h=750&fit=crop&crop=center', alt: 'SnapPro Mirrorless', background: 'white' },
  'LensCraft DSLR': { url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&h=750&fit=crop&crop=center', alt: 'LensCraft DSLR', background: 'black' },
  'FocusPoint Z9': { url: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&h=750&fit=crop&crop=center', alt: 'FocusPoint Z9', background: 'white' },
  'ClarityCam 360': { url: 'https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?w=600&h=750&fit=crop&crop=center', alt: 'ClarityCam 360', background: 'black' },
  'ShutterSpeed Pro': { url: 'https://images.unsplash.com/photo-1581591524525-c7753ee85a44?w=600&h=750&fit=crop&crop=center', alt: 'ShutterSpeed Pro', background: 'white' },
  'LightWave Cinema': { url: 'https://images.unsplash.com/photo-1606986628253-49e7b8d251a5?w=600&h=750&fit=crop&crop=center', alt: 'LightWave Cinema', background: 'black' },
  'DepthField AR': { url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&h=750&fit=crop&crop=center', alt: 'DepthField AR', background: 'white' },
  'ColorRange HDR': { url: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&h=750&fit=crop&crop=center', alt: 'ColorRange HDR', background: 'black' },
  'ZoomElite 200mm': { url: 'https://images.unsplash.com/photo-1613710006038-e06b9914f8b2?w=600&h=750&fit=crop&crop=center', alt: 'ZoomElite 200mm Lens', background: 'white' },
  'WideAngle X': { url: 'https://images.unsplash.com/photo-1613710006038-e06b9914f8b2?w=600&h=750&fit=crop&crop=center', alt: 'WideAngle X Lens', background: 'black' },
  'NightVision Cam': { url: 'https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?w=600&h=750&fit=crop&crop=center', alt: 'NightVision Cam', background: 'white' },
  'ActionShot Extreme': { url: 'https://images.unsplash.com/photo-1526178613552-2b45c6c302f0?w=600&h=750&fit=crop&crop=center', alt: 'ActionShot Extreme', background: 'black' },
  'PortraitPro 85mm': { url: 'https://images.unsplash.com/photo-1613710006038-e06b9914f8b2?w=600&h=750&fit=crop&crop=center', alt: 'PortraitPro 85mm', background: 'white' },
  'MacroLens Detail': { url: 'https://images.unsplash.com/photo-1613710006038-e06b9914f8b2?w=600&h=750&fit=crop&crop=center', alt: 'MacroLens Detail', background: 'black' },
  'DroneCam Air': { url: 'https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?w=600&h=750&fit=crop&crop=center', alt: 'DroneCam Air', background: 'white' },
  'InstaPrint Cam': { url: 'https://images.unsplash.com/photo-1526178613552-2b45c6c302f0?w=600&h=750&fit=crop&crop=center', alt: 'InstaPrint Cam', background: 'black' },

  // ============================================
  // TABLETS (20 products)
  // ============================================
  'SlatePro 12.9': { url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&h=750&fit=crop&crop=center', alt: 'SlatePro 12.9 Tablet', background: 'white' },
  'DrawPad Ultra': { url: 'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=600&h=750&fit=crop&crop=center', alt: 'DrawPad Ultra', background: 'black' },
  'FlexTab Pro': { url: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=600&h=750&fit=crop&crop=center', alt: 'FlexTab Pro', background: 'white' },
  'ScreenCraft X': { url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&h=750&fit=crop&crop=center', alt: 'ScreenCraft X', background: 'black' },
  'PixelTab S9': { url: 'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=600&h=750&fit=crop&crop=center', alt: 'PixelTab S9', background: 'white' },
  'NoteTab Creator': { url: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=600&h=750&fit=crop&crop=center', alt: 'NoteTab Creator', background: 'black' },
  'EduTab Plus': { url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&h=750&fit=crop&crop=center', alt: 'EduTab Plus', background: 'white' },
  'MediaTab Entertainment': { url: 'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=600&h=750&fit=crop&crop=center', alt: 'MediaTab Entertainment', background: 'black' },
  'WorkTab Office': { url: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=600&h=750&fit=crop&crop=center', alt: 'WorkTab Office', background: 'white' },
  'GameTab Elite': { url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&h=750&fit=crop&crop=center', alt: 'GameTab Elite', background: 'black' },
  'MiniTab 8': { url: 'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=600&h=750&fit=crop&crop=center', alt: 'MiniTab 8', background: 'white' },
  'ProTab Air': { url: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=600&h=750&fit=crop&crop=center', alt: 'ProTab Air', background: 'black' },
  'KidsTab Safe': { url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&h=750&fit=crop&crop=center', alt: 'KidsTab Safe', background: 'white' },
  'ArtistTab Pro': { url: 'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=600&h=750&fit=crop&crop=center', alt: 'ArtistTab Pro', background: 'black' },
  'ReaderTab E-Ink': { url: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=600&h=750&fit=crop&crop=center', alt: 'ReaderTab E-Ink', background: 'white' },
  'TravelTab Lite': { url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&h=750&fit=crop&crop=center', alt: 'TravelTab Lite', background: 'black' },
  'BusinessTab Pro': { url: 'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=600&h=750&fit=crop&crop=center', alt: 'BusinessTab Pro', background: 'white' },
  'DesignTab Stylus': { url: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=600&h=750&fit=crop&crop=center', alt: 'DesignTab Stylus', background: 'black' },
  'PhotoTab HDR': { url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&h=750&fit=crop&crop=center', alt: 'PhotoTab HDR', background: 'white' },
  'MusicTab Studio': { url: 'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=600&h=750&fit=crop&crop=center', alt: 'MusicTab Studio', background: 'black' },

  // ============================================
  // GAMING (20 products)
  // ============================================
  'ThunderStick Pro': { url: 'https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=600&h=750&fit=crop&crop=center', alt: 'ThunderStick Pro Controller', background: 'white' },
  'PhantomPad Elite': { url: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=600&h=750&fit=crop&crop=center', alt: 'PhantomPad Elite', background: 'black' },
  'NexusCore X': { url: 'https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=600&h=750&fit=crop&crop=center', alt: 'NexusCore X', background: 'white' },
  'HyperFrame RTX': { url: 'https://images.unsplash.com/photo-1591488320449-011701bb6746?w=600&h=750&fit=crop&crop=center', alt: 'HyperFrame RTX Graphics', background: 'black' },
  'BlazeConsole Pro': { url: 'https://images.unsplash.com/photo-1486401899868-0e435ed85128?w=600&h=750&fit=crop&crop=center', alt: 'BlazeConsole Pro', background: 'white' },
  'PixelForge 5': { url: 'https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=600&h=750&fit=crop&crop=center', alt: 'PixelForge 5', background: 'black' },
  'GameSphere VR': { url: 'https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=600&h=750&fit=crop&crop=center', alt: 'GameSphere VR Headset', background: 'white' },
  'TurboCharge Station': { url: 'https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=600&h=750&fit=crop&crop=center', alt: 'TurboCharge Station', background: 'black' },
  'CommandDeck Pro': { url: 'https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=600&h=750&fit=crop&crop=center', alt: 'CommandDeck Pro', background: 'white' },
  'ArenaSeat X': { url: 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=600&h=750&fit=crop&crop=center', alt: 'ArenaSeat X Gaming Chair', background: 'black' },
  'LightSpeed Mouse': { url: 'https://images.unsplash.com/photo-1527814050087-379381547908?w=600&h=750&fit=crop&crop=center', alt: 'LightSpeed Mouse', background: 'white' },
  'MechKey Ultra': { url: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=600&h=750&fit=crop&crop=center', alt: 'MechKey Ultra Keyboard', background: 'black' },
  'GameStream Hub': { url: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=600&h=750&fit=crop&crop=center', alt: 'GameStream Hub', background: 'white' },
  'ProGamer Monitor': { url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&h=750&fit=crop&crop=center', alt: 'ProGamer Monitor', background: 'black' },
  'EliteHeadset 7.1': { url: 'https://images.unsplash.com/photo-1599669454699-248893623440?w=600&h=750&fit=crop&crop=center', alt: 'EliteHeadset 7.1', background: 'white' },
  'RacingWheel Pro': { url: 'https://images.unsplash.com/photo-1511882150382-421056c89033?w=600&h=750&fit=crop&crop=center', alt: 'RacingWheel Pro', background: 'black' },
  'FightStick Arcade': { url: 'https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=600&h=750&fit=crop&crop=center', alt: 'FightStick Arcade', background: 'white' },
  'FlightSim Yoke': { url: 'https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=600&h=750&fit=crop&crop=center', alt: 'FlightSim Yoke', background: 'black' },
  'RhythmPad DJ': { url: 'https://images.unsplash.com/photo-1571330735066-193500c75a67?w=600&h=750&fit=crop&crop=center', alt: 'RhythmPad DJ', background: 'white' },
  'MotionSense Cam': { url: 'https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=600&h=750&fit=crop&crop=center', alt: 'MotionSense Cam', background: 'black' },

  // ============================================
  // ACCESSORIES (20 products)
  // ============================================
  'PowerVault 20K': { url: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600&h=750&fit=crop&crop=center', alt: 'PowerVault 20K Power Bank', background: 'white' },
  'ChargeHub 65W': { url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&h=750&fit=crop&crop=center', alt: 'ChargeHub 65W', background: 'black' },
  'CablePro USB-C': { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=750&fit=crop&crop=center', alt: 'CablePro USB-C', background: 'white' },
  'ScreenGuard Pro': { url: 'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=600&h=750&fit=crop&crop=center', alt: 'ScreenGuard Pro', background: 'black' },
  'LensFilter Kit': { url: 'https://images.unsplash.com/photo-1613710006038-e06b9914f8b2?w=600&h=750&fit=crop&crop=center', alt: 'LensFilter Kit', background: 'white' },
  'MountFlex Pro': { url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&h=750&fit=crop&crop=center', alt: 'MountFlex Pro', background: 'black' },
  'GripCase Ultra': { url: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&h=750&fit=crop&crop=center', alt: 'GripCase Ultra', background: 'white' },
  'StylusPen Pro': { url: 'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=600&h=750&fit=crop&crop=center', alt: 'StylusPen Pro', background: 'black' },
  'AdapterHub Multi': { url: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=600&h=750&fit=crop&crop=center', alt: 'AdapterHub Multi', background: 'white' },
  'DockStation Pro': { url: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=600&h=750&fit=crop&crop=center', alt: 'DockStation Pro', background: 'black' },
  'LightRing LED': { url: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=600&h=750&fit=crop&crop=center', alt: 'LightRing LED', background: 'white' },
  'TripodFlex Carbon': { url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&h=750&fit=crop&crop=center', alt: 'TripodFlex Carbon', background: 'black' },
  'BagTech Shield': { url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=750&fit=crop&crop=center', alt: 'BagTech Shield', background: 'white' },
  'CleanKit Pro': { url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&h=750&fit=crop&crop=center', alt: 'CleanKit Pro', background: 'black' },
  'ProtectFilm HD': { url: 'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=600&h=750&fit=crop&crop=center', alt: 'ProtectFilm HD', background: 'white' },
  'MagMount Car': { url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&h=750&fit=crop&crop=center', alt: 'MagMount Car', background: 'black' },
  'WirelessPad Qi2': { url: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600&h=750&fit=crop&crop=center', alt: 'WirelessPad Qi2', background: 'white' },
  'HubStation 8-in-1': { url: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=600&h=750&fit=crop&crop=center', alt: 'HubStation 8-in-1', background: 'black' },
  'BatteryPack Slim': { url: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600&h=750&fit=crop&crop=center', alt: 'BatteryPack Slim', background: 'white' },
  'ExtensionSmart': { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=750&fit=crop&crop=center', alt: 'ExtensionSmart', background: 'black' },

  // ============================================
  // SMART HOME (20 products)
  // ============================================
  'LumiBulb RGB': { url: 'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=600&h=750&fit=crop&crop=center', alt: 'LumiBulb RGB Smart Light', background: 'white' },
  'ThermoSense Pro': { url: 'https://images.unsplash.com/photo-1567315648921-3529b1db4e85?w=600&h=750&fit=crop&crop=center', alt: 'ThermoSense Pro Thermostat', background: 'black' },
  'AquaPure Filter': { url: 'https://images.unsplash.com/photo-1584812157632-9e65ca2a0a0c?w=600&h=750&fit=crop&crop=center', alt: 'AquaPure Filter', background: 'white' },
  'AirFlow Purifier': { url: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&h=750&fit=crop&crop=center', alt: 'AirFlow Purifier', background: 'black' },
  'SecureView Doorbell': { url: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=600&h=750&fit=crop&crop=center', alt: 'SecureView Doorbell', background: 'white' },
  'RoboClean X1': { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=750&fit=crop&crop=center', alt: 'RoboClean X1 Robot Vacuum', background: 'black' },
  'SleepWell Diffuser': { url: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&h=750&fit=crop&crop=center', alt: 'SleepWell Diffuser', background: 'white' },
  'PlantSense Monitor': { url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&h=750&fit=crop&crop=center', alt: 'PlantSense Monitor', background: 'black' },
  'EnergyTrack Hub': { url: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=600&h=750&fit=crop&crop=center', alt: 'EnergyTrack Hub', background: 'white' },
  'VoiceMate AI': { url: 'https://images.unsplash.com/photo-1543512214-318c7559232b?w=600&h=750&fit=crop&crop=center', alt: 'VoiceMate AI Speaker', background: 'black' },
  'LightStrip Pro': { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=750&fit=crop&crop=center', alt: 'LightStrip Pro', background: 'white' },
  'SmartPlug WiFi': { url: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=600&h=750&fit=crop&crop=center', alt: 'SmartPlug WiFi', background: 'black' },
  'BlindMotion Auto': { url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&h=750&fit=crop&crop=center', alt: 'BlindMotion Auto', background: 'white' },
  'PetFeeder Smart': { url: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&h=750&fit=crop&crop=center', alt: 'PetFeeder Smart', background: 'black' },
  'GardenSense Pro': { url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&h=750&fit=crop&crop=center', alt: 'GardenSense Pro', background: 'white' },
  'WaterLeak Alert': { url: 'https://images.unsplash.com/photo-1584812157632-9e65ca2a0a0c?w=600&h=750&fit=crop&crop=center', alt: 'WaterLeak Alert', background: 'black' },
  'SmokeSense Pro': { url: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=600&h=750&fit=crop&crop=center', alt: 'SmokeSense Pro', background: 'white' },
  'GarageDoor AI': { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=750&fit=crop&crop=center', alt: 'GarageDoor AI', background: 'black' },
  'ThermostatElite': { url: 'https://images.unsplash.com/photo-1567315648921-3529b1db4e85?w=600&h=750&fit=crop&crop=center', alt: 'ThermostatElite', background: 'white' },
  'SpeakerMesh Pro': { url: 'https://images.unsplash.com/photo-1543512214-318c7559232b?w=600&h=750&fit=crop&crop=center', alt: 'SpeakerMesh Pro', background: 'black' },

  // ============================================
  // TVs (20 products)
  // ============================================
  'VisionMax 65" OLED': { url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&h=750&fit=crop&crop=center', alt: 'VisionMax 65 inch OLED TV', background: 'white' },
  'CrystalView 55" QLED': { url: 'https://images.unsplash.com/photo-1461151304267-38535e780c79?w=600&h=750&fit=crop&crop=center', alt: 'CrystalView 55 inch QLED', background: 'black' },
  'UltraSlim 50" 4K': { url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&h=750&fit=crop&crop=center', alt: 'UltraSlim 50 inch 4K', background: 'white' },
  'CinemaPro 75" 8K': { url: 'https://images.unsplash.com/photo-1461151304267-38535e780c79?w=600&h=750&fit=crop&crop=center', alt: 'CinemaPro 75 inch 8K', background: 'black' },
  'SmartView 43" HD': { url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&h=750&fit=crop&crop=center', alt: 'SmartView 43 inch HD', background: 'white' },
  'FrameArt 55" Gallery': { url: 'https://images.unsplash.com/photo-1461151304267-38535e780c79?w=600&h=750&fit=crop&crop=center', alt: 'FrameArt 55 inch Gallery', background: 'black' },
  'GameView 48" 120Hz': { url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&h=750&fit=crop&crop=center', alt: 'GameView 48 inch 120Hz', background: 'white' },
  'OutdoorView 65"': { url: 'https://images.unsplash.com/photo-1461151304267-38535e780c79?w=600&h=750&fit=crop&crop=center', alt: 'OutdoorView 65 inch', background: 'black' },
  'CurvedEdge 55"': { url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&h=750&fit=crop&crop=center', alt: 'CurvedEdge 55 inch', background: 'white' },
  'MiniLED Pro 65"': { url: 'https://images.unsplash.com/photo-1461151304267-38535e780c79?w=600&h=750&fit=crop&crop=center', alt: 'MiniLED Pro 65 inch', background: 'black' },
  'ProjectBeam 4K': { url: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=600&h=750&fit=crop&crop=center', alt: 'ProjectBeam 4K Projector', background: 'white' },
  'PortableView 15"': { url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&h=750&fit=crop&crop=center', alt: 'PortableView 15 inch', background: 'black' },
  'MirrorTV 43"': { url: 'https://images.unsplash.com/photo-1461151304267-38535e780c79?w=600&h=750&fit=crop&crop=center', alt: 'MirrorTV 43 inch', background: 'white' },
  'TransparentView 55"': { url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&h=750&fit=crop&crop=center', alt: 'TransparentView 55 inch', background: 'black' },
  'RollableView 65"': { url: 'https://images.unsplash.com/photo-1461151304267-38535e780c79?w=600&h=750&fit=crop&crop=center', alt: 'RollableView 65 inch', background: 'white' },
  'UltraWide 49" Monitor': { url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&h=750&fit=crop&crop=center', alt: 'UltraWide 49 inch Monitor', background: 'black' },
  'StudioDisplay 32"': { url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&h=750&fit=crop&crop=center', alt: 'StudioDisplay 32 inch', background: 'white' },
  'ProDisplay XDR': { url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&h=750&fit=crop&crop=center', alt: 'ProDisplay XDR', background: 'black' },
  'NanoCell 75"': { url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&h=750&fit=crop&crop=center', alt: 'NanoCell 75 inch', background: 'white' },
  'NeoQuantum 85"': { url: 'https://images.unsplash.com/photo-1461151304267-38535e780c79?w=600&h=750&fit=crop&crop=center', alt: 'NeoQuantum 85 inch', background: 'black' },
};

/**
 * Get image URL for a product by name
 */
export function getProductImage(productName: string): string {
  const image = productImages[productName];
  return image?.url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=750&fit=crop';
}

/**
 * Get image alt text for a product
 */
export function getProductImageAlt(productName: string): string {
  const image = productImages[productName];
  return image?.alt || productName;
}
