import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

const Nucleus = () => {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((_, d) => {
    ref.current.rotation.y += d * 0.4;
    ref.current.rotation.x += d * 0.2;
  });
  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[0.6, 1]} />
      <meshStandardMaterial color="#22d3ee" emissive="#06b6d4" emissiveIntensity={1.5} wireframe />
    </mesh>
  );
};

const Electron = ({ radius, speed, tilt, color }: { radius: number; speed: number; tilt: [number, number, number]; color: string }) => {
  const ref = useRef<THREE.Group>(null!);
  useFrame((s) => {
    const t = s.clock.elapsedTime * speed;
    ref.current.position.x = Math.cos(t) * radius;
    ref.current.position.z = Math.sin(t) * radius;
  });
  return (
    <group rotation={tilt}>
      <mesh>
        <torusGeometry args={[radius, 0.01, 8, 96]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} />
      </mesh>
      <group ref={ref}>
        <mesh>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
        </mesh>
      </group>
    </group>
  );
};

export const Atom3D = () => {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 50 }} style={{ background: "transparent" }}>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={1.5} color="#22d3ee" />
      <pointLight position={[-5, -5, -5]} intensity={1} color="#a855f7" />
      <Nucleus />
      <Electron radius={1.5} speed={1.2} tilt={[0, 0, 0]} color="#22d3ee" />
      <Electron radius={2} speed={0.8} tilt={[Math.PI / 3, 0, 0]} color="#a855f7" />
      <Electron radius={2.4} speed={0.6} tilt={[0, Math.PI / 3, Math.PI / 4]} color="#ec4899" />
    </Canvas>
  );
};
