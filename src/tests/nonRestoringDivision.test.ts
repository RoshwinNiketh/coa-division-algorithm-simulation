import { describe, expect, it } from 'vitest';
import { simulateNonRestoringDivision } from '../lib/nonRestoringDivision';

describe('Non-Restoring Division Algorithm (nonRestoringDivision.ts)', () => {
  it('matches the exact known intermediate trace for 13 ÷ 3 (4-bit)', () => {
    const result = simulateNonRestoringDivision(13, 3, 4);

    expect(result.initialA).toBe('00000');
    expect(result.initialQ).toBe('1101');
    expect(result.divisorBinary).toBe('0011');
    expect(result.divisorExtendedBinary).toBe('00011');
    expect(result.nonRestoringCycles).toHaveLength(4);

    const cycles = result.nonRestoringCycles!;

    // Cycle 1
    expect(cycles[0]).toMatchObject({
      cycle: 1,
      aBefore: '00000',
      qBefore: '1101',
      previousSign: 'NON-NEGATIVE',
      operation: 'A = A - M',
      afterShiftA: '00001',
      afterShiftQ: '1010',
      aAfterArithmetic: '11110',
      afterArithmeticSign: 'NEGATIVE',
      q0: '0',
      aFinal: '11110',
      qFinal: '1010',
      countAfter: 3,
    });

    // Cycle 2
    expect(cycles[1]).toMatchObject({
      cycle: 2,
      aBefore: '11110',
      qBefore: '1010',
      previousSign: 'NEGATIVE',
      operation: 'A = A + M',
      afterShiftA: '11101',
      afterShiftQ: '0100',
      aAfterArithmetic: '00000',
      afterArithmeticSign: 'NON-NEGATIVE',
      q0: '1',
      aFinal: '00000',
      qFinal: '0101',
      countAfter: 2,
    });

    // Cycle 3
    expect(cycles[2]).toMatchObject({
      cycle: 3,
      aBefore: '00000',
      qBefore: '0101',
      previousSign: 'NON-NEGATIVE',
      operation: 'A = A - M',
      afterShiftA: '00000',
      afterShiftQ: '1010',
      aAfterArithmetic: '11101',
      afterArithmeticSign: 'NEGATIVE',
      q0: '0',
      aFinal: '11101',
      qFinal: '1010',
      countAfter: 1,
    });

    // Cycle 4
    expect(cycles[3]).toMatchObject({
      cycle: 4,
      aBefore: '11101',
      qBefore: '1010',
      previousSign: 'NEGATIVE',
      operation: 'A = A + M',
      afterShiftA: '11011',
      afterShiftQ: '0100',
      aAfterArithmetic: '11110',
      afterArithmeticSign: 'NEGATIVE',
      q0: '0',
      aFinal: '11110',
      qFinal: '0100',
      countAfter: 0,
    });

    // Final correction
    expect(result.finalCorrection).toMatchObject({
      needed: true,
      aBeforeCorrection: '11110',
      mExtended: '00011',
      aAfterCorrection: '00001',
    });

    expect(result.quotientBinary).toBe('0100');
    expect(result.quotientDecimal).toBe(4);
    expect(result.remainderBinary).toBe('00001');
    expect(result.remainderDecimal).toBe(1);
    expect(result.verification.isVerified).toBe(true);
    expect(result.microSteps).toHaveLength(21); // 4 cycles * 5 micro-steps + 1 final correction step
  });

  it('verifies required 4-bit benchmark cases', () => {
    const cases = [
      { dividend: 13, divisor: 3, quotient: 4, remainder: 1 },
      { dividend: 10, divisor: 2, quotient: 5, remainder: 0 },
      { dividend: 7, divisor: 3, quotient: 2, remainder: 1 },
      { dividend: 15, divisor: 4, quotient: 3, remainder: 3 },
      { dividend: 3, divisor: 7, quotient: 0, remainder: 3 },
      { dividend: 0, divisor: 5, quotient: 0, remainder: 0 },
      { dividend: 15, divisor: 15, quotient: 1, remainder: 0 },
    ];

    for (const tc of cases) {
      const res = simulateNonRestoringDivision(tc.dividend, tc.divisor, 4);
      expect(res.quotientDecimal).toBe(tc.quotient);
      expect(res.remainderDecimal).toBe(tc.remainder);
      expect(res.divisor * res.quotientDecimal + res.remainderDecimal).toBe(tc.dividend);
      expect(res.remainderDecimal).toBeGreaterThanOrEqual(0);
      expect(res.remainderDecimal).toBeLessThan(tc.divisor);
      expect(res.nonRestoringCycles).toHaveLength(4);
      expect(res.verification.isVerified).toBe(true);
    }
  });

  it('verifies structural invariants: previous A sign selects add/subtract, Q0 matches post-arithmetic sign, final correction only when A < 0', () => {
    // 13 ÷ 3 needs final correction (A after cycle 4 is 11110 < 0)
    const res1 = simulateNonRestoringDivision(13, 3, 4);
    expect(res1.finalCorrection!.needed).toBe(true);

    // 10 ÷ 2 has remainder 0, check if final correction behaves accurately
    const res2 = simulateNonRestoringDivision(10, 2, 4);
    for (const c of res2.nonRestoringCycles!) {
      if (c.previousSign === 'NON-NEGATIVE') {
        expect(c.operation).toBe('A = A - M');
      } else {
        expect(c.operation).toBe('A = A + M');
      }
      if (c.afterArithmeticSign === 'NON-NEGATIVE') {
        expect(c.q0).toBe('1');
      } else {
        expect(c.q0).toBe('0');
      }
    }
    const lastCycleA = res2.nonRestoringCycles![3].aFinal;
    expect(res2.finalCorrection!.needed).toBe(lastCycleA[0] === '1');
  });

  it('rejects divisor zero and out-of-range inputs', () => {
    expect(() => simulateNonRestoringDivision(13, 0, 4)).toThrow(/Division by zero is undefined/);
    expect(() => simulateNonRestoringDivision(16, 3, 4)).toThrow(/cannot be represented/);
    expect(() => simulateNonRestoringDivision(-1, 3, 4)).toThrow(/negative/);
  });

  it('passes exhaustive 4-bit verification across all 240 valid pairs (Dividend 0..15, Divisor 1..15)', () => {
    let pairCount = 0;
    for (let dividend = 0; dividend <= 15; dividend++) {
      for (let divisor = 1; divisor <= 15; divisor++) {
        pairCount++;
        const expectedQuotient = Math.floor(dividend / divisor);
        const expectedRemainder = dividend % divisor;

        const res = simulateNonRestoringDivision(dividend, divisor, 4);
        expect(res.quotientDecimal).toBe(expectedQuotient);
        expect(res.remainderDecimal).toBe(expectedRemainder);
        expect(res.remainderDecimal).toBeGreaterThanOrEqual(0);
        expect(res.remainderDecimal).toBeLessThan(divisor);
        expect(res.divisor * res.quotientDecimal + res.remainderDecimal).toBe(dividend);
        expect(res.verification.isVerified).toBe(true);
      }
    }
    expect(pairCount).toBe(240);
  });

  it('passes 8-bit and 16-bit test cases accurately', () => {
    const eightBitCases = [
      { dividend: 255, divisor: 1 },
      { dividend: 255, divisor: 255 },
      { dividend: 255, divisor: 2 },
      { dividend: 128, divisor: 3 },
      { dividend: 127, divisor: 7 },
      { dividend: 1, divisor: 255 },
      { dividend: 0, divisor: 255 },
    ];

    for (const tc of eightBitCases) {
      const res = simulateNonRestoringDivision(tc.dividend, tc.divisor, 8);
      expect(res.quotientDecimal).toBe(Math.floor(tc.dividend / tc.divisor));
      expect(res.remainderDecimal).toBe(tc.dividend % tc.divisor);
      expect(res.nonRestoringCycles).toHaveLength(8);
      expect(res.verification.isVerified).toBe(true);
    }

    const sixteenBitCases = [
      { dividend: 65535, divisor: 1 },
      { dividend: 65535, divisor: 65535 },
      { dividend: 65535, divisor: 255 },
      { dividend: 50000, divisor: 123 },
      { dividend: 0, divisor: 65535 },
    ];

    for (const tc of sixteenBitCases) {
      const res = simulateNonRestoringDivision(tc.dividend, tc.divisor, 16);
      expect(res.quotientDecimal).toBe(Math.floor(tc.dividend / tc.divisor));
      expect(res.remainderDecimal).toBe(tc.dividend % tc.divisor);
      expect(res.nonRestoringCycles).toHaveLength(16);
      expect(res.verification.isVerified).toBe(true);
    }
  });
});
