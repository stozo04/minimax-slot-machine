export interface ReelSchedule {
  delayMs: number;
  durationMs: number;
}

export class AnimationController {
  constructor(private readonly reelCount: number) {}

  schedule(reelIndex: number): ReelSchedule {
    return {
      delayMs: reelIndex * 260,
      durationMs: 2200 + reelIndex * 130,
    };
  }

  totalDurationMs(): number {
    let total = 0;
    for (let reel = 0; reel < this.reelCount; reel += 1) {
      const schedule = this.schedule(reel);
      total = Math.max(total, schedule.delayMs + schedule.durationMs);
    }
    return total;
  }

  samplePosition(
    progress: number,
    start: number,
    target: number,
    stripLength: number,
    reelIndex: number,
  ): number {
    const clamped = Math.min(1, Math.max(0, progress));
    const normalizedTarget =
      ((target - start) % stripLength + stripLength) % stripLength;
    const turns = 5 + reelIndex;
    const travel = turns * stripLength + normalizedTarget;
    const eased = 1 - Math.pow(1 - clamped, 3.55);

    let position = start + travel * eased;

    if (clamped > 0.82) {
      const settleStrength = (1 - clamped) / 0.18;
      position +=
        Math.sin(clamped * Math.PI * 9) * settleStrength * stripLength * 0.012;
    }

    if (clamped >= 1) return target;
    return position;
  }

  speedFactor(progress: number): number {
    const clamped = Math.min(1, Math.max(0, progress));
    if (clamped < 0.16) return clamped / 0.16;
    if (clamped > 0.84) return (1 - clamped) / 0.16;
    return 1;
  }
}

export const animationController = new AnimationController(5);
