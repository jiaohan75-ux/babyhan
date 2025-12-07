import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Image } from '@react-three/drei';
import { CONFIG } from '../constants';
import { useStore } from '../store';

const PolaroidItem: React.FC<{ url: string; index: number; total: number }> = ({ url, index, total }) => {
  const group = useRef<THREE.Group>(null);
  const { chaosLevel, zoomedImageIndex } = useStore();
  const currentChaos = useRef(0);
  const currentZoom = useRef(0);
  
  // Calculate positions
  const { treePos, chaosPos, rotation } = useMemo(() => {
    // Tree: Spiral around the tree
    const t = index / Math.max(total, 1);
    const y = (t * CONFIG.TREE_HEIGHT) - (CONFIG.TREE_HEIGHT / 2);
    const r = (1 - t) * CONFIG.TREE_RADIUS * 1.3 + 0.5; // Orbiting outside
    const theta = t * Math.PI * 6; // 3 full turns
    const tp = new THREE.Vector3(r * Math.cos(theta), y, r * Math.sin(theta));

    // Chaos: Far out
    const cp = new THREE.Vector3(
      (Math.random() - 0.5) * 30,
      (Math.random() - 0.5) * 30,
      (Math.random() - 0.5) * 10 + 15 // Mostly in front/back
    );

    return {
        treePos: tp,
        chaosPos: cp,
        rotation: [0, -theta, Math.random() * 0.2 - 0.1]
    };
  }, [index, total]);

  useFrame((state, delta) => {
    // Smooth transition for chaos
    currentChaos.current = THREE.MathUtils.lerp(
        currentChaos.current,
        chaosLevel,
        delta * CONFIG.ANIMATION_SPEED
    );

    // Smooth transition for zoom
    const isTargetZoom = zoomedImageIndex === index;
    currentZoom.current = THREE.MathUtils.lerp(
        currentZoom.current,
        isTargetZoom ? 1 : 0,
        delta * 4 // Fast zoom
    );

    if (group.current) {
        // Base position mixing Tree vs Chaos
        const basePos = new THREE.Vector3().lerpVectors(treePos, chaosPos, currentChaos.current);
        
        // Zoom Position (Center screen, close to camera)
        // Camera is at [0, 4, 20]. Let's put photo at [0, 4, 14]
        const zoomPos = new THREE.Vector3(0, 4, 14);
        
        // Final position mixing Base vs Zoom
        group.current.position.lerpVectors(basePos, zoomPos, currentZoom.current);

        // Rotation logic
        if (currentZoom.current > 0.1) {
            // If zooming, look at camera
            group.current.lookAt(0, 4, 20);
        } else if (currentChaos.current > 0.5) {
             group.current.lookAt(0,0,0);
        } else {
             // Revert to tree rotation with slight floating
             group.current.rotation.set(
                 rotation[0] as number,
                 rotation[1] as number + Math.sin(state.clock.elapsedTime + index) * 0.1,
                 rotation[2] as number
             );
        }

        // Scale Logic
        const baseScale = 1;
        const zoomScale = 3.5;
        const currentScale = THREE.MathUtils.lerp(baseScale, zoomScale, currentZoom.current);
        group.current.scale.setScalar(currentScale);

        // Z-Index handling hack (push forward if zoomed so it doesn't clip)
        if (currentZoom.current > 0.5) {
            group.current.renderOrder = 999;
        } else {
            group.current.renderOrder = 0;
        }
    }
  });

  return (
    <group ref={group}>
        {/* Frame */}
        <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[1.2, 1.5]} />
            <meshStandardMaterial color="#fffff0" roughness={0.8} />
        </mesh>
        {/* Photo */}
        <Image url={url} position={[0, 0.1, 0.01]} scale={[1, 1]} />
        {/* Text Area Simulation */}
        <mesh position={[0, -0.55, 0.01]}>
             <planeGeometry args={[0.8, 0.05]} />
             <meshBasicMaterial color="#333" transparent opacity={0.2} />
        </mesh>
    </group>
  );
};

export const Polaroids: React.FC = () => {
  const { images } = useStore();
  
  return (
    <group>
      {images.map((url, i) => (
        <PolaroidItem key={`${i}-${url}`} url={url} index={i} total={images.length} />
      ))}
    </group>
  );
};