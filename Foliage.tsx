import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { CONFIG, COLORS } from '../constants';
import { useStore } from '../store';

// Custom shader to mix between two positions efficiently on the GPU
const foliageVertexShader = `
  uniform float uTime;
  uniform float uChaos;
  uniform float uSize;
  
  attribute vec3 aPositionTree;
  attribute vec3 aPositionChaos;
  attribute float aRandom;
  
  varying vec3 vColor;
  
  void main() {
    // Lerp position based on chaos level
    vec3 newPos = mix(aPositionTree, aPositionChaos, uChaos);
    
    // Add some noise/movement when in chaos mode
    if (uChaos > 0.1) {
       newPos.x += sin(uTime * 2.0 + aRandom * 10.0) * 0.5 * uChaos;
       newPos.y += cos(uTime * 1.5 + aRandom * 10.0) * 0.5 * uChaos;
       newPos.z += sin(uTime * 2.5 + aRandom * 10.0) * 0.5 * uChaos;
    }

    vec4 mvPosition = modelViewMatrix * vec4(newPos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Size attenuation
    gl_PointSize = uSize * (20.0 / -mvPosition.z);
    
    // Sparkle effect
    float sparkle = abs(sin(uTime * 3.0 + aRandom * 20.0));
    vColor = mix(vec3(0.0, 0.26, 0.15), vec3(0.0, 0.4, 0.2), aRandom); // Emerald gradients
    vColor += vec3(sparkle * 0.2 * uChaos); // Add shimmer in chaos
  }
`;

const foliageFragmentShader = `
  varying vec3 vColor;
  
  void main() {
    // Circular particle
    vec2 xy = gl_PointCoord.xy - vec2(0.5);
    float ll = length(xy);
    if (ll > 0.5) discard;
    
    gl_FragColor = vec4(vColor, 1.0);
  }
`;

export const Foliage: React.FC = () => {
  const chaosLevel = useStore((state) => state.chaosLevel);
  const shaderRef = useRef<THREE.ShaderMaterial>(null);

  const { treePositions, chaosPositions, randoms } = useMemo(() => {
    const tree = [];
    const chaos = [];
    const rnd = [];

    for (let i = 0; i < CONFIG.FOLIAGE_COUNT; i++) {
      // Tree Shape (Cone)
      const ratio = i / CONFIG.FOLIAGE_COUNT;
      const height = CONFIG.TREE_HEIGHT;
      const y = (ratio * height) - (height / 2); // -6 to 6
      // Radius decreases as we go up. Clamp bottom to be wider.
      const r = (1 - ratio) * CONFIG.TREE_RADIUS + (Math.random() * 0.5); 
      const theta = Math.random() * Math.PI * 2;
      
      const x = r * Math.cos(theta);
      const z = r * Math.sin(theta);
      
      tree.push(x, y, z);

      // Chaos Shape (Sphere distribution)
      const u = Math.random();
      const v = Math.random();
      const thetaS = 2 * Math.PI * u;
      const phiS = Math.acos(2 * v - 1);
      const rS = CONFIG.CHAOS_RADIUS * Math.cbrt(Math.random()); // Cube root for uniform distribution
      
      const xS = rS * Math.sin(phiS) * Math.cos(thetaS);
      const yS = rS * Math.sin(phiS) * Math.sin(thetaS);
      const zS = rS * Math.cos(phiS);
      
      chaos.push(xS, yS, zS);
      rnd.push(Math.random());
    }

    return {
      treePositions: new Float32Array(tree),
      chaosPositions: new Float32Array(chaos),
      randoms: new Float32Array(rnd),
    };
  }, []);

  useFrame((state, delta) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      // Smooth lerp the chaos uniform
      shaderRef.current.uniforms.uChaos.value = THREE.MathUtils.lerp(
        shaderRef.current.uniforms.uChaos.value,
        chaosLevel,
        delta * CONFIG.ANIMATION_SPEED
      );
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-aPositionTree"
          count={treePositions.length / 3}
          array={treePositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aPositionChaos"
          count={chaosPositions.length / 3}
          array={chaosPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          count={randoms.length}
          array={randoms}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={shaderRef}
        vertexShader={foliageVertexShader}
        fragmentShader={foliageFragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uChaos: { value: 0 },
          uSize: { value: 6.0 }, // Size of needle particles
        }}
        transparent
        depthWrite={false}
      />
    </points>
  );
};