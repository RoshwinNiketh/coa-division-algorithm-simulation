import { describe, expect, it } from 'vitest';
import { simulateRestoringDivision } from '../lib/restoringDivision';

describe('Restoring Division Algorithm (restoringDivision.ts)', () => {
  it('matches the exact known intermediate trace for 13 ÷ 3 (4-bit)', () => {
    const result = simulateRestoringDivision(13, 3, 4);

    expect(result.initialA).toBe('00000');
    expect(result.initialQ).toBe('1101');
    expect(result.divisorBinary).toBe('0011');
    expect(result.divisorExtendedBinary).toBe('00011');
    expect(result.restoringCycles).toHaveLength(4);

    const cycles = result.restoringCycles!;

    // Cycle 1
    expect(cycles[0]).toMatchObject({
      cycle: 1,
      aBefore: '00000',
      qBefore: '1101',
      afterShiftA: '00001',
      afterShiftQ: '1010',
      aMinusM: '11110',
      sign: 'NEGATIVE',
      q0: '0',
      restored: true,
      aFinal: '00001',
      qFinal: '1010',
      countAfter: 3,
    });

    // Cycle 2
    expect(cycles[1]).toMatchObject({
      cycle: 2,
      aBefore: '00001',
      qBefore: '1010',
      afterShiftA: '00011',
      afterShiftQ: '0100',
      aMinusM: '00000',
      sign: 'NON-NEGATIVE',
      q0: '1',
      restored: false,
      aFinal: '00000',
      qFinal: '0101',
      countAfter: 2,
    });

    // Cycle 3
    expect(cycles[2]).toMatchObject({
      cycle: 3,
      aBefore: '00000',
      qBefore: '0101',
      afterShiftA: '00000',
      afterShiftQ: '1010',
      aMinusM: '11101',
      sign: 'NEGATIVE',
      q0: '0',
      restored: true,
      aFinal: '00000',
      qFinal: '1010',
      countAfter: 1,
    });

    // Cycle 4
    expect(cycles[3]).toMatchObject({
      cycle: 4,
      aBefore: '00000',
      qBefore: '1010',
      afterShiftA: '00001',
      afterShiftQ: '0100',
      aMinusM: '11110',
      sign: 'NEGATIVE',
      q0: '0',
      restored: true,
      aFinal: '00001',
      qFinal: '0100',
      countAfter: 0,
    });

    expect(result.quotientBinary).toBe('0100');
    expect(result.quotientDecimal).toBe(4);
    expect(result.remainderBinary).toBe('00001');
    expect(result.remainderDecimal).toBe(1);
    expect(result.verification.isVerified).toBe(true);
    expect(result.microSteps).toHaveLength(20); // 4 cycles * 5 micro-steps
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
      const res = simulateRestoringDivision(tc.dividend, tc.divisor, 4);
      expect(res.quotientDecimal).toBe(tc.quotient);
      expect(res.remainderDecimal).toBe(tc.remainder);
      expect(res.divisor * res.quotientDecimal + res.remainderDecimal).toBe(tc.dividend);
      expect(res.remainderDecimal).toBeLessThan(tc.divisor);
      expect(res.restoringCycles).toHaveLength(4);
      expect(res.verification.isVerified).toBe(true);
    }
  });

  it('verifies structural invariants: Count decreases, negative triggers restore, non-negative sets Q0=1', () => {
    const res = simulateRestoringDivision(13, 3, 4);
    const cycles = res.restoringCycles!;

    expect(cycles.map((c) => c.countAfter)).toEqual([3, 2, 1, 0]);
    for (const c of cycles) {
      if (c.sign === 'NEGATIVE') {
        expect(c.q0).toBe('0');
        expect(c.restored).toBe(true);
        expect(c.aFinal).toBe(c.afterShiftA);
      } else {
        expect(c.q0).toBe('1');
        expect(c.restored).toBe(false);
        expect(c.aFinal).toBe(c.aMinusM);
      }
    }
  });

  it('rejects divisor zero and out-of-range inputs', () => {
    expect(() => simulateRestoringDivision(13, 0, 4)).toThrow(/Division by zero is undefined/);
    expect(() => simulateRestoringDivision(16, 3, 4)).toThrow(/cannot be represented/);
    expect(() => simulateRestoringDivision(-1, 3, 4)).toThrow(/negative/);
  });

  it('passes exhaustive 4-bit verification across all 240 valid pairs (Dividend 0..15, Divisor 1..15)', () => {
    let pairCount = 0;
    for (let dividend = 0; dividend <= 15; dividend++) {
      for (let divisor = 1; divisor <= 15; divisor++) {
        pairCount++;
        const expectedQuotient = Math.floor(dividend / divisor);
        const expectedRemainder = dividend % divisor;

        const res = simulateRestoringDivision(dividend, divisor, 4);
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
      const res = simulateRestoringDivision(tc.dividend, tc.divisor, 8);
      expect(res.quotientDecimal).toBe(Math.floor(tc.dividend / tc.divisor));
      expect(res.remainderDecimal).toBe(tc.dividend % tc.divisor);
      expect(res.restoringCycles).toHaveLength(8);
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
      const res = simulateRestoringDivision(tc.dividend, tc.divisor, 16);
      expect(res.quotientDecimal).toBe(Math.floor(tc.dividend / tc.divisor));
      expect(res.remainderDecimal).toBe(tc.dividend % tc.divisor);
      expect(res.restoringCycles).toHaveLength(16);
      expect(res.verification.isVerified).toBe(true);
    }
  });
});
