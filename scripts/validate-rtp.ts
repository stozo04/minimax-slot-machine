import { gameConfig } from '../src/game/config';
import {
  calculateTheoreticalRtp,
  THEORETICAL_LINE_HIT_FREQUENCY,
} from '../src/game/ProbabilityEngine';

const rtp = calculateTheoreticalRtp(gameConfig);
const lowerBound = 0.935;
const upperBound = 0.945;

console.log('NEURAL JACKPOT — THEORETICAL RTP VALIDATION');
console.log('--------------------------------------------');
console.log(`Reels: ${gameConfig.reelCount}`);
console.log(`Rows per reel: ${gameConfig.rows}`);
console.log(`Paylines: ${gameConfig.paylines.length}`);
console.log(`Theoretical RTP: ${(rtp * 100).toFixed(10)}%`);
console.log(
  `Theoretical hit frequency per line: ${(
    THEORETICAL_LINE_HIT_FREQUENCY * 100
  ).toFixed(6)}%`,
);
console.log(`Required range: ${(lowerBound * 100).toFixed(2)}%–${(upperBound * 100).toFixed(2)}%`);

if (rtp < lowerBound || rtp > upperBound) {
  console.error('RTP validation failed.');
  process.exitCode = 1;
} else {
  console.log('RTP validation passed.');
}
