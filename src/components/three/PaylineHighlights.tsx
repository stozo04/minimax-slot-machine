import { Line } from '@react-three/drei';
import { PAY_LINES } from '../../game/config';
import type { LineWin } from '../../game/types';

const REEL_X = [-2.72, -1.36, 0, 1.36, 2.72];
const ROW_Y = [1.45, 0, -1.45];

interface PaylineHighlightsProps {
  wins: readonly LineWin[];
}

export function PaylineHighlights({ wins }: PaylineHighlightsProps) {
  return (
    <group>
      {wins.map((win) => {
        const rows = PAY_LINES[win.lineIndex];
        const points = rows.map((row, reel) => [
          REEL_X[reel],
          ROW_Y[row],
          0.92,
        ]) as [number, number, number][];

        return (
          <group key={`${win.lineIndex}-${win.symbol}`}>
            <Line
              points={points}
              color="#72edff"
              lineWidth={2.2}
              transparent
              opacity={0.92}
            />
            {points.map((point, index) => (
              <mesh key={index} position={point}>
                <sphereGeometry args={[0.065, 14, 14]} />
                <meshBasicMaterial
                  color="#d8fbff"
                  toneMapped={false}
                />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}
