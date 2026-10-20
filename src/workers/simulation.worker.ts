import { runSimulation } from '../game/simulation';

interface WorkerRequest {
  spins: number;
  seed: number;
}

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
  postMessage: (message: unknown) => void;
};

scope.onmessage = (event) => {
  try {
    const result = runSimulation(event.data.spins, event.data.seed);
    scope.postMessage(result);
  } catch (error) {
    scope.postMessage({
      error: error instanceof Error ? error.message : 'Simulation failed.',
    });
  }
};

export {};
