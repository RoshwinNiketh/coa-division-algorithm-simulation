export type BitWidth = 4 | 8 | 16;

export type DivisionAlgorithm = 'restoring' | 'non-restoring';

export type SignStatus = 'NEGATIVE' | 'NON-NEGATIVE';

export type MicroStepPhase =
  | 'before-cycle'
  | 'inspect-a'
  | 'shift'
  | 'arithmetic'
  | 'sign-check-and-decision'
  | 'determine-q0'
  | 'end-cycle'
  | 'final-correction';

export interface ShiftDetails {
  aBefore: string;
  qBefore: string;
  aAfter: string;
  qAfter: string;
  msbMovedFromQToA: string;
  discardedMsbFromA: string;
  explanation: string;
}

export interface BinaryArithmeticDetails {
  operation: 'SUBTRACT' | 'ADD' | 'RESTORE';
  labelTop: string;
  topBinary: string;
  topSignedDecimal: number;
  operatorSymbol: '-' | '+';
  labelBottom: string;
  bottomBinary: string;
  bottomDecimal: number;
  twoComplementAddend?: string;
  labelResult: string;
  resultBinary: string;
  resultSignedDecimal: number;
  explanation: string;
}

export interface MicroStep {
  stepIndex: number;
  cycle: number; // 1..n, or n+1 for final correction step
  totalCycles: number;
  stepNumberInCycle: number;
  totalStepsInCycle: number;
  phase: MicroStepPhase;
  title: string;
  A: string;
  ASignedDecimal: number;
  Q: string;
  QUnsignedDecimal: number;
  M: string; // n-bit
  MExtended: string; // (n+1)-bit
  MDecimal: number;
  Q0: '0' | '1' | null;
  count: number;
  signStatus: SignStatus;
  explanation: string;
  bulletPoints?: string[];
  shiftDetails?: ShiftDetails;
  primaryArithmetic?: BinaryArithmeticDetails;
  secondaryArithmetic?: BinaryArithmeticDetails; // e.g., restoration A = A + M in Restoring Step 4
  highlightRegister?: 'A' | 'Q' | 'AQ' | 'M' | 'COUNT' | 'NONE';
  highlightQ0?: boolean;
  highlightSignBit?: boolean;
  restored?: boolean;
}

export interface RestoringCycleTrace {
  cycle: number;
  aBefore: string;
  qBefore: string;
  afterShiftA: string;
  afterShiftQ: string;
  aMinusM: string;
  aMinusMSigned: number;
  sign: SignStatus;
  q0: '0' | '1';
  restored: boolean;
  aFinal: string;
  qFinal: string;
  countAfter: number;
}

export interface NonRestoringCycleTrace {
  cycle: number;
  aBefore: string;
  qBefore: string;
  previousSign: SignStatus;
  operation: 'A = A - M' | 'A = A + M';
  afterShiftA: string;
  afterShiftQ: string;
  aAfterArithmetic: string;
  aAfterArithmeticSigned: number;
  afterArithmeticSign: SignStatus;
  q0: '0' | '1';
  aFinal: string;
  qFinal: string;
  countAfter: number;
}

export interface FinalCorrectionTrace {
  needed: boolean;
  aBeforeCorrection: string;
  aBeforeCorrectionSigned: number;
  mExtended: string;
  aAfterCorrection: string;
  aAfterCorrectionSigned: number;
  explanation: string;
}

export interface VerificationResult {
  dividend: number;
  divisor: number;
  quotient: number;
  remainder: number;
  reconstructedDividend: number;
  equation: string;
  isEquationValid: boolean;
  isRemainderInRange: boolean;
  isVerified: boolean;
}

export interface DivisionSimulationResult {
  algorithm: DivisionAlgorithm;
  bitWidth: BitWidth;
  aBitWidth: number;
  dividend: number;
  divisor: number;
  initialA: string;
  initialQ: string;
  divisorBinary: string; // n-bit
  divisorExtendedBinary: string; // (n+1)-bit
  quotientDecimal: number;
  quotientBinary: string; // n-bit
  remainderDecimal: number;
  remainderBinary: string; // (n+1)-bit
  remainderNBitBinary: string; // n-bit
  microSteps: MicroStep[];
  restoringCycles?: RestoringCycleTrace[];
  nonRestoringCycles?: NonRestoringCycleTrace[];
  finalCorrection?: FinalCorrectionTrace;
  verification: VerificationResult;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  dividend?: number;
  divisor?: number;
}
