# NEURAL JACKPOT: The AI Wars

A playable browser-based 3D slot machine built with TypeScript, React,
Three.js, React Three Fiber, Drei, React Three Postprocessing, Zustand, GSAP,
and the Web Audio API.

All money in the game is fictional. There are no purchases, deposits, payments,
withdrawals, or real-fund transfers.

## Features

- Real 3D five-reel, three-row slot-machine enclosure
- Curved glass presentation, metallic chassis, reflections, soft shadows, bloom,
  and neural-energy lighting
- Twenty fixed paylines
- Six symbol types: Blank, Grok, ChatGPT, Muse, Anthropic, and Gemini
- Independently generated 100-position reel strips
- Cryptographically secure reel sampling in the browser
- Outcome selected before animation
- Animated independent reel acceleration, deceleration, stopping, and settling
- Winning-payline illumination and symbol-specific cosmetic reactions
- Payout count-up, particles, and restrained large-win presentation
- Denominations of $1, $5, and $10
- Multipliers of 1x, 5x, and MAX BET 10x
- Fictional credit deposits, cash-out receipt, and local session history
- Session persistence and recovery of an interrupted spin
- Developer diagnostics with a one-million-spin Web Worker simulation
- Keyboard support, reduced-motion preference, sound controls, and responsive UI

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- A modern browser with WebGL 2

## Run locally

```bash
npm install
npm run dev
```

Open the URL printed by Vite, normally:

```text
http://localhost:5173
```

Production build:

```bash
npm run build
npm run preview
```

## Verification commands

```bash
npm test
npm run validate:rtp
npm run simulate
```

`npm test` runs tests for:

- secure/seeded random sources;
- reel strip construction and uniform seeded sampling;
- fixed payline evaluation;
- payout calculation;
- credit-wallet accounting;
- duplicate-settlement protection;
- cash-out behavior;
- theoretical RTP;
- tampered-outcome rejection;
- reproducible simulation behavior.

`npm run validate:rtp` independently calculates RTP from the configured strips
and paytable. It exits with an error if the result is outside 93.5%–94.5%.

`npm run simulate` performs the required one-million-spin deterministic
simulation and writes `docs/simulation-report.md`.

## Wager calculation

```text
Total wager = denomination × multiplier × 20 active paylines
```

Examples:

- $1 denomination, 1x multiplier: $20 total wager
- $5 denomination, 5x multiplier: $500 total wager
- $10 denomination, 10x multiplier: $2,000 total wager

The wager is debited exactly once when a spin starts. The mathematical
outcome is then animated and independently validated before any payout is
credited. Settlement is idempotent, preventing duplicate credits from repeated
callbacks or stale animation frames.

## Probability model

The configured reel strips contain 100 positions each:

| Symbol | Strip positions | Frequency |
| --- | ---: | ---: |
| Blank | 40 | 40% |
| Grok | 25 | 25% |
| ChatGPT | 15 | 15% |
| Muse | 10 | 10% |
| Anthropic | 7 | 7% |
| Gemini | 3 | 3% |

The strips have different orderings. Every visible row is a cyclic shift of
its strip, so each visible row retains the exact frequencies above.

### Paytable

Values are multipliers of the wager on each line.

| Symbol | 3 | 4 | 5 |
| --- | ---: | ---: | ---: |
| Grok | 12x | 85x | 500x |
| ChatGPT | 7x | 40x | 180x |
| Muse | 6x | 25x | 120x |
| Anthropic | 2x | 8x | 70x |
| Gemini | 1x | 5x | 30x |

Matching symbols must begin on the leftmost reel and continue on consecutive
reels. Each line pays once at its highest 3-, 4-, or 5-symbol count. Blank
symbols never pay. All twenty lines are evaluated independently, including
overlapping combinations.

The exact theoretical RTP is:

```text
93.87072984%
```

This is calculated from the selected strips and paytable, not inferred from
the initial symbol weights. See `docs/probability-model.md` for the formula,
maximum payout, and sampling methodology.

## Credit system

Money is stored internally as integer cents:

- $100 deposit = 10,000 internal units
- $500 deposit = 50,000 internal units
- $1,000 deposit = 100,000 internal units
- $5,000 deposit = 500,000 internal units

Cash Out first creates a holographic receipt without moving funds. Confirming
the receipt resets the active virtual balance and stores the completed session
in local history.

If the page is reloaded during a spin, the pending mathematical outcome is
recovered from local storage, validated, and settled exactly once.

## Controls

- Select denomination and multiplier before spinning.
- Press the physical 3D SPIN control or the illuminated console SPIN button.
- Press Space to spin when focus is not on another control.
- Open Paytable, Game Rules, History, Statistics, or Settings from the lower
  navigation.
- Use Statistics to run the one-million-spin diagnostic simulation.

## Project architecture

- `src/game/ProbabilityEngine.ts` — secure outcome generation and validation
- `src/game/ReelEngine.ts` — reel sampling and grid construction
- `src/game/PaylineEvaluator.ts` — fixed payline evaluation
- `src/game/PayoutCalculator.ts` — payout conversion and totals
- `src/game/CreditWallet.ts` — integer-cent virtual wallet
- `src/game/GameEngine.ts` — debit, settlement, persistence, and cash-out flow
- `src/game/SessionManager.ts` — local storage session state
- `src/game/AnimationController.ts` — deterministic reel timing and motion
- `src/game/simulation.ts` — statistical simulation harness
- `src/components/three/SlotMachine3D.tsx` — 3D machine, reels, effects, camera
- `src/components/GameControls.tsx` — wager controls and SPIN interaction
- `src/components/StatisticsPanel.tsx` — developer RTP and frequency diagnostics
- `src/audio/SoundManager.ts` — Web Audio machinery, reel, and payout sounds

The game mechanics do not depend on React Three Fiber, animation frames, or
browser rendering. The render layer receives an already-selected outcome and
only visualizes it.

## Assets

Bundled assets are in `public/assets`:

- `grok.svg` — vector rendition of the supplied Grok symbol
- `chatgpt.svg` — vector rendition of the supplied ChatGPT symbol
- `muse-user.svg` — bundled rendition of the user-supplied Muse symbol
- `anthropic.svg` — brand-informed Anthropic geometric mark
- `gemini.svg` — gradient Gemini symbol
- `blank.svg` — procedural dark glass symbol

The Muse asset is intentionally configurable. To use the user's exact original
file instead of the bundled rendition, place it in `public/assets` and set:

```bash
VITE_MUSE_LOGO_URL=/assets/your-muse-logo.svg
```

The Anthropic asset is a clearly replaceable brand-informed vector. It can
also be replaced by adding a production-approved asset and updating
`ASSET_URLS` in `src/game/config.ts`.

All company names and marks belong to their respective owners. Their inclusion
in this demonstration does not imply endorsement or affiliation.

## Browser and accessibility notes

- Sound is created only after a user interaction, respecting browser autoplay
  rules.
- All primary controls are keyboard accessible.
- Reduced-motion mode shortens reel movement and disables nonessential camera
  drift.
- The UI remains usable on tablets and stacks controls on narrow screens.
- WebGL is required for the 3D stage.

## Documentation

- `docs/probability-model.md` — complete mathematical model
- `docs/simulation-report.md` — generated empirical simulation report
