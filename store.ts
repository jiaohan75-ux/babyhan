import { create } from 'zustand';
import { IMAGES } from './constants';

interface AppState {
  // 0 = Tree (Formed), 1 = Chaos (Unleashed)
  chaosLevel: number; 
  setChaosLevel: (level: number) => void;

  // Normalized hand position [-1, 1] for x and y
  handPosition: { x: number; y: number };
  setHandPosition: (pos: { x: number; y: number }) => void;

  isHandDetected: boolean;
  setIsHandDetected: (detected: boolean) => void;
  
  permissionGranted: boolean;
  setPermissionGranted: (granted: boolean) => void;

  zoomedImageIndex: number | null;
  setZoomedImageIndex: (index: number | null) => void;

  // Dynamic Image Gallery
  images: string[];
  setImages: (images: string[]) => void;
}

export const useStore = create<AppState>((set) => ({
  chaosLevel: 0,
  setChaosLevel: (level) => set({ chaosLevel: level }),
  
  handPosition: { x: 0, y: 0 },
  setHandPosition: (pos) => set({ handPosition: pos }),

  isHandDetected: false,
  setIsHandDetected: (detected) => set({ isHandDetected: detected }),
  
  permissionGranted: false,
  setPermissionGranted: (granted) => set({ permissionGranted: granted }),

  zoomedImageIndex: null,
  setZoomedImageIndex: (index) => set({ zoomedImageIndex: index }),

  images: IMAGES,
  setImages: (images) => set({ images: images, zoomedImageIndex: null }),
}));