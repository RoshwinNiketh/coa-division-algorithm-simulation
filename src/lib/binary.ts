import { BitWidth, SignStatus, ValidationResult } from '../types/division';

export const SUPPORTED_BIT_WIDTHS: readonly BitWidth[] = [4, 8, 16] as const;

/**
 * Returns 2^bitWidth as a BigInt without using 32-bit bitwise shift operators.
 */
export function getModulus(bitWidth: number): bigint {
  if (!Number.isInteger(bitWidth) || bitWidth <= 0) {
    throw new Error(`Bit width must be a positive integer, received: ${bitWidth}`);
  }
  return 2n ** BigInt(bitWidth);
}

/**
 * Returns the maximum unsigned value for an n-bit register: 2^n - 1.
 */
export function getMaxUnsignedValue(bitWidth: number): number {
  return Number(getModulus(bitWidth) - 1n);
}

/**
 * Checks whether a numeric value fits in an n-bit unsigned integer (0 to 2^n - 1).
 */
export function isValidUnsignedRange(value: number | bigint, bitWidth: number): boolean {
  if (typeof value === 'number') {
    if (!Number.isInteger(value) || Number.isNaN(value) || !Number.isFinite(value)) {
      return false;
    }
  }
  const bigVal = BigInt(value);
  const maxVal = getModulus(bitWidth) - 1n;
  return bigVal >= 0n && bigVal <= maxVal;
}

/**
 * Validates raw string or numeric inputs for Dividend (Q) and Divisor (M)
 * against the selected bit width. Never silently truncates numbers.
 */
export function validateSimulationInputs(
  dividendRaw: string | number,
  divisorRaw: string | number,
  bitWidth: BitWidth
): ValidationResult {
  const maxVal = getMaxUnsignedValue(bitWidth);
  const dividendStr = String(dividendRaw).trim();
  const divisorStr = String(divisorRaw).trim();

  if (dividendStr === '') {
    return {
      valid: false,
      error: 'Dividend cannot be blank. Please enter an unsigned integer.',
    };
  }

  if (divisorStr === '') {
    return {
      valid: false,
      error: 'Divisor cannot be blank. Please enter an unsigned integer greater than zero.',
    };
  }

  const parseUnsignedCheck = (
    raw: string,
    label: 'Dividend' | 'Divisor'
  ): { ok: true; value: number } | { ok: false; error: string } => {
    if (raw.startsWith('-')) {
      const numericCheck = /^-\d+$/.test(raw);
      if (numericCheck) {
        return {
          ok: false,
          error: `${raw} is negative. This simulator demonstrates unsigned binary division. The valid ${bitWidth}-bit unsigned range is 0 to ${maxVal}.`,
        };
      }
    }

    if (/^[+-]?\d+\.\d+$/.test(raw)) {
      return {
        ok: false,
        error: `${label} (${raw}) must be a whole integer. Fractions and decimals are not supported in integer division registers.`,
      };
    }

    if (!/^\+?\d+$/.test(raw)) {
      return {
        ok: false,
        error: `${label} ("${raw}") is not a valid unsigned integer. Please enter digits only (0 to ${maxVal}).`,
      };
    }

    const valueBig = BigInt(raw);
    if (valueBig < 0n || valueBig > BigInt(maxVal)) {
      return {
        ok: false,
        error: `${raw} cannot be represented as an unsigned ${bitWidth}-bit number.\n\nThe valid range is 0 to ${maxVal}.\nChoose a larger bit width or enter a smaller value.`,
      };
    }

    return { ok: true, value: Number(valueBig) };
  };

  const dividendParsed = parseUnsignedCheck(dividendStr, 'Dividend');
  if (!dividendParsed.ok) {
    return { valid: false, error: dividendParsed.error };
  }

  const divisorParsed = parseUnsignedCheck(divisorStr, 'Divisor');
  if (!divisorParsed.ok) {
    return { valid: false, error: divisorParsed.error };
  }

  if (divisorParsed.value === 0) {
    return {
      valid: false,
      error: 'Division by zero is undefined.\n\nPlease enter a divisor greater than zero.',
    };
  }

  return {
    valid: true,
    dividend: dividendParsed.value,
    divisor: divisorParsed.value,
  };
}

/**
 * Ensures a string is a valid binary string of 0s and 1s.
 */
export function assertValidBinaryString(binary: string): void {
  if (!binary || !/^[01]+$/.test(binary)) {
    throw new Error(`Invalid binary string: "${binary}"`);
  }
}

/**
 * Converts a decimal value (unsigned or signed two's complement) to a fixed-width binary string.
 */
export function decimalToBinary(value: number | bigint, width: number): string {
  if (typeof value === 'number' && (!Number.isInteger(value) || Number.isNaN(value))) {
    throw new Error(`Value must be an integer, received: ${value}`);
  }
  const modulus = getModulus(width);
  const bigVal = BigInt(value);
  const normalized = ((bigVal % modulus) + modulus) % modulus;
  return normalized.toString(2).padStart(width, '0');
}

/**
 * Converts a binary string into an unsigned BigInt.
 */
export function binaryToUnsignedBigInt(binary: string): bigint {
  assertValidBinaryString(binary);
  return BigInt(`0b${binary}`);
}

/**
 * Converts a binary string into an unsigned decimal number.
 */
export function binaryToUnsignedDecimal(binary: string): number {
  return Number(binaryToUnsignedBigInt(binary));
}

/**
 * Interprets a fixed-width binary string as a signed two's-complement BigInt.
 * Used for interpreting register A (which is n + 1 bits wide).
 */
export function binaryToSignedBigInt(binary: string): bigint {
  assertValidBinaryString(binary);
  const width = binary.length;
  const unsigned = binaryToUnsignedBigInt(binary);
  if (binary[0] === '1') {
    return unsigned - getModulus(width);
  }
  return unsigned;
}

/**
 * Interprets a fixed-width binary string as a signed two's-complement decimal number.
 */
export function binaryToSignedDecimal(binary: string): number {
  return Number(binaryToSignedBigInt(binary));
}

/**
 * Detects whether a signed two's-complement binary register (like A) is negative.
 */
export function isNegativeBinary(binary: string): boolean {
  assertValidBinaryString(binary);
  return binary[0] === '1';
}

/**
 * Returns the explicit textual sign status ('NEGATIVE' or 'NON-NEGATIVE').
 */
export function getSignStatus(binary: string): SignStatus {
  return isNegativeBinary(binary) ? 'NEGATIVE' : 'NON-NEGATIVE';
}

/**
 * Zero-extends a binary string on the left to reach targetWidth bits.
 * Used to extend M from n bits to n + 1 bits when operating with A.
 */
export function zeroExtend(binary: string, targetWidth: number): string {
  assertValidBinaryString(binary);
  if (targetWidth < binary.length) {
    throw new Error(
      `Target width (${targetWidth}) cannot be smaller than binary length (${binary.length})`
    );
  }
  return binary.padStart(targetWidth, '0');
}

/**
 * Computes the fixed-width two's complement (-X) of a binary string.
 */
export function twosComplement(binary: string): string {
  assertValidBinaryString(binary);
  const width = binary.length;
  const inverted = binary
    .split('')
    .map((bit) => (bit === '0' ? '1' : '0'))
    .join('');
  return addBinaryFixedWidth(inverted, decimalToBinary(1, width), width).result;
}

/**
 * Performs fixed-width binary addition (A + B) modulo 2^width.
 */
export function addBinaryFixedWidth(
  aBinary: string,
  bBinary: string,
  width: number = aBinary.length
): { result: string; carryOut: boolean } {
  assertValidBinaryString(aBinary);
  assertValidBinaryString(bBinary);
  const aPadded = zeroExtend(aBinary, width);
  const bPadded = zeroExtend(bBinary, width);
  const modulus = getModulus(width);
  const sum = binaryToUnsignedBigInt(aPadded) + binaryToUnsignedBigInt(bPadded);
  const carryOut = sum >= modulus;
  const result = (sum % modulus).toString(2).padStart(width, '0');
  return { result, carryOut };
}

/**
 * Performs fixed-width binary subtraction (A - B) using two's complement addition modulo 2^width.
 */
export function subtractBinaryFixedWidth(
  aBinary: string,
  bBinary: string,
  width: number = aBinary.length
): { result: string; twoComplementB: string } {
  assertValidBinaryString(aBinary);
  assertValidBinaryString(bBinary);
  const aPadded = zeroExtend(aBinary, width);
  const bPadded = zeroExtend(bBinary, width);
  const twoComplementB = twosComplement(bPadded);
  const { result } = addBinaryFixedWidth(aPadded, twoComplementB, width);
  return { result, twoComplementB };
}

/**
 * Left-shifts the combined [A, Q] register by 1 bit position:
 * - A shifts left by 1 bit; its MSB is discarded and its LSB receives Q's MSB.
 * - Q shifts left by 1 bit; its LSB (Q₀) becomes 0 as a placeholder awaiting the quotient-bit decision.
 */
export function leftShiftCombinedAQ(
  aBinary: string,
  qBinary: string
): {
  aAfter: string;
  qAfter: string;
  msbMovedFromQToA: string;
  discardedMsbFromA: string;
} {
  assertValidBinaryString(aBinary);
  assertValidBinaryString(qBinary);
  const discardedMsbFromA = aBinary[0];
  const msbMovedFromQToA = qBinary[0];
  const aAfter = aBinary.slice(1) + msbMovedFromQToA;
  const qAfter = qBinary.slice(1) + '0';
  return {
    aAfter,
    qAfter,
    msbMovedFromQToA,
    discardedMsbFromA,
  };
}

/**
 * Sets the least-significant bit (Q₀) of register Q to '0' or '1'.
 */
export function setLeastSignificantBit(binary: string, bit: '0' | '1'): string {
  assertValidBinaryString(binary);
  return binary.slice(0, -1) + bit;
}

/**
 * Formats a binary string into spaced groups of `groupSize` bits from the right
 * for improved readability on wider bit widths (e.g. 8-bit or 16-bit), or returns as-is if short.
 */
export function formatBinary(binary: string, groupSize: number = 4): string {
  assertValidBinaryString(binary);
  if (binary.length <= 5 || groupSize <= 0) {
    return binary;
  }
  const groups: string[] = [];
  for (let i = binary.length; i > 0; i -= groupSize) {
    const start = Math.max(0, i - groupSize);
    groups.unshift(binary.slice(start, i));
  }
  return groups.join(' ');
}
