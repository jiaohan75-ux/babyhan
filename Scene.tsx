import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, OrbitControls, PerspectiveCamera, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { Foliage } from './Foliage';
import { Ornaments } from './Ornaments';
import { Polaroids } from './Polaroids';
import { CONFIG } from '../constants';
import { useStore } from '../store';
import * as THREE from 'three';

export const Scene: React.FC = () => {
  const { handPosition, isHandDetected } = useStore();
  const cameraGroupRef = useRef<THREE.Group>(null);
  const controlsRef = useRef<any>(null);

  useFrame((state) => {
    // Subtle camera movement based on hand or mouse
    if (cameraGroupRef.current) {
        let targetX = state.pointer.x * 2;
        let targetY = state.pointer.y * 2;

        if (isHandDetected) {
            // Override with hand position (-1 to 1)
            targetX = -handPosition.x * 5; // Invert X for mirror feel
            targetY = handPosition.y * 2;
        }

        cameraGroupRef.current.position.x = THREE.MathUtils.lerp(cameraGroupRef.current.position.x, targetX, 0.05);
        cameraGroupRef.current.position.y = THREE.MathUtils.lerp(cameraGroupRef.current.position.y, targetY, 0.05);
        cameraGroupRef.current.lookAt(0, 4, 0); // Look at tree center
    }
  });

  return (
    <>
      <color attach="background" args={['#000500']} />
      
      {/* Luxury Lighting */}
      <Environment preset="lobby" environmentIntensity={0.8} />
      <ambientLight intensity={0.2} color="#004225" />
      <spotLight 
        position={[10, 20, 10]} 
        angle={0.3} 
        penumbra={1} 
        intensity={2} 
        color="#FFD700" 
        castShadow 
      />
      
      {/* Dynamic Camera Group */}
      <group ref={cameraGroupRef}>
         <PerspectiveCamera makeDefault position={[0, 4, 20]} fov={50} />
      </group>

      <group position={[0, -2, 0]}>
         <Foliage />
         <Ornaments />
         <Polaroids />
         
         {/* Tree Base / Stand - Simple Gold Cylinder */}
         <mesh position={[0, -CONFIG.TREE_HEIGHT/2 - 0.5, 0]}>
             <cylinderGeometry args={[1, 1.5, 2, 8]} />
             <meshStandardMaterial color="#D4AF37" metalness={1} roughness={0.2} />
         </mesh>
         
         {/* Floor Reflection */}
         <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -CONFIG.TREE_HEIGHT/2 - 1.5, 0]}>
            <circleGeometry args={[20, 64]} />
            <meshStandardMaterial 
                color="#001100" 
                roughness={0.1} 
                metalness={0.5} 
            />
         </mesh>
      </group>

      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      <EffectComposer disableNormalPass>
        <Bloom 
            luminanceThreshold={0.8} 
            mipmapBlur 
            intensity={1.2} 
            radius={0.4}
        />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
      
      {/* Fallback controls if hand not detected, but we control camera manually via ref mostly */}
      {!isHandDetected && <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI/1.8} minPolarAngle={Math.PI/3} />}
    </>
  );
};