import { useEffect, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import type { MeshPhysicalMaterial, Texture } from 'three';
import { REACTION_COLORS } from '../../game/config';
import type { SymbolId } from '../../game/types';

interface SymbolTileProps {
  symbol: SymbolId;
  texture: Texture;
  position: [number, number, number];
  highlighted: boolean;
}

export function SymbolTile({
  symbol,
  texture,
  position,
  highlighted,
}: SymbolTileProps) {
  const materialRef = useRef<MeshPhysicalMaterial>(null);
  const reaction = REACTION_COLORS[symbol];

  useEffect(() => {
    texture.colorSpace = 'srgb';
    texture.needsUpdate = true;
  }, [texture]);

  useEffect(() => {
    if (!materialRef.current) return;
    materialRef.current.emissiveIntensity = highlighted ? 1.8 : 0.1;
  }, [highlighted]);

  return (
    <group position={position}>
      <RoundedBox
        args={[1.08, 1.18, 0.14]}
        radius={0.08}
        smoothness={4}
        castShadow
        receiveShadow
      >
        <meshPhysicalMaterial
          ref={materialRef}
          color={symbol === 'BLANK' ? '#07101e' : '#111827'}
          metalness={0.78}
          roughness={0.24}
          clearcoat={0.72}
          clearcoatRoughness={0.16}
          emissive={reaction}
          emissiveIntensity={highlighted ? 1.8 : 0.1}
        />
      </RoundedBox>

      <mesh position={[0, 0, 0.082]}>
        <planeGeometry args={[0.88, 0.88]} />
        <meshBasicMaterial
          map={texture}
          transparent
          alphaTest={0.015}
          toneMapped={false}
          opacity={symbol === 'BLANK' ? 0.56 : 1}
        />
      </mesh>
    </group>
  );
}
