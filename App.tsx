import React, { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import { Scene } from './components/Scene';
import { WebcamController } from './components/WebcamController';
import { useStore } from './store';

// UI Overlay Component
const Overlay = () => {
    const { isHandDetected, chaosLevel, setImages } = useStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            const newImages: string[] = [];
            Array.from(files).forEach((file: File) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (e.target?.result) {
                        newImages.push(e.target.result as string);
                        // Update store once all are processed (or incrementally, but here we do simple trigger)
                        if (newImages.length === files.length) {
                             setImages(newImages);
                        }
                    }
                };
                reader.readAsDataURL(file);
            });
        }
    };
    
    return (
        <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-8">
            <header className="flex justify-between items-start pointer-events-auto">
                <div>
                    <h1 className="text-4xl md:text-6xl text-[#D4AF37] font-luxury tracking-widest drop-shadow-[0_2px_10px_rgba(212,175,55,0.5)]">
                        MERRY CHRISTMAS
                    </h1>
                    <p className="text-[#a8c6a8] font-body italic mt-2 tracking-wide text-lg">
                        The Interactive Luxury Collection
                    </p>
                </div>
                
                {/* Photo Upload Button */}
                <div className="flex flex-col items-end gap-2">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-black/40 backdrop-blur-md border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-all font-luxury text-xs px-4 py-2 uppercase tracking-wider rounded-sm shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                    >
                        Customize Memories
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        multiple 
                        accept="image/*" 
                        onChange={handleUpload}
                    />
                </div>
            </header>

            <div className="flex flex-col items-center justify-center text-center space-y-4">
                <div className={`transition-opacity duration-1000 ${isHandDetected ? 'opacity-0' : 'opacity-100'}`}>
                    <p className="text-[#D4AF37] border border-[#D4AF37] px-6 py-2 rounded-full font-luxury text-sm bg-black/50 backdrop-blur-md">
                        Use your Hand to Control the Magic
                    </p>
                </div>
            </div>

            <footer className="flex justify-between items-end pointer-events-auto">
                <div className="text-[#a8c6a8] font-luxury text-xs">
                    EST. 2024 <br /> TRUMP TOWER EDITION
                </div>
                
                <div className="text-right">
                    <div className="flex flex-col gap-2 items-end">
                        <div className={`flex items-center gap-2 transition-all duration-500 ${isHandDetected ? 'text-[#D4AF37]' : 'text-gray-600'}`}>
                            <span className="uppercase text-xs font-bold tracking-widest">Vision Sensor</span>
                            <div className={`w-2 h-2 rounded-full ${isHandDetected ? 'bg-[#D4AF37] shadow-[0_0_10px_#D4AF37]' : 'bg-gray-600'}`}></div>
                        </div>
                        <div className="text-[#F7E7CE] font-body italic text-sm">
                            {isHandDetected ? (
                                chaosLevel > 0.5 ? "State: UNLEASHED" : "State: FORMED"
                            ) : "Waiting for Guest..."}
                        </div>
                        <div className="text-white/40 text-[10px] max-w-[200px]">
                            Instructions: <br/>
                            • Open hand to Explode<br/>
                            • Close fist to Form<br/>
                            • Move hand to Rotate<br/>
                            • Swipe fast to View Memories
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default function App() {
  return (
    <div className="relative w-full h-screen bg-black">
      <WebcamController />
      <Overlay />
      
      <Canvas shadows dpr={[1, 2]}>
        <Suspense fallback={null}>
            <Scene />
        </Suspense>
      </Canvas>
      <Loader 
        containerStyles={{ backgroundColor: '#000' }}
        innerStyles={{ width: '200px', backgroundColor: '#333' }}
        barStyles={{ backgroundColor: '#D4AF37', height: '5px' }}
        dataStyles={{ color: '#D4AF37', fontFamily: 'Cinzel', fontSize: '14px' }}
      />
    </div>
  );
}