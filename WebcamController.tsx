import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { IMAGES } from '../constants';

// We need to define types for the globally loaded MediaPipe libraries
declare global {
  interface Window {
    vision: any;
  }
}

export const WebcamController: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { 
    setChaosLevel, 
    setHandPosition, 
    setIsHandDetected, 
    setPermissionGranted, 
    permissionGranted,
    setZoomedImageIndex 
  } = useStore();
  const [loading, setLoading] = useState(true);
  const lastVideoTimeRef = useRef(-1);
  const requestRef = useRef<number>(0);
  const handLandmarkerRef = useRef<any>(null);

  // Swipe detection refs
  const lastHandPosRef = useRef<{x: number, y: number} | null>(null);
  const lastSwipeTimeRef = useRef(0);

  // Initialize MediaPipe Vision
  useEffect(() => {
    const initVision = async () => {
      try {
        const { FilesetResolver, HandLandmarker } = await import(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/+esm"
        );

        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );

        handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        
        setLoading(false);
      } catch (error) {
        console.error("Error initializing vision:", error);
      }
    };

    initVision();
  }, []);

  // Request Camera
  useEffect(() => {
    const startWebcam = async () => {
      if (!videoRef.current) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: 640,
                height: 480,
                facingMode: "user"
            } 
        });
        videoRef.current.srcObject = stream;
        videoRef.current.addEventListener("loadeddata", () => {
             setPermissionGranted(true);
             predictWebcam();
        });
      } catch (err) {
        console.error("Webcam access denied", err);
        setPermissionGranted(false);
      }
    };

    if (!loading) {
        startWebcam();
    }
  }, [loading]);

  const predictWebcam = () => {
    if (!handLandmarkerRef.current || !videoRef.current) return;

    let startTimeMs = performance.now();
    
    if (videoRef.current.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = videoRef.current.currentTime;
        const results = handLandmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);

        if (results.landmarks && results.landmarks.length > 0) {
            setIsHandDetected(true);
            const landmarks = results.landmarks[0];
            
            // 1. Calculate Hand Position (Centroid of Palm)
            const xRaw = landmarks[0].x;
            const yRaw = landmarks[0].y;
            
            // Map 0..1 to -1..1 (inverted X for mirror effect)
            const currentX = (xRaw - 0.5) * 2;
            const currentY = -(yRaw - 0.5) * 2;
            
            setHandPosition({ x: currentX, y: currentY });

            // 3. Detect Swipe (Velocity check)
            if (lastHandPosRef.current) {
                const dx = currentX - lastHandPosRef.current.x;
                const dy = currentY - lastHandPosRef.current.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                // Threshold: If moves significantly in one frame interval
                // Typical frame is 33ms (30fps). 
                // A fast swipe might be 0.1 units per frame.
                if (dist > 0.15) {
                    const now = performance.now();
                    // 1 second cooldown for swipes
                    if (now - lastSwipeTimeRef.current > 1000) {
                        // Trigger Zoom
                        const rndIndex = Math.floor(Math.random() * IMAGES.length);
                        setZoomedImageIndex(rndIndex);
                        lastSwipeTimeRef.current = now;
                    }
                }
            }
            lastHandPosRef.current = { x: currentX, y: currentY };

            // 2. Detect Gesture: Open vs Closed
            // Simple heuristic: Average distance of finger tips to wrist
            const wrist = landmarks[0];
            const tips = [8, 12, 16, 20]; 
            
            let avgDist = 0;
            tips.forEach(idx => {
                const tip = landmarks[idx];
                const dx = tip.x - wrist.x;
                const dy = tip.y - wrist.y;
                avgDist += Math.sqrt(dx*dx + dy*dy);
            });
            avgDist /= tips.length;

            if (avgDist > 0.25) {
                setChaosLevel(1); // Unleash
            } else {
                setChaosLevel(0); // Form Tree
            }

        } else {
            setIsHandDetected(false);
            lastHandPosRef.current = null;
        }
    }
    
    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  return (
    <div className="fixed bottom-4 right-4 w-48 h-36 bg-black border-2 border-[#D4AF37] rounded-lg overflow-hidden z-50 shadow-[0_0_15px_#D4AF37] opacity-80 hover:opacity-100 transition-opacity">
        <video 
            ref={videoRef} 
            className="w-full h-full object-cover transform -scale-x-100" 
            autoPlay 
            playsInline
            muted
        />
        {!permissionGranted && !loading && (
             <div className="absolute inset-0 flex items-center justify-center text-xs text-gold text-center p-2">
                 Allow Camera for Magic
             </div>
        )}
        {loading && (
             <div className="absolute inset-0 flex items-center justify-center text-xs text-white">
                 Loading Vision AI...
             </div>
        )}
    </div>
  );
};