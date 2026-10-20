# Neural Jackpot Probability Model

## Machine configuration

- Five independent reels
- Three visible rows per reel
- Twenty fixed paylines
- One result is selected per reel from a 100-position virtual strip
- Every stop position is sampled uniformly
- No wilds, scatters, or bonus symbols
- Blank never pays

The runtime uses `crypto.getRandomValues` with rejection sampling. Random
reel stops are selected before the animation starts. Animation timing and
rendered frames have no influence on the result.

## Strip frequencies

Each 100-position reel strip contains:

| Symbol | Positions | Frequency |
| --- | ---: | ---: |
| Blank | 40 | 40% |
| Grok | 25 | 25% |
| ChatGPT | 15 | 15% |
| Muse | 10 | 10% |
| Anthropic | 7 | 7% |
| Gemini | 3 | 3% |

The strips use different deterministic orderings. Every visible row is a
cyclic shift of its reel strip, so the marginal frequency of every visible
row is exactly the table above.

The five generated strips and the target residue counts are defined in
`src/game/config.ts`.

## Payline evaluation

A win starts on reel one and continues on consecutive reels. A line with three
matching symbols is evaluated as follows:

1. Read the symbol on reel one.
2. If it is Blank, the line does not win.
3. Count consecutive matching symbols beginning on reel one.
4. If the count is 3, 4, or 5, pay the corresponding multiplier.
5. Stop at the first nonmatching reel.

A line pays once, at its highest qualifying count. A four-symbol result is
not also paid as a three-symbol result. Different lines are evaluated
independently, so overlapping wins on different lines are all paid.

## Paytable

Values are multipliers of the per-line wager.

| Symbol | 3 | 4 | 5 |
| --- | ---: | ---: | ---: |
| Grok | 12x | 85x | 500x |
| ChatGPT | 7x | 40x | 180x |
| Muse | 6x | 25x | 120x |
| Anthropic | 2x | 8x | 70x |
| Gemini | 1x | 5x | 30x |

## Theoretical RTP

For one line and one paying symbol, let:

- `p3` be the probability of three matching symbols;
- `p4` be the probability of four matching symbols;
- `p5` be the probability of five matching symbols.

Then the expected multiplier is:

`RTP_line = (p3 - p4) × pay3 + (p4 - p5) × pay4 + p5 × pay5`

The exact configured value is:

**93.87072984%**

Because all twenty lines use equal per-line wagers, the total-game RTP has the
same value. The implementation calculates this from the actual strips and
paytable in `src/game/ProbabilityEngine.ts`; it does not assume that the
initial symbol weights imply a particular RTP.

`npm run validate:rtp` fails if the value is outside 93.5%–94.5%.

## Hit frequency

The theoretical probability that a single line contains at least three
matching nonblank symbols is 2.037%. The probability that a complete spin
contains one or more winning lines is evaluated by the simulation harness
because the twenty lines overlap and are not statistically independent.

## Maximum payout

The highest possible line award is 500 times the line wager. The strips each
contain a three-position Grok run, making an all-Grok visible grid attainable.
If that grid occurs, all twenty lines are five-symbol Grok wins.

Maximum theoretical total payout:

`20 lines × 500 × line wager = 10,000 × line wager`

At the maximum $10 denomination and 10x multiplier:

- Line wager: $100
- Total wager: $2,000
- Maximum payout: $1,000,000
- Maximum payout relative to total wager: 500x

This event is exceptionally rare and is not used to alter outcomes.

## Sampling uncertainty

The one-million-spin harness reports:

- empirical RTP;
- sample standard error;
- a 95% confidence interval;
- hit frequency;
- win-band distribution;
- observed maximum payout;
- observed symbol frequencies.

The empirical result is an estimate. The configured theoretical RTP remains
authoritative and is never adjusted based on session losses, balance, bet
size, or prior spins.
