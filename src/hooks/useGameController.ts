import { useCallback, useEffect, useRef } from 'react';
import { soundManager } from '../audio/SoundManager';
import { calculateTotalWagerCents } from '../game/config';
import { gameEngine } from '../game/GameEngine';
import { InsufficientCreditsError } from '../game/CreditWallet';
import { useGameStore } from '../store/useGameStore';
import type { SpinOutcome } from '../game/types';

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

export function useGameController() {
  const activeSpinId = useRef<string | null>(null);

  const syncEngine = useCallback(() => {
    const store = useGameStore.getState();
    store.setWallet(gameEngine.getWalletSnapshot());
    store.setHistory(gameEngine.getHistory());
    store.setCompletedSessions(gameEngine.getCompletedSessions());
  }, []);

  const depositCredits = useCallback(
    async (amountCents: number) => {
      await soundManager.unlock();
      soundManager.click();
      gameEngine.deposit(amountCents);
      syncEngine();
      useGameStore.getState().setDepositOpen(false);
      useGameStore
        .getState()
        .setToast('Virtual credits deposited. No real funds were used.', 'success');
    },
    [syncEngine],
  );

  const spin = useCallback(async () => {
    const store = useGameStore.getState();
    if (store.phase !== 'IDLE' || store.cashOutOpen || activeSpinId.current) {
      return;
    }

    const totalWager = calculateTotalWagerCents(
      store.settings.denominationCents,
      store.settings.multiplier,
    );

    if (store.wallet.availableCents < totalWager) {
      soundManager.error();
      store.setToast(
        `You need ${(totalWager / 100).toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
        })} in virtual credits for this wager.`,
        'warning',
      );
      store.setDepositOpen(true);
      return;
    }

    await soundManager.unlock();
    store.setPhase('BET_PLACED');

    try {
      const outcome = gameEngine.beginSpin(totalWager);
      activeSpinId.current = outcome.spinId;
      store.setLastOutcome(outcome);
      store.setWallet(gameEngine.getWalletSnapshot());
      store.setPhase('SPINNING');
      soundManager.spinStart();
    } catch (error) {
      store.setPhase('IDLE');
      if (error instanceof InsufficientCreditsError) {
        soundManager.error();
        store.setToast('Insufficient virtual credits.', 'warning');
        store.setDepositOpen(true);
      } else {
        store.setToast(
          error instanceof Error ? error.message : 'The spin could not start.',
          'warning',
        );
      }
    }
  }, []);

  const completeSpin = useCallback(
    async (outcome: SpinOutcome) => {
      if (activeSpinId.current !== outcome.spinId) return;

      const store = useGameStore.getState();
      store.setPhase('EVALUATING');

      try {
        const wallet = gameEngine.settleOutcome(outcome);
        store.setWallet(wallet);
        store.setHistory(gameEngine.getHistory());
        store.setCompletedSessions(gameEngine.getCompletedSessions());

        if (outcome.totalWinCents > 0) {
          const multiplier = outcome.totalWinCents / outcome.wagerCents;
          soundManager.payout(multiplier >= 20);
          store.setToast(
            `${outcome.wins.length} winning payline${outcome.wins.length === 1 ? '' : 's'}.`,
            'success',
          );
        } else {
          store.setToast('No winning payline this spin.', 'info');
        }

        await wait(store.settings.reducedMotion ? 100 : 320);
        store.setPhase('PAYOUT');
        await wait(store.settings.reducedMotion ? 180 : 1150);
        store.setPhase('IDLE');
      } catch (error) {
        store.setPhase('IDLE');
        store.setToast(
          error instanceof Error
            ? error.message
            : 'The spin could not be settled.',
          'warning',
        );
      } finally {
        activeSpinId.current = null;
      }
    },
    [],
  );

  const prepareCashOut = useCallback(async () => {
    const store = useGameStore.getState();
    if (store.phase !== 'IDLE') {
      soundManager.error();
      store.setToast('Wait for the reels to settle before cashing out.', 'warning');
      return;
    }

    await soundManager.unlock();
    try {
      const receipt = gameEngine.prepareCashOut();
      store.setCashOutReceipt(receipt);
      store.setCashOutOpen(true);
    } catch (error) {
      store.setToast(
        error instanceof Error ? error.message : 'Cash out is unavailable.',
        'warning',
      );
    }
  }, []);

  const confirmCashOut = useCallback(() => {
    const store = useGameStore.getState();
    if (!store.cashOutReceipt) return;

    try {
      gameEngine.commitCashOut(store.cashOutReceipt);
      syncEngine();
      store.setCashOutReceipt(null);
      store.setCashOutOpen(false);
      soundManager.cashOut();
      store.setToast(
        'Virtual transfer complete. The session was saved to local history.',
        'success',
      );
    } catch (error) {
      store.setToast(
        error instanceof Error ? error.message : 'Cash out could not be completed.',
        'warning',
      );
    }
  }, [syncEngine]);

  const cancelCashOut = useCallback(() => {
    const store = useGameStore.getState();
    store.setCashOutReceipt(null);
    store.setCashOutOpen(false);
  }, []);

  const requestSkip = useCallback(() => {
    useGameStore.getState().incrementSkipToken();
  }, []);

  const toggleSound = useCallback(() => {
    const store = useGameStore.getState();
    const muted = !store.settings.muted;
    store.setSettings({ muted });
    soundManager.setMuted(muted);
    if (!muted) {
      void soundManager.unlock();
      soundManager.click();
    }
  }, []);

  const changeVolume = useCallback((volume: number) => {
    const store = useGameStore.getState();
    store.setSettings({ volume });
    soundManager.setVolume(volume);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || event.repeat) return;
      const target = event.target as HTMLElement | null;
      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'SELECT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'BUTTON' ||
        target?.isContentEditable
      ) {
        return;
      }
      event.preventDefault();
      void spin();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [spin]);

  return {
    depositCredits,
    spin,
    completeSpin,
    prepareCashOut,
    confirmCashOut,
    cancelCashOut,
    requestSkip,
    toggleSound,
    changeVolume,
  };
}
