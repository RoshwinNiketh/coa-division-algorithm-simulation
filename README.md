# Binary Division Simulator — Restoring & Non-Restoring Division

An interactive **Computer Organization and Architecture (COA)** educational web application that teaches and simulates unsigned binary division step-by-step.

**By Roshwin Niketh M**

---

## Purpose

Unlike a simple binary calculator, this simulator acts as a patient teaching guide. It breaks every iteration down into hardware register micro-steps—explaining the combined `[A, Q]` left shift, vertical binary subtraction/addition, two's-complement sign checking on accumulator `A`, quotient-bit (`Q₀`) decisions, restoration vs. non-restoring compensation, and final remainder verification.

## Algorithms Supported

1. **Restoring Division Algorithm** (Unsigned)
2. **Non-Restoring Division Algorithm** (Unsigned)

> **Scope Note:** This simulator demonstrates **unsigned binary division** (`4-bit`, `8-bit`, and `16-bit` operands). Signed division requires additional sign-handling rules and is outside the current simulation.

---

## Key Features

- **Teacher-Style Micro-Steps:** Every cycle is decomposed into 5 pedagogical micro-steps (plus a dedicated post-loop Final Correction step in Non-Restoring Division).
- **Live Hardware Registers:** Displays `A` ($n+1$ bits), `Q` ($n$ bits), `M` ($n$ bits and $(n+1)$-bit zero-extended), `Q₀`, and `Count` with explicit `NEGATIVE` / `NON-NEGATIVE` sign badges.
- **Combined Shift Visualizer:** Illustrates how `Q`'s most-significant bit crosses into `A`'s least-significant bit during `Left Shift [A, Q]`.
- **Vertical Binary Arithmetic:** Shows both register-level subtraction/addition (`A - M`, `A + M`) and two's-complement hardware adder views (`A + (-M)`).
- **Interactive Controls:** `Previous Step`, `Next Step`, `Auto Play`, `Pause`, `Restart`, `Show All Steps`, and a step scrubber.
- **Complete Cycle Trace Table:** Summarizes every cycle and allows clicking any row to jump directly to that cycle.
- **Mathematical Verification:** Confirms `Dividend = Divisor × Quotient + Remainder` and `0 ≤ Remainder < Divisor`.

---

## Why Accumulator `A` Uses $n + 1$ Bits

For an $n$-bit unsigned dividend `Q` and $n$-bit unsigned divisor `M`:
- Register `A` (the partial remainder) is **$(n + 1)$ bits wide**, and `M` is zero-extended to **$(n + 1)$ bits** during arithmetic with `A`.
- After shifting `[A, Q]` left by 1 bit and subtracting or adding `M`, the signed partial remainder always satisfies $-M \le A < M$, which lies strictly within $[-(2^n - 1), 2^n - 2] \subset [-2^n, 2^n - 1]$.
- Using $n + 1$ bits in two's-complement representation guarantees that `A`'s most-significant bit (MSB) is always the true sign bit without signed overflow.

---

## Technology Stack

- **React 18**
- **TypeScript**
- **Vite**
- **Plain CSS** (Responsive white-and-blue academic theme)
- **Vitest** (Automated unit & exhaustive verification tests)

---

## Architecture & Modular Reusability

The codebase separates pure algorithm simulation engines from the React presentation layer so the division modules can be directly imported into a larger Computer Organization and Architecture simulator:

```text
src/
├── lib/
│   ├── binary.ts                 # BigInt fixed-width binary & two's-complement utilities
│   ├── restoringDivision.ts      # Pure Restoring Division engine & trace generator
│   └── nonRestoringDivision.ts   # Pure Non-Restoring Division engine & trace generator
├── types/
│   └── division.ts               # Structured trace, micro-step, and register interfaces
├── components/                   # Reusable COA register, shift, arithmetic, and trace UI
├── simulators/                   # Restoring & Non-Restoring simulator views
└── tests/                        # Unit + exhaustive 4-bit (240 pairs × 2) + 8/16-bit tests
```

---

## Getting Started

### Installation

```bash
npm install
```

### Run Locally (Development Server)

```bash
npm run dev
```

### Run Automated Tests

```bash
npm test
```

### Production Build

```bash
npm run build
```
