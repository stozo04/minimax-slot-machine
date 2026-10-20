import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  ContactShadows,
  Environment,
  Lightformer,
  Line,
  RoundedBox,
  useTexture,
} from '@react-three/drei';
import {
  Bloom,
  EffectComposer,
  Vignette,
} from '@react-three/postprocessing';
import {
  ACESFilmicToneMapping,
  Group,
  Mesh,
  MeshBasicMaterial,
  type Texture,
  Vector3,
} from 'three';
import { soundManager } from '../../audio/SoundManager';
import { animationController } from '../../game/AnimationController';
import { ASSET_URLS, PAY_LINES, REEL_STRIPS } from '../../game/config';
import type {
  GamePhase,
  SpinOutcome,
  SymbolId,
} from '../../game/types';
import { NeuralStrands } from './NeuralStrands';
import { PaylineHighlights } from './PaylineHighlights';
import { SymbolTile } from './SymbolTile';

const REEL_X = [-2.72, -1.36, 0, 1.36, 2.72];
const ROW_Y = [1.45, 0, -1.45];
const SYMBOLS: SymbolId[] = [
  'BLANK',
  'GROK',
  'CHATGPT',
  'MUSE',
  'ANTHROPIC',
  'GEMINI',
];

interface SlotMachine3DProps {
  outcome: SpinOutcome | null;
  phase: GamePhase;
  reducedMotion: boolean;
  skipToken: number;
  onComplete: (outcome: SpinOutcome) => void;
  onSpinRequest: () => void;
}

export default function SlotMachine3D({
  outcome,
  phase,
  reducedMotion,
  skipToken,
  onComplete,
  onSpinRequest,
}: SlotMachine3DProps) {
  const grandWin =
    outcome !== null && outcome.totalWinCents >= outcome.wagerCents * 20;

  return (
    <div className="three-stage" aria-label="Interactive 3D slot machine">
      <Canvas
        shadows
        dpr={[1, 1.65]}
        camera={{ position: [0, 0.25, 10.8], fov: 40, near: 0.1, far: 100 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.12;
        }}
        fallback={
          <div className="webgl-fallback">
            WebGL is required to render the 3D machine.
          </div>
        }
      >
        <color attach="background" args={['#03060d']} />
        <fog attach="fog" args={['#03060d', 12, 26]} />

        <ambientLight intensity={0.35} color="#8aa6ce" />
        <directionalLight
          position={[4, 8, 7]}
          intensity={2.1}
          color="#d8e9ff"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <spotLight
          position={[-5, 5, 6]}
          angle={0.52}
          penumbra={0.85}
          intensity={28}
          color="#507dff"
        />
        <spotLight
          position={[5, 2, 5]}
          angle={0.5}
          penumbra={0.9}
          intensity={24}
          color="#37ddff"
        />

        <Environment resolution={96}>
          <Lightformer
            form="rect"
            intensity={3}
            color="#dcecff"
            position={[0, 6, 5]}
            scale={[8, 3, 1]}
          />
          <Lightformer
            form="rect"
            intensity={4}
            color="#4fd8ff"
            position={[-6, 1, 2]}
            rotation={[0, Math.PI / 2, 0]}
            scale={[4, 5, 1]}
          />
          <Lightformer
            form="rect"
            intensity={3.5}
            color="#826dff"
            position={[6, 0, 1]}
            rotation={[0, -Math.PI / 2, 0]}
            scale={[4, 5, 1]}
          />
        </Environment>

        <MachineModel
          outcome={outcome}
          phase={phase}
          reducedMotion={reducedMotion}
          grandWin={grandWin}
          onSpinRequest={onSpinRequest}
        />

        <Suspense fallback={null}>
          <Reels
            outcome={outcome}
            reducedMotion={reducedMotion}
            skipToken={skipToken}
            onComplete={onComplete}
          />
        </Suspense>

        <PaylineHighlights wins={outcome?.wins ?? []} />

        <ContactShadows
          position={[0, -3.56, 0]}
          opacity={0.52}
          scale={13}
          blur={2.6}
          far={7}
          resolution={512}
          color="#00020a"
        />

        <mesh position={[0, -3.58, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[40, 40]} />
          <meshStandardMaterial
            color="#060a12"
            metalness={0.8}
            roughness={0.32}
          />
        </mesh>

        <CameraRig grandWin={grandWin} reducedMotion={reducedMotion} />

        <EffectComposer multisampling={0}>
          <Bloom
            intensity={grandWin ? 1.15 : 0.65}
            luminanceThreshold={0.72}
            luminanceSmoothing={0.22}
            mipmapBlur
          />
          <Vignette eskil={false} offset={0.2} darkness={0.72} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

function CameraRig({
  grandWin,
  reducedMotion,
}: {
  grandWin: boolean;
  reducedMotion: boolean;
}) {
  const { camera } = useThree();
  const target = useRef(new Vector3(0, 0.1, grandWin ? 12.5 : 10.8));

  useFrame((_, delta) => {
    if (reducedMotion) return;
    target.current.z += ((grandWin ? 12.5 : 10.8) - target.current.z) * 0.035;
    camera.position.lerp(target.current, 1 - Math.pow(0.001, delta));
    camera.lookAt(0, -0.15, 0);
  });

  return null;
}

function MachineModel({
  outcome,
  phase,
  reducedMotion,
  grandWin,
  onSpinRequest,
}: {
  outcome: SpinOutcome | null;
  phase: GamePhase;
  reducedMotion: boolean;
  grandWin: boolean;
  onSpinRequest: () => void;
}) {
  const [buttonHovered, setButtonHovered] = useState(false);
  const spinning = phase === 'SPINNING';

  useEffect(() => {
    if (!buttonHovered) return;
    document.body.style.cursor = 'pointer';
    return () => {
      document.body.style.cursor = '';
    };
  }, [buttonHovered]);

  return (
    <group position={[0, 0.15, 0]}>
      <RoundedBox
        args={[8.25, 0.56, 3.25]}
        radius={0.18}
        smoothness={5}
        position={[0, -3.25, -0.1]}
        castShadow
        receiveShadow
      >
        <meshPhysicalMaterial
          color="#080b12"
          metalness={0.92}
          roughness={0.28}
          clearcoat={0.6}
          clearcoatRoughness={0.18}
        />
      </RoundedBox>

      <RoundedBox
        args={[8.05, 0.72, 2.85]}
        radius={0.22}
        smoothness={5}
        position={[0, 3.05, -0.18]}
        castShadow
        receiveShadow
      >
        <meshPhysicalMaterial
          color="#0b0e16"
          metalness={0.94}
          roughness={0.25}
          clearcoat={0.65}
        />
      </RoundedBox>

      {[-3.88, 3.88].map((x) => (
        <RoundedBox
          key={x}
          args={[0.42, 5.72, 2.8]}
          radius={0.18}
          smoothness={5}
          position={[x, -0.08, -0.16]}
          castShadow
          receiveShadow
        >
          <meshPhysicalMaterial
            color="#090c13"
            metalness={0.96}
            roughness={0.23}
            clearcoat={0.72}
          />
        </RoundedBox>
      ))}

      <RoundedBox
        args={[7.35, 5.2, 0.4]}
        radius={0.2}
        smoothness={5}
        position={[0, -0.04, -0.68]}
        receiveShadow
      >
        <meshPhysicalMaterial
          color="#050810"
          metalness={0.78}
          roughness={0.3}
        />
      </RoundedBox>

      {REEL_X.slice(0, -1).map((x, index) => (
        <group key={x}>
          <RoundedBox
            args={[0.075, 4.72, 0.42]}
            radius={0.03}
            smoothness={3}
            position={[x + 0.68, -0.02, -0.1]}
          >
            <meshPhysicalMaterial
              color="#151c28"
              metalness={0.95}
              roughness={0.18}
            />
          </RoundedBox>
          <Line
            points={[
              [x + 0.68, 2.27, 0.16],
              [x + 0.68, -2.27, 0.16],
            ]}
            color={index % 2 === 0 ? '#4bdcff' : '#7d6cff'}
            lineWidth={0.8}
            transparent
            opacity={spinning ? 0.9 : 0.45}
          />
        </group>
      ))}

      <NeuralStrands spinning={spinning} reducedMotion={reducedMotion} />

      <mesh position={[0, 0.03, 0.7]}>
        <planeGeometry args={[7.2, 5.12]} />
        <meshPhysicalMaterial
          color="#91c9ff"
          transparent
          opacity={0.075}
          transmission={0.72}
          thickness={0.3}
          roughness={0.08}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.05}
          depthWrite={false}
        />
      </mesh>

      <mesh position={[0, 2.63, 0.35]}>
        <boxGeometry args={[6.95, 0.055, 0.08]} />
        <meshBasicMaterial
          color={grandWin ? '#b897ff' : '#57dfff'}
          toneMapped={false}
        />
      </mesh>

      <mesh position={[0, -2.48, 0.36]}>
        <boxGeometry args={[6.95, 0.035, 0.06]} />
        <meshBasicMaterial
          color={grandWin ? '#7ef2ff' : '#6358ff'}
          toneMapped={false}
        />
      </mesh>

      <group
        position={[2.25, -2.78, 0.62]}
        onClick={(event) => {
          event.stopPropagation();
          if (!spinning) onSpinRequest();
        }}
        onPointerOver={() => setButtonHovered(true)}
        onPointerOut={() => setButtonHovered(false)}
      >
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.48, 0.53, 0.26, 64]} />
          <meshPhysicalMaterial
            color="#151b25"
            metalness={0.98}
            roughness={0.18}
            clearcoat={0.72}
          />
        </mesh>
        <mesh position={[0, 0, 0.15]}>
          <torusGeometry args={[0.39, 0.045, 16, 64]} />
          <meshBasicMaterial
            color={spinning ? '#4d7bff' : grandWin ? '#b693ff' : '#57e8ff'}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0, 0, 0.145]}>
          <circleGeometry args={[0.31, 48]} />
          <meshStandardMaterial
            color="#08111c"
            metalness={0.65}
            roughness={0.28}
            emissive={spinning ? '#183b9b' : '#071a24'}
            emissiveIntensity={spinning ? 2.2 : 0.7}
          />
        </mesh>
        <pointLight
          position={[0, 0, 0.55]}
          color={grandWin ? '#a879ff' : '#55ddff'}
          intensity={spinning ? 4.5 : 2.4}
          distance={2.8}
        />
      </group>

      <group position={[-2.55, -2.79, 0.55]}>
        <RoundedBox args={[1.7, 0.5, 0.18]} radius={0.08} smoothness={4}>
          <meshPhysicalMaterial
            color="#080c14"
            metalness={0.88}
            roughness={0.22}
          />
        </RoundedBox>
        <Line
          points={[
            [-2.95, -2.79, 0.66],
            [-2.15, -2.79, 0.66],
          ]}
          color="#5ee3ff"
          lineWidth={1.2}
        />
      </group>

      {outcome && outcome.totalWinCents > 0 && (
        <WinParticles amount={outcome.totalWinCents} grand={grandWin} />
      )}
    </group>
  );
}

function Reels({
  outcome,
  reducedMotion,
  skipToken,
  onComplete,
}: {
  outcome: SpinOutcome | null;
  reducedMotion: boolean;
  skipToken: number;
  onComplete: (outcome: SpinOutcome) => void;
}) {
  const completionTimeout = useRef<number | null>(null);
  const completed = useRef(false);

  useEffect(() => {
    completed.current = false;
    if (completionTimeout.current !== null) {
      window.clearTimeout(completionTimeout.current);
      completionTimeout.current = null;
    }
  }, [outcome?.spinId]);

  useEffect(
    () => () => {
      if (completionTimeout.current !== null) {
        window.clearTimeout(completionTimeout.current);
      }
    },
    [],
  );

  const handleStop = useCallback(
    (reelIndex: number) => {
      soundManager.reelStop(reelIndex);
      if (reelIndex !== 4 || !outcome || completed.current) return;

      completed.current = true;
      soundManager.stopSpin();
      completionTimeout.current = window.setTimeout(
        () => onComplete(outcome),
        reducedMotion ? 40 : 220,
      );
    },
    [onComplete, outcome, reducedMotion],
  );

  return (
    <group position={[0, 0.15, 0]}>
      {REEL_X.map((x, reelIndex) => (
        <Reel
          key={reelIndex}
          reelIndex={reelIndex}
          positionX={x}
          outcome={outcome}
          reducedMotion={reducedMotion}
          skipToken={skipToken}
          onStop={handleStop}
        />
      ))}
    </group>
  );
}

function Reel({
  reelIndex,
  positionX,
  outcome,
  reducedMotion,
  skipToken,
  onStop,
}: {
  reelIndex: number;
  positionX: number;
  outcome: SpinOutcome | null;
  reducedMotion: boolean;
  skipToken: number;
  onStop: (reelIndex: number) => void;
}) {
  const strip = ASSET_URLS;
  const textures = useTexture(strip) as unknown as Record<
    SymbolId,
    Texture
  >;
  const reelGroup = useRef<Group>(null);
  const drum = useRef<Mesh>(null);
  const blurMaterial = useRef<MeshBasicMaterial>(null);
  const symbolGroups = useRef<Array<Group | null>>([]);
  const elapsed = useRef(0);
  const stopped = useRef(false);
  const previousStop = useRef(outcome?.reelStops[reelIndex] ?? 0);
  const startStop = useRef(previousStop.current);
  const target = outcome?.reelStops[reelIndex] ?? 0;
  const stripLength = 100;

  const highlightedCells = useMemo(() => {
    const cells = new Set<string>();
    outcome?.wins.forEach((win) => {
      const line = PAY_LINES[win.lineIndex];
      line.forEach((row, reel) => cells.add(`${reel}:${row}`));
    });
    return cells;
  }, [outcome]);

  useEffect(() => {
    startStop.current = previousStop.current;
    previousStop.current = target;
    elapsed.current = 0;
    stopped.current = false;
  }, [outcome?.spinId, target]);

  useEffect(() => {
    if (skipToken > 0) elapsed.current = Number.MAX_SAFE_INTEGER;
  }, [skipToken]);

  useFrame(() => {
    if (!outcome || !reelGroup.current) return;

    elapsed.current += reelGroup.current.userData.delta ?? 0;
    const schedule = animationController.schedule(reelIndex);
    const delay = reducedMotion ? schedule.delayMs * 0.15 : schedule.delayMs;
    const duration = reducedMotion
      ? schedule.durationMs * 0.2
      : schedule.durationMs;
    const now = performance.now();
    const startTime = Number(reelGroup.current.userData.startTime ?? now);
    const localTime = Math.max(0, now - startTime - delay);
    const progress = Math.min(1, localTime / duration);
    const position = animationController.samplePosition(
      progress,
      startStop.current,
      target,
      stripLength,
      reelIndex,
    );
    const center = ((Math.floor(position) % stripLength) + stripLength) % stripLength;
    const visibleSymbols: SymbolId[] = [
      outcome.grid[reelIndex][0],
      outcome.grid[reelIndex][1],
      outcome.grid[reelIndex][2],
    ];

    if (progress < 1) {
      const stripAtPosition = (offset: number) => {
        const index = (center + offset + stripLength) % stripLength;
        const configuredStrip = REEL_STRIPS[reelIndex];
        return configuredStrip[index];
      };

      visibleSymbols[0] = stripAtPosition(-1);
      visibleSymbols[1] = stripAtPosition(0);
      visibleSymbols[2] = stripAtPosition(1);
    }

    symbolGroups.current.forEach((group, symbolIndex) => {
      if (!group) return;
      group.children.forEach((tile, row) => {
        tile.visible = visibleSymbols[row] === SYMBOLS[symbolIndex];
      });
    });

    if (drum.current) {
      drum.current.rotation.x = -((position - startStop.current) / stripLength) * Math.PI * 2;
    }

    if (blurMaterial.current) {
      const speed = animationController.speedFactor(progress);
      blurMaterial.current.opacity = 0.055 + speed * 0.2;
    }

    if (progress > 0.82 && progress < 1 && reelGroup.current) {
      reelGroup.current.position.x =
        positionX + Math.sin(progress * Math.PI * 14) * (1 - progress) * 0.035;
    } else if (reelGroup.current) {
      reelGroup.current.position.x = positionX;
    }

    if (progress >= 1 && !stopped.current) {
      stopped.current = true;
      onStop(reelIndex);
    }
  });

  useEffect(() => {
    if (!reelGroup.current) return;
    reelGroup.current.userData.startTime = performance.now();
  }, [outcome?.spinId]);

  return (
    <group ref={reelGroup} position={[positionX, 0, 0]}>
      <mesh ref={drum} position={[0, 0, -1]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[1.18, 1.18, 1.12, 64]} />
        <meshStandardMaterial
          color="#050912"
          metalness={0.82}
          roughness={0.28}
        />
      </mesh>

      <mesh position={[0, 0, -1]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.2, 1.2, 1.14, 48, 1, true]} />
        <meshBasicMaterial
          ref={blurMaterial}
          color="#b8d8ff"
          transparent
          opacity={0.08}
          depthWrite={false}
          side={2}
          toneMapped={false}
        />
      </mesh>

      {SYMBOLS.map((symbol, symbolIndex) => (
        <group
          key={symbol}
          ref={(node) => {
            symbolGroups.current[symbolIndex] = node;
          }}
        >
          {ROW_Y.map((y, row) => (
            <SymbolTile
              key={row}
              symbol={symbol}
              texture={textures[symbol]}
              position={[0, y, 0.26]}
              highlighted={highlightedCells.has(`${reelIndex}:${row}`)}
              visible={symbol === REEL_STRIPS[reelIndex][(row + stripLength - 1) % stripLength]}
            />
          ))}
        </group>
      ))}
    </group>
  );
}

function WinParticles({ amount, grand }: { amount: number; grand: boolean }) {
  const group = useRef<Group>(null);
  const positions = useMemo(
    () =>
      Array.from({ length: grand ? 32 : 18 }, (_, index) => {
        const angle = (index / (grand ? 32 : 18)) * Math.PI * 2;
        const radius = 2.4 + (index % 5) * 0.33;
        return [
          Math.cos(angle) * radius,
          ((index % 7) - 3) * 0.47,
          0.45 + (index % 3) * 0.15,
        ] as [number, number, number];
      }),
    [grand],
  );

  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.rotation.y = Math.sin(clock.elapsedTime * 0.45) * 0.12;
    group.current.position.y = Math.sin(clock.elapsedTime * 1.2) * 0.06;
    const scale = 0.9 + Math.sin(clock.elapsedTime * 2.1) * 0.08;
    group.current.scale.setScalar(scale);
  });

  return (
    <group ref={group}>
      {positions.map((position, index) => (
        <mesh key={index} position={position}>
          <sphereGeometry args={[grand ? 0.035 : 0.025, 10, 10]} />
          <meshBasicMaterial
            color={index % 3 === 0 ? '#a88cff' : index % 3 === 1 ? '#67eaff' : '#d7fbff'}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}
