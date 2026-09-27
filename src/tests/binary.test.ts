import { describe, expect, it } from 'vitest';
import {
  addBinaryFixedWidth,
  binaryToSignedDecimal,
  binaryToUnsignedDecimal,
  decimalToBinary,
  formatBinary,
  getMaxUnsignedValue,
  getSignStatus,
  isNegativeBinary,
  isValidUnsignedRange,
  leftShiftCombinedAQ,
  setLeastSignificantBit,
  subtractBinaryFixedWidth,
  twosComplement,
  validateSimulationInputs,
  zeroExtend,
} from '../lib/binary';

describe('Binary Utilities (binary.ts)', () => {
  it('computes max unsigned value for 4, 8, and 16 bits without 32-bit overflow', () => {
    expect(getMaxUnsignedValue(4)).toBe(15);
    expect(getMaxUnsignedValue(8)).toBe(255);
    expect(getMaxUnsignedValue(16)).toBe(65535);
  });

  it('validates unsigned range accurately', () => {
    expect(isValidUnsignedRange(0, 4)).toBe(true);
    expect(isValidUnsignedRange(15, 4)).toBe(true);
    expect(isValidUnsignedRange(16, 4)).toBe(false);
    expect(isValidUnsignedRange(-1, 4)).toBe(false);
    expect(isValidUnsignedRange(3.5, 4)).toBe(false);
    expect(isValidUnsignedRange(65535, 16)).toBe(true);
    expect(isValidUnsignedRange(65536, 16)).toBe(false);
  });

  it('converts decimal to fixed-width binary and back', () => {
    expect(decimalToBinary(13, 4)).toBe('1101');
    expect(decimalToBinary(3, 4)).toBe('0011');
    expect(decimalToBinary(0, 5)).toBe('00000');
    expect(decimalToBinary(-2, 5)).toBe('11110');
    expect(binaryToUnsignedDecimal('1101')).toBe(13);
    expect(binaryToUnsignedDecimal('1111111111111111')).toBe(65535);
  });

  it('interprets signed two-complement binary strings for register A', () => {
    expect(binaryToSignedDecimal('00000')).toBe(0);
    expect(binaryToSignedDecimal('00001')).toBe(1);
    expect(binaryToSignedDecimal('01111')).toBe(15);
    expect(binaryToSignedDecimal('11111')).toBe(-1);
    expect(binaryToSignedDecimal('11110')).toBe(-2);
    expect(binaryToSignedDecimal('11101')).toBe(-3);
    expect(binaryToSignedDecimal('10000')).toBe(-16);
  });

  it('detects sign status accurately', () => {
    expect(isNegativeBinary('11110')).toBe(true);
    expect(getSignStatus('11110')).toBe('NEGATIVE');
    expect(isNegativeBinary('00001')).toBe(false);
    expect(getSignStatus('00001')).toBe('NON-NEGATIVE');
    expect(getSignStatus('00000')).toBe('NON-NEGATIVE');
  });

  it('zero-extends divisor M from n bits to n + 1 bits', () => {
    expect(zeroExtend('0011', 5)).toBe('00011');
    expect(zeroExtend('1111', 5)).toBe('01111');
  });

  it('performs fixed-width two-complement, addition, and subtraction', () => {
    expect(twosComplement('00011')).toBe('11101'); // -3 in 5-bit
    const sub = subtractBinaryFixedWidth('00001', '00011', 5);
    expect(sub.result).toBe('11110'); // 1 - 3 = -2
    expect(binaryToSignedDecimal(sub.result)).toBe(-2);

    const restored = addBinaryFixedWidth('11110', '00011', 5);
    expect(restored.result).toBe('00001'); // -2 + 3 = 1
  });

  it('performs combined left shift on [A, Q]', () => {
    const shifted = leftShiftCombinedAQ('00000', '1101');
    expect(shifted.aAfter).toBe('00001');
    expect(shifted.qAfter).toBe('1010');
    expect(shifted.msbMovedFromQToA).toBe('1');
    expect(shifted.discardedMsbFromA).toBe('0');

    expect(setLeastSignificantBit(shifted.qAfter, '1')).toBe('1011');
    expect(setLeastSignificantBit(shifted.qAfter, '0')).toBe('1010');
  });

  it('validates user inputs and rejects invalid cases with clear error messages', () => {
    expect(validateSimulationInputs('', '3', 4).valid).toBe(false);
    expect(validateSimulationInputs('13', '', 4).valid).toBe(false);
    expect(validateSimulationInputs('abc', '3', 4).valid).toBe(false);
    expect(validateSimulationInputs('13.5', '3', 4).valid).toBe(false);
    expect(validateSimulationInputs('-5', '3', 4).valid).toBe(false);

    const outOfRange = validateSimulationInputs('16', '3', 4);
    expect(outOfRange.valid).toBe(false);
    expect(outOfRange.error).toContain('16 cannot be represented as an unsigned 4-bit number.');
    expect(outOfRange.error).toContain('The valid range is 0 to 15.');

    const divZero = validateSimulationInputs('13', '0', 4);
    expect(divZero.valid).toBe(false);
    expect(divZero.error).toContain('Division by zero is undefined.');
  });

  it('formats binary strings cleanly', () => {
    expect(formatBinary('1101')).toBe('1101');
    expect(formatBinary('00001')).toBe('00001');
    expect(formatBinary('11110000', 4)).toBe('1111 0000');
  });
});
