import {
  BitWidth,
  DivisionSimulationResult,
  FinalCorrectionTrace,
  MicroStep,
  NonRestoringCycleTrace,
  VerificationResult,
} from '../types/division';
import {
  addBinaryFixedWidth,
  binaryToSignedDecimal,
  binaryToUnsignedDecimal,
  decimalToBinary,
  getSignStatus,
  isNegativeBinary,
  leftShiftCombinedAQ,
  setLeastSignificantBit,
  subtractBinaryFixedWidth,
  validateSimulationInputs,
  zeroExtend,
} from './binary';

/**
 * Simulates the unsigned Non-Restoring Division Algorithm for n-bit operands.
 *
 * Registers:
 * - A: (n + 1)-bit signed two's-complement Accumulator / Partial Remainder (initialized to 0)
 * - Q: n-bit Dividend / Quotient Register (initialized to Dividend)
 * - M: n-bit Divisor Register (extended to n + 1 bits for arithmetic with A)
 * - Count: initialized to n
 */
export function simulateNonRestoringDivision(
  dividend: number,
  divisor: number,
  bitWidth: BitWidth = 4
): DivisionSimulationResult {
  const validation = validateSimulationInputs(dividend, divisor, bitWidth);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const aBitWidth = bitWidth + 1;
  const initialA = decimalToBinary(0, aBitWidth);
  const initialQ = decimalToBinary(dividend, bitWidth);
  const divisorBinary = decimalToBinary(divisor, bitWidth);
  const divisorExtendedBinary = zeroExtend(divisorBinary, aBitWidth);

  let currentA = initialA;
  let currentQ = initialQ;
  let currentCount: number = bitWidth;

  const microSteps: MicroStep[] = [];
  const nonRestoringCycles: NonRestoringCycleTrace[] = [];
  let stepIndex = 0;

  for (let cycle = 1; cycle <= bitWidth; cycle++) {
    const aBefore = currentA;
    const qBefore = currentQ;
    const countBefore = currentCount;
    const aBeforeSigned = binaryToSignedDecimal(aBefore);
    const previousSign = getSignStatus(aBefore);
    const isPrevNegative = isNegativeBinary(aBefore);
    const plannedOperation: 'A = A - M' | 'A = A + M' = isPrevNegative
      ? 'A = A + M'
      : 'A = A - M';

    // Micro-step 1: Inspect A
    microSteps.push({
      stepIndex: stepIndex++,
      cycle,
      totalCycles: bitWidth,
      stepNumberInCycle: 1,
      totalStepsInCycle: 5,
      phase: 'inspect-a',
      title: `Step 1 — Inspect Sign of A`,
      A: aBefore,
      ASignedDecimal: aBeforeSigned,
      Q: qBefore,
      QUnsignedDecimal: binaryToUnsignedDecimal(qBefore),
      M: divisorBinary,
      MExtended: divisorExtendedBinary,
      MDecimal: divisor,
      Q0: null,
      count: countBefore,
      signStatus: previousSign,
      explanation: isPrevNegative
        ? `The previous partial remainder is negative (A = ${aBefore}₂ = ${aBeforeSigned}₁₀, MSB = 1). Instead of restoring it immediately, Non-Restoring Division compensates during this cycle by adding the divisor (${plannedOperation}) after shifting.`
        : `The current partial remainder is non-negative (A = ${aBefore}₂ = ${aBeforeSigned}₁₀, MSB = 0), so after shifting we attempt subtraction (${plannedOperation}).`,
      bulletPoints: [
        `Inspect A before shift: ${aBefore}₂ (${aBeforeSigned}₁₀) → ${previousSign} (MSB = ${aBefore[0]}).`,
        `Selected arithmetic operation for this cycle: ${plannedOperation}.`,
        `Count is ${countBefore}.`,
      ],
      highlightRegister: 'A',
      highlightSignBit: true,
    });

    // Micro-step 2: Left Shift [A, Q]
    const shiftResult = leftShiftCombinedAQ(aBefore, qBefore);
    const { aAfter: afterShiftA, qAfter: afterShiftQ, msbMovedFromQToA, discardedMsbFromA } =
      shiftResult;
    const afterShiftASigned = binaryToSignedDecimal(afterShiftA);

    microSteps.push({
      stepIndex: stepIndex++,
      cycle,
      totalCycles: bitWidth,
      stepNumberInCycle: 2,
      totalStepsInCycle: 5,
      phase: 'shift',
      title: `Step 2 — Left Shift [A, Q]`,
      A: afterShiftA,
      ASignedDecimal: afterShiftASigned,
      Q: afterShiftQ,
      QUnsignedDecimal: binaryToUnsignedDecimal(afterShiftQ),
      M: divisorBinary,
      MExtended: divisorExtendedBinary,
      MDecimal: divisor,
      Q0: null,
      count: countBefore,
      signStatus: getSignStatus(afterShiftA),
      explanation: `A and Q behave like one combined shift register. The most-significant bit of Q (${msbMovedFromQToA}) moves into A's least-significant position while every other bit moves one position to the left.`,
      bulletPoints: [
        `A shifts left: ${aBefore} → ${afterShiftA} (receiving MSB '${msbMovedFromQToA}' from Q).`,
        `Q shifts left: ${qBefore} → ${afterShiftQ} (leaving Q₀ ready to be determined after arithmetic).`,
      ],
      shiftDetails: {
        aBefore,
        qBefore,
        aAfter: afterShiftA,
        qAfter: afterShiftQ,
        msbMovedFromQToA,
        discardedMsbFromA,
        explanation: `Combined register [A, Q] shifts 1 bit left. Q's MSB (${msbMovedFromQToA}) moves into A's LSB.`,
      },
      highlightRegister: 'AQ',
    });

    // Micro-step 3: Arithmetic (A = A - M if previous A >= 0, else A = A + M)
    let aAfterArithmetic: string;
    let twoComplementAddend: string | undefined;

    if (!isPrevNegative) {
      const subRes = subtractBinaryFixedWidth(afterShiftA, divisorExtendedBinary, aBitWidth);
      aAfterArithmetic = subRes.result;
      twoComplementAddend = subRes.twoComplementB;
    } else {
      const addRes = addBinaryFixedWidth(afterShiftA, divisorExtendedBinary, aBitWidth);
      aAfterArithmetic = addRes.result;
    }

    const aAfterArithmeticSigned = binaryToSignedDecimal(aAfterArithmetic);
    const afterArithmeticSign = getSignStatus(aAfterArithmetic);

    microSteps.push({
      stepIndex: stepIndex++,
      cycle,
      totalCycles: bitWidth,
      stepNumberInCycle: 3,
      totalStepsInCycle: 5,
      phase: 'arithmetic',
      title: isPrevNegative ? `Step 3 — Add M (A = A + M)` : `Step 3 — Subtract M (A = A - M)`,
      A: aAfterArithmetic,
      ASignedDecimal: aAfterArithmeticSigned,
      Q: afterShiftQ,
      QUnsignedDecimal: binaryToUnsignedDecimal(afterShiftQ),
      M: divisorBinary,
      MExtended: divisorExtendedBinary,
      MDecimal: divisor,
      Q0: null,
      count: countBefore,
      signStatus: afterArithmeticSign,
      explanation: isPrevNegative
        ? `Because A was negative before this cycle, we add M to the shifted partial remainder (A = A + M) to compensate for the previous over-subtraction.`
        : `Because A was non-negative before this cycle, we subtract M from the shifted partial remainder (A = A - M).`,
      bulletPoints: [
        `A after shift: ${afterShiftA}₂`,
        isPrevNegative
          ? `Add divisor M: + ${divisorExtendedBinary}₂ (${divisor}₁₀)`
          : `Subtract divisor M: - ${divisorExtendedBinary}₂ (${divisor}₁₀, two's complement + ${twoComplementAddend}₂)`,
        `Resulting A: ${aAfterArithmetic}₂ (${aAfterArithmeticSigned}₁₀, ${afterArithmeticSign})`,
      ],
      primaryArithmetic: {
        operation: isPrevNegative ? 'ADD' : 'SUBTRACT',
        labelTop: 'A (after shift)',
        topBinary: afterShiftA,
        topSignedDecimal: afterShiftASigned,
        operatorSymbol: isPrevNegative ? '+' : '-',
        labelBottom: isPrevNegative ? '+M' : 'M',
        bottomBinary: divisorExtendedBinary,
        bottomDecimal: divisor,
        twoComplementAddend,
        labelResult: isPrevNegative ? 'A + M' : 'A - M',
        resultBinary: aAfterArithmetic,
        resultSignedDecimal: aAfterArithmeticSigned,
        explanation: isPrevNegative
          ? `Adding M (${divisorExtendedBinary}₂) to shifted A (${afterShiftA}₂) produces ${aAfterArithmetic}₂ (${aAfterArithmeticSigned}₁₀).`
          : `Subtracting M (${divisorExtendedBinary}₂) from shifted A (${afterShiftA}₂) produces ${aAfterArithmetic}₂ (${aAfterArithmeticSigned}₁₀).`,
      },
      highlightRegister: 'A',
      highlightSignBit: true,
    });

    // Micro-step 4: Determine Q₀
    const isAfterNeg = isNegativeBinary(aAfterArithmetic);
    const q0: '0' | '1' = isAfterNeg ? '0' : '1';
    const qFinal = setLeastSignificantBit(afterShiftQ, q0);

    microSteps.push({
      stepIndex: stepIndex++,
      cycle,
      totalCycles: bitWidth,
      stepNumberInCycle: 4,
      totalStepsInCycle: 5,
      phase: 'determine-q0',
      title: `Step 4 — Determine Q₀`,
      A: aAfterArithmetic,
      ASignedDecimal: aAfterArithmeticSigned,
      Q: qFinal,
      QUnsignedDecimal: binaryToUnsignedDecimal(qFinal),
      M: divisorBinary,
      MExtended: divisorExtendedBinary,
      MDecimal: divisor,
      Q0: q0,
      count: countBefore,
      signStatus: afterArithmeticSign,
      explanation: isAfterNeg
        ? `After arithmetic, A is negative (${aAfterArithmetic}₂ = ${aAfterArithmeticSigned}₁₀ < 0, MSB = 1). Therefore we set Q₀ = 0, indicating the current partial dividend is still smaller than the multiple of M tested. Unlike Restoring Division, we keep this negative A for the next cycle.`
        : `After arithmetic, A is non-negative (${aAfterArithmetic}₂ = ${aAfterArithmeticSigned}₁₀ ≥ 0, MSB = 0). Therefore we set Q₀ = 1, indicating the divisor fits into the current partial dividend.`,
      bulletPoints: [
        `Sign of A (${aAfterArithmetic}₂): MSB is ${aAfterArithmetic[0]} (${afterArithmeticSign}).`,
        `Decision rule: ${isAfterNeg ? 'A < 0 → Q₀ = 0' : 'A ≥ 0 → Q₀ = 1'}.`,
        `Register Q becomes ${qFinal}₂.`,
      ],
      highlightRegister: 'Q',
      highlightQ0: true,
      highlightSignBit: true,
    });

    // Micro-step 5: End Cycle
    const countAfter = countBefore - 1;
    currentA = aAfterArithmetic;
    currentQ = qFinal;
    currentCount = countAfter;

    microSteps.push({
      stepIndex: stepIndex++,
      cycle,
      totalCycles: bitWidth,
      stepNumberInCycle: 5,
      totalStepsInCycle: 5,
      phase: 'end-cycle',
      title: `Step 5 — End Cycle`,
      A: currentA,
      ASignedDecimal: aAfterArithmeticSigned,
      Q: currentQ,
      QUnsignedDecimal: binaryToUnsignedDecimal(currentQ),
      M: divisorBinary,
      MExtended: divisorExtendedBinary,
      MDecimal: divisor,
      Q0: q0,
      count: countAfter,
      signStatus: afterArithmeticSign,
      explanation: `Cycle ${cycle} completes with A = ${currentA}₂ (${aAfterArithmeticSigned}₁₀), Q = ${currentQ}₂ (Q₀ = ${q0}), and Count decremented to ${countAfter}.${
        countAfter === 0
          ? ' All n cycles are complete. Next, we check whether A requires a final remainder correction.'
          : ''
      }`,
      bulletPoints: [
        `A at end of cycle: ${currentA}₂ (${aAfterArithmeticSigned}₁₀)`,
        `Q at end of cycle: ${currentQ}₂ (Q₀ = ${q0})`,
        `Count decremented: ${countBefore} - 1 = ${countAfter}`,
      ],
      highlightRegister: 'COUNT',
      highlightQ0: true,
    });

    nonRestoringCycles.push({
      cycle,
      aBefore,
      qBefore,
      previousSign,
      operation: plannedOperation,
      afterShiftA,
      afterShiftQ,
      aAfterArithmetic,
      aAfterArithmeticSigned,
      afterArithmeticSign,
      q0,
      aFinal: currentA,
      qFinal: currentQ,
      countAfter,
    });
  }

  // Final Correction Step (Section 14)
  const aBeforeCorrection = currentA;
  const aBeforeCorrectionSigned = binaryToSignedDecimal(aBeforeCorrection);
  const needsFinalCorrection = isNegativeBinary(aBeforeCorrection);

  let aAfterCorrection = aBeforeCorrection;
  if (needsFinalCorrection) {
    aAfterCorrection = addBinaryFixedWidth(
      aBeforeCorrection,
      divisorExtendedBinary,
      aBitWidth
    ).result;
  }
  const aAfterCorrectionSigned = binaryToSignedDecimal(aAfterCorrection);

  const finalCorrectionExplanation = needsFinalCorrection
    ? `Non-Restoring Division allows A to remain negative between iterations. If the final partial remainder is still negative after the last cycle (A = ${aBeforeCorrection}₂ = ${aBeforeCorrectionSigned}₁₀ < 0), one final addition of M (A = A + M = ${aAfterCorrection}₂ = ${aAfterCorrectionSigned}₁₀) converts it into the correct non-negative remainder.`
    : `No final correction is required because A (${aBeforeCorrection}₂ = ${aBeforeCorrectionSigned}₁₀) is already non-negative after all ${bitWidth} iterations.`;

  microSteps.push({
    stepIndex: stepIndex++,
    cycle: bitWidth + 1,
    totalCycles: bitWidth,
    stepNumberInCycle: 1,
    totalStepsInCycle: 1,
    phase: 'final-correction',
    title: needsFinalCorrection
      ? `Final Correction — Restore Negative Remainder (A = A + M)`
      : `Final Check — Remainder Already Non-Negative`,
    A: aAfterCorrection,
    ASignedDecimal: aAfterCorrectionSigned,
    Q: currentQ,
    QUnsignedDecimal: binaryToUnsignedDecimal(currentQ),
    M: divisorBinary,
    MExtended: divisorExtendedBinary,
    MDecimal: divisor,
    Q0: (currentQ[currentQ.length - 1] as '0' | '1') ?? null,
    count: 0,
    signStatus: getSignStatus(aAfterCorrection),
    explanation: finalCorrectionExplanation,
    bulletPoints: needsFinalCorrection
      ? [
          `A after ${bitWidth} cycles is ${aBeforeCorrection}₂ (${aBeforeCorrectionSigned}₁₀), which is NEGATIVE (MSB = 1).`,
          `Add M one final time: ${aBeforeCorrection} + ${divisorExtendedBinary} = ${aAfterCorrection} (${aAfterCorrectionSigned}₁₀).`,
          `Final Remainder = ${aAfterCorrection}₂ (${aAfterCorrectionSigned}₁₀), Final Quotient = ${currentQ}₂ (${binaryToUnsignedDecimal(currentQ)}₁₀).`,
        ]
      : [
          `A after ${bitWidth} cycles is ${aBeforeCorrection}₂ (${aBeforeCorrectionSigned}₁₀), which is NON-NEGATIVE (MSB = 0).`,
          `No final addition of M is needed.`,
          `Final Remainder = ${aAfterCorrection}₂ (${aAfterCorrectionSigned}₁₀), Final Quotient = ${currentQ}₂ (${binaryToUnsignedDecimal(currentQ)}₁₀).`,
        ],
    primaryArithmetic: needsFinalCorrection
      ? {
          operation: 'RESTORE',
          labelTop: 'A (after cycle n)',
          topBinary: aBeforeCorrection,
          topSignedDecimal: aBeforeCorrectionSigned,
          operatorSymbol: '+',
          labelBottom: '+M (final correction)',
          bottomBinary: divisorExtendedBinary,
          bottomDecimal: divisor,
          labelResult: 'Corrected A',
          resultBinary: aAfterCorrection,
          resultSignedDecimal: aAfterCorrectionSigned,
          explanation: `Final correction adds M (${divisorExtendedBinary}₂) to negative A (${aBeforeCorrection}₂) to produce the true non-negative remainder ${aAfterCorrection}₂ (${aAfterCorrectionSigned}₁₀).`,
        }
      : undefined,
    highlightRegister: 'A',
    highlightSignBit: true,
    restored: needsFinalCorrection,
  });

  const finalCorrection: FinalCorrectionTrace = {
    needed: needsFinalCorrection,
    aBeforeCorrection,
    aBeforeCorrectionSigned,
    mExtended: divisorExtendedBinary,
    aAfterCorrection,
    aAfterCorrectionSigned,
    explanation: finalCorrectionExplanation,
  };

  currentA = aAfterCorrection;

  const quotientBinary = currentQ;
  const quotientDecimal = binaryToUnsignedDecimal(quotientBinary);
  const remainderBinary = currentA;
  const remainderDecimal = binaryToUnsignedDecimal(remainderBinary);
  const remainderNBitBinary = remainderBinary.slice(1);

  const reconstructedDividend = divisor * quotientDecimal + remainderDecimal;
  const isEquationValid = reconstructedDividend === dividend;
  const isRemainderInRange = remainderDecimal >= 0 && remainderDecimal < divisor;

  const verification: VerificationResult = {
    dividend,
    divisor,
    quotient: quotientDecimal,
    remainder: remainderDecimal,
    reconstructedDividend,
    equation: `${dividend} = (${divisor} × ${quotientDecimal}) + ${remainderDecimal}`,
    isEquationValid,
    isRemainderInRange,
    isVerified: isEquationValid && isRemainderInRange,
  };

  return {
    algorithm: 'non-restoring',
    bitWidth,
    aBitWidth,
    dividend,
    divisor,
    initialA,
    initialQ,
    divisorBinary,
    divisorExtendedBinary,
    quotientDecimal,
    quotientBinary,
    remainderDecimal,
    remainderBinary,
    remainderNBitBinary,
    microSteps,
    nonRestoringCycles,
    finalCorrection,
    verification,
  };
}
