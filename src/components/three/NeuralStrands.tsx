import { useMemo, useRef } from 'react';
import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { CatmullRomCurve3, type Mesh, Vector3 } from 'three';

interface NeuralStrandsProps {
  spinning: boolean;
  reducedMotion: boolean;
}

export function NeuralStrands({
  spinning,
  reducedMotion,
}: NeuralStrandsProps) {
  const strands = useMemo(
    () =>
      [-1, 1].flatMap((side) =>
        Array.from({ length: 4 }, (_, index) => {
          const x = side * (3.48 + (index % 2) * 0.15);
          return new CatmullRomCurve3([
            new Vector3(x, -3.05, -0.15 + index * 0.06),
            new Vector3(x + side * 0.13, -1.95, 0.02),
            new Vector3(x - side * 0.12, -0.75, -0.03),
            new Vector3(x + side * 0.08, 0.7, 0.01),
            new Vector3(x - side * 0.08, 2.05, -0.02),
            new Vector3(x, 3.0, -0.12),
          ]);
        }),
      ),
    [],
  );

  return (
    <group>
      {strands.map((curve, index) => (
        <NeuralStrand
          key={index}
          curve={curve}
          index={index}
          spinning={spinning}
          reducedMotion={reducedMotion}
        />
      ))}
    </group>
  );
}

function NeuralStrand({
  curve,
  index,
  spinning,
  reducedMotion,
}: {
  curve: CatmullRomCurve3;
  index: number;
  spinning: boolean;
  reducedMotion: boolean;
}) {
  const beadRef = useRef<Mesh>(null);
  const points = useMemo(
    () => curve.getPoints(48).map((point) => [point.x, point.y, point.z] as [number, number, number]),
    [curve],
  );

  useFrame(({ clock }) => {
    if (!beadRef.current || reducedMotion) return;
    const direction = spinning ? 1 : index % 2 === 0 ? 1 : -1;
    const speed = spinning ? 0.23 : 0.075;
    const progress = (clock.elapsedTime * speed + index * 0.17) % 1;
    const point = curve.getPoint(
      direction > 0 ? progress : 1 - progress,
    );
    beadRef.current.position.copy(point);
    const pulse = 0.75 + Math.sin(clock.elapsedTime * 4 + index) * 0.22;
    beadRef.current.scale.setScalar(pulse);
  });

  return (
    <group>
      <Line
        points={points}
        color={index % 2 === 0 ? '#4ddcff' : '#8271ff'}
        lineWidth={0.8}
        transparent
        opacity={spinning ? 0.52 : 0.25}
      />
      <mesh ref={beadRef}>
        <sphereGeometry args={[0.045, 12, 12]} />
        <meshBasicMaterial
          color={index % 2 === 0 ? '#8bf1ff' : '#b2a4ff'}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
