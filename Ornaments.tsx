import React, { useMemo, useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { CONFIG, COLORS } from '../constants';
import { useStore } from '../store';

const tempObject = new THREE.Object3D();
const tempPos = new THREE.Vector3();

interface OrnamentData {
  treePos: THREE.Vector3;
  chaosPos: THREE.Vector3;
  scale: number;
  rotationSpeed: number;
  phase: number;
}

export const Ornaments: React.FC = () => {
  const chaosLevel = useStore((state) => state.chaosLevel);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const lightMeshRef = useRef<THREE.InstancedMesh>(null);
  const flashMeshRef = useRef<THREE.InstancedMesh>(null);
  const FLASH_COUNT = 80;

  // --- Ornaments (Balls/Gifts) ---
  const ornamentsData = useMemo<OrnamentData[]>(() => {
    const data: OrnamentData[] = [];
    for (let i = 0; i < CONFIG.ORNAMENT_COUNT; i++) {
      // Tree Position
      const ratio = Math.random(); 
      // Bias slightly towards bottom for heavier look
      const y = (ratio * CONFIG.TREE_HEIGHT) - (CONFIG.TREE_HEIGHT / 2);
      const r = ((1 - ratio) * CONFIG.TREE_RADIUS * 0.9); // Inside foliage slightly
      const theta = Math.random() * Math.PI * 2;
      const treePos = new THREE.Vector3(r * Math.cos(theta), y, r * Math.sin(theta));

      // Chaos Position
      const thetaS = Math.random() * Math.PI * 2;
      const phiS = Math.acos(2 * Math.random() - 1);
      const rS = CONFIG.CHAOS_RADIUS * (0.5 + Math.random() * 0.5);
      const chaosPos = new THREE.Vector3(
        rS * Math.sin(phiS) * Math.cos(thetaS),
        rS * Math.sin(phiS) * Math.sin(thetaS),
        rS * Math.cos(phiS)
      );

      data.push({
        treePos,
        chaosPos,
        scale: 0.2 + Math.random() * 0.25,
        rotationSpeed: (Math.random() - 0.5) * 2,
        phase: Math.random() * Math.PI,
      });
    }
    return data;
  }, []);

  // --- Lights (Tiny glowing spheres) ---
  const lightsData = useMemo<OrnamentData[]>(() => {
    const data: OrnamentData[] = [];
    for (let i = 0; i < CONFIG.LIGHT_COUNT; i++) {
      // Spiral distribution for lights
      const t = i / CONFIG.LIGHT_COUNT;
      const y = (t * CONFIG.TREE_HEIGHT) - (CONFIG.TREE_HEIGHT / 2);
      const r = (1 - t) * CONFIG.TREE_RADIUS * 1.05; // Outside foliage
      const theta = i * 0.5; // Spiral
      const treePos = new THREE.Vector3(r * Math.cos(theta), y, r * Math.sin(theta));

      const chaosPos = new THREE.Vector3(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 40
      );

      data.push({
        treePos,
        chaosPos,
        scale: 0.08, // Small lights
        rotationSpeed: 0,
        phase: Math.random() * 10,
      });
    }
    return data;
  }, []);

  // --- Flashers (Strobe lights) ---
  const flashData = useMemo<OrnamentData[]>(() => {
    const data: OrnamentData[] = [];
    for (let i = 0; i < FLASH_COUNT; i++) {
      const t = Math.random();
      const y = (t * CONFIG.TREE_HEIGHT) - (CONFIG.TREE_HEIGHT / 2);
      const r = (1 - t) * CONFIG.TREE_RADIUS * 0.8; // Deep inside
      const theta = Math.random() * Math.PI * 2;
      const treePos = new THREE.Vector3(r * Math.cos(theta), y, r * Math.sin(theta));

      const chaosPos = new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20
      );

      data.push({
        treePos,
        chaosPos,
        scale: 0.15, 
        rotationSpeed: 0,
        phase: Math.random() * 100,
      });
    }
    return data;
  }, []);

  // Set colors for ornaments
  useLayoutEffect(() => {
    if (meshRef.current) {
      const colors = [COLORS.GOLD, COLORS.RED_VELVET, COLORS.CHAMPAGNE, COLORS.EMERALD];
      for (let i = 0; i < CONFIG.ORNAMENT_COUNT; i++) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        meshRef.current.setColorAt(i, color);
      }
      meshRef.current.instanceColor!.needsUpdate = true;
    }
    if (lightMeshRef.current) {
        for (let i = 0; i < CONFIG.LIGHT_COUNT; i++) {
            lightMeshRef.current.setColorAt(i, COLORS.GOLD); 
        }
        lightMeshRef.current.instanceColor!.needsUpdate = true;
    }
    if (flashMeshRef.current) {
         for (let i = 0; i < FLASH_COUNT; i++) {
            flashMeshRef.current.setColorAt(i, new THREE.Color('#FFFFFF')); 
        }
        flashMeshRef.current.instanceColor!.needsUpdate = true;
    }
  }, []);

  // Animation State
  const currentChaosRef = useRef(0);
  
  useFrame((state, delta) => {
    // Smooth transition
    currentChaosRef.current = THREE.MathUtils.lerp(
        currentChaosRef.current,
        chaosLevel,
        delta * CONFIG.ANIMATION_SPEED
    );
    const progress = currentChaosRef.current;
    const time = state.clock.elapsedTime;

    // Update Ornaments
    if (meshRef.current) {
      ornamentsData.forEach((data, i) => {
        tempPos.lerpVectors(data.treePos, data.chaosPos, progress);
        if (progress > 0.1) {
             tempPos.y += Math.sin(time + data.phase) * 0.02 * progress;
             tempPos.x += Math.cos(time * 0.5 + data.phase) * 0.02 * progress;
        }
        tempObject.position.copy(tempPos);
        tempObject.rotation.x = time * data.rotationSpeed;
        tempObject.rotation.y = time * data.rotationSpeed * 0.5;
        tempObject.scale.setScalar(data.scale);
        tempObject.updateMatrix();
        meshRef.current!.setMatrixAt(i, tempObject.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }

    // Update Lights
    if (lightMeshRef.current) {
        lightsData.forEach((data, i) => {
            tempPos.lerpVectors(data.treePos, data.chaosPos, progress);
            const twinkle = 1 + Math.sin(time * 3 + data.phase) * 0.3;
            tempObject.position.copy(tempPos);
            tempObject.scale.setScalar(data.scale * twinkle);
            tempObject.updateMatrix();
            lightMeshRef.current!.setMatrixAt(i, tempObject.matrix);
        });
        lightMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // Update Flashers (Strobes)
    if (flashMeshRef.current) {
        flashData.forEach((data, i) => {
            tempPos.lerpVectors(data.treePos, data.chaosPos, progress);
            
            // Strobe effect: Fast pulse
            const strobe = Math.sin(time * 10 + data.phase); // Fast frequency
            const scale = strobe > 0.5 ? data.scale * 1.5 : 0.01; // Blink on/off

            tempObject.position.copy(tempPos);
            tempObject.scale.setScalar(scale);
            tempObject.updateMatrix();
            flashMeshRef.current!.setMatrixAt(i, tempObject.matrix);
        });
        flashMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Ornaments: High Gloss */}
      <instancedMesh ref={meshRef} args={[undefined, undefined, CONFIG.ORNAMENT_COUNT]} castShadow receiveShadow>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial 
            roughness={0.15} 
            metalness={0.9} 
            envMapIntensity={1.5}
        />
      </instancedMesh>

      {/* Lights: Warm Gold */}
      <instancedMesh ref={lightMeshRef} args={[undefined, undefined, CONFIG.LIGHT_COUNT]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      {/* Flashers: Bright White/Diamond */}
      <instancedMesh ref={flashMeshRef} args={[undefined, undefined, FLASH_COUNT]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial 
            emissive="#FFFFFF" 
            emissiveIntensity={4} 
            toneMapped={false} 
        />
      </instancedMesh>
    </group>
  );
};