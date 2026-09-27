import {
  BitWidth,
  DivisionSimulationResult,
  MicroStep,
  RestoringCycleTrace,
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
 * Simulates the unsigned Restoring Division Algorithm for n-bit operands.
 *
 * Registers:
 * - A: (n + 1)-bit Accumulator / Partial Remainder (initialized to 0)
 * - Q: n-bit Dividend / Quotient Register (initialized to Dividend)
 * - M: n-bit Divisor Register (extended to n + 1 bits for arithmetic with A)
 * - Count: initialized to n
 */
export function simulateRestoringDivision(
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
  const restoringCycles: RestoringCycleTrace[] = [];
  let stepIndex = 0;

  for (let cycle = 1; cycle <= bitWidth; cycle++) {
    const aBefore = currentA;
    const qBefore = currentQ;
    const countBefore = currentCount;
    const aSignedBefore = binaryToSignedDecimal(aBefore);

    // Micro-step 1: Before the iteration
    microSteps.push({
      stepIndex: stepIndex++,
      cycle,
      totalCycles: bitWidth,
      stepNumberInCycle: 1,
      totalStepsInCycle: 5,
      phase: 'before-cycle',
      title: `Step 1 — Before the Iteration`,
      A: aBefore,
      ASignedDecimal: aSignedBefore,
      Q: qBefore,
      QUnsignedDecimal: binaryToUnsignedDecimal(qBefore),
      M: divisorBinary,
      MExtended: divisorExtendedBinary,
      MDecimal: divisor,
      Q0: null,
      count: countBefore,
      signStatus: getSignStatus(aBefore),
      explanation: `We begin this cycle with the current partial remainder in A (${aBefore}₂ = ${aSignedBefore}₁₀) and the current dividend/quotient bits in Q (${qBefore}₂).`,
      bulletPoints: [
        `Accumulator A holds ${aBefore} (${aBitWidth} bits, signed value ${aSignedBefore}).`,
        `Register Q holds ${qBefore} (${bitWidth} bits).`,
        `Divisor M is ${divisorBinary} (extended to ${aBitWidth} bits as ${divisorExtendedBinary} = ${divisor}₁₀).`,
        `Count is ${countBefore} (${countBefore} ${countBefore === 1 ? 'cycle remains' : 'cycles remain'}).`,
      ],
      highlightRegister: 'NONE',
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
        `Q shifts left: ${qBefore} → ${afterShiftQ} (vacating the least-significant bit Q₀ for this cycle's quotient decision).`,
      ],
      shiftDetails: {
        aBefore,
        qBefore,
        aAfter: afterShiftA,
        qAfter: afterShiftQ,
        msbMovedFromQToA,
        discardedMsbFromA,
        explanation: `Combined register [A, Q] shifts 1 bit left. Q's MSB (${msbMovedFromQToA}) crosses into A's LSB, leaving Q₀ ready to be set.`,
      },
      highlightRegister: 'AQ',
    });

    // Micro-step 3: Subtract M (A = A - M)
    const subResult = subtractBinaryFixedWidth(afterShiftA, divisorExtendedBinary, aBitWidth);
    const aMinusM = subResult.result;
    const aMinusMSigned = binaryToSignedDecimal(aMinusM);
    const signAfterSub = getSignStatus(aMinusM);

    microSteps.push({
      stepIndex: stepIndex++,
      cycle,
      totalCycles: bitWidth,
      stepNumberInCycle: 3,
      totalStepsInCycle: 5,
      phase: 'arithmetic',
      title: `Step 3 — Subtract M`,
      A: aMinusM,
      ASignedDecimal: aMinusMSigned,
      Q: afterShiftQ,
      QUnsignedDecimal: binaryToUnsignedDecimal(afterShiftQ),
      M: divisorBinary,
      MExtended: divisorExtendedBinary,
      MDecimal: divisor,
      Q0: null,
      count: countBefore,
      signStatus: signAfterSub,
      explanation: `We subtract the divisor from the partial remainder (A = A - M) to determine whether the divisor fits into the current partial dividend.`,
      bulletPoints: [
        `A before subtraction: ${afterShiftA}₂`,
        `Subtract M (extended to ${aBitWidth} bits): - ${divisorExtendedBinary}₂ (${divisor}₁₀)`,
        `Two's complement of M added to A: + ${subResult.twoComplementB}₂`,
        `A after subtraction: ${aMinusM}₂ (${aMinusMSigned}₁₀, ${signAfterSub})`,
      ],
      primaryArithmetic: {
        operation: 'SUBTRACT',
        labelTop: 'A before',
        topBinary: afterShiftA,
        topSignedDecimal: afterShiftASigned,
        operatorSymbol: '-',
        labelBottom: 'M',
        bottomBinary: divisorExtendedBinary,
        bottomDecimal: divisor,
        twoComplementAddend: subResult.twoComplementB,
        labelResult: 'A after subtraction',
        resultBinary: aMinusM,
        resultSignedDecimal: aMinusMSigned,
        explanation: `Subtracting M (${divisorExtendedBinary}₂) from shifted A (${afterShiftA}₂) produces ${aMinusM}₂ (${aMinusMSigned}₁₀).`,
      },
      highlightRegister: 'A',
      highlightSignBit: true,
    });

    // Micro-step 4: Check Sign of A (and Restore if Negative)
    const isNeg = isNegativeBinary(aMinusM);
    let q0: '0' | '1';
    let aFinal: string;
    let restored: boolean;

    if (isNeg) {
      q0 = '0';
      restored = true;
      const restoreAdd = addBinaryFixedWidth(aMinusM, divisorExtendedBinary, aBitWidth);
      aFinal = restoreAdd.result;
      const qFinal = setLeastSignificantBit(afterShiftQ, q0);
      const aFinalSigned = binaryToSignedDecimal(aFinal);

      microSteps.push({
        stepIndex: stepIndex++,
        cycle,
        totalCycles: bitWidth,
        stepNumberInCycle: 4,
        totalStepsInCycle: 5,
        phase: 'sign-check-and-decision',
        title: `Step 4 — Check Sign of A & Restore`,
        A: aFinal,
        ASignedDecimal: aFinalSigned,
        Q: qFinal,
        QUnsignedDecimal: binaryToUnsignedDecimal(qFinal),
        M: divisorBinary,
        MExtended: divisorExtendedBinary,
        MDecimal: divisor,
        Q0: q0,
        count: countBefore,
        signStatus: 'NEGATIVE',
        explanation: `The result became negative (A = ${aMinusM}₂ = ${aMinusMSigned}₁₀, MSB = 1). This means the divisor did not fit into the current partial dividend. Therefore Q₀ = 0. Because this is Restoring Division, we undo the unsuccessful subtraction by adding M back to A (A = A + M = ${aFinal}₂), which restores the previous valid partial remainder.`,
        bulletPoints: [
          `Sign check on A (${aMinusM}₂): MSB is 1 → A < 0 (NEGATIVE).`,
          `Set least-significant quotient bit Q₀ = 0 → Q becomes ${qFinal}.`,
          `Restore A: A = A + M = ${aMinusM} + ${divisorExtendedBinary} = ${aFinal} (${aFinalSigned}₁₀).`,
        ],
        primaryArithmetic: {
          operation: 'RESTORE',
          labelTop: 'A (negative)',
          topBinary: aMinusM,
          topSignedDecimal: aMinusMSigned,
          operatorSymbol: '+',
          labelBottom: '+M (restore)',
          bottomBinary: divisorExtendedBinary,
          bottomDecimal: divisor,
          labelResult: 'Restored A',
          resultBinary: aFinal,
          resultSignedDecimal: aFinalSigned,
          explanation: `Because A < 0 after subtraction, we immediately restore A by adding M (${divisorExtendedBinary}₂) back to obtain ${aFinal}₂.`,
        },
        highlightRegister: 'AQ',
        highlightQ0: true,
        highlightSignBit: true,
        restored: true,
      });

      currentA = aFinal;
      currentQ = qFinal;
    } else {
      q0 = '1';
      restored = false;
      aFinal = aMinusM;
      const qFinal = setLeastSignificantBit(afterShiftQ, q0);
      const aFinalSigned = binaryToSignedDecimal(aFinal);

      microSteps.push({
        stepIndex: stepIndex++,
        cycle,
        totalCycles: bitWidth,
        stepNumberInCycle: 4,
        totalStepsInCycle: 5,
        phase: 'sign-check-and-decision',
        title: `Step 4 — Check Sign of A & Set Q₀`,
        A: aFinal,
        ASignedDecimal: aFinalSigned,
        Q: qFinal,
        QUnsignedDecimal: binaryToUnsignedDecimal(qFinal),
        M: divisorBinary,
        MExtended: divisorExtendedBinary,
        MDecimal: divisor,
        Q0: q0,
        count: countBefore,
        signStatus: 'NON-NEGATIVE',
        explanation: `The subtraction succeeded (A = ${aMinusM}₂ = ${aMinusMSigned}₁₀ ≥ 0, MSB = 0), so the divisor fits into the current partial dividend. Therefore Q₀ = 1 and A remains unchanged without restoration.`,
        bulletPoints: [
          `Sign check on A (${aMinusM}₂): MSB is 0 → A ≥ 0 (NON-NEGATIVE).`,
          `Set least-significant quotient bit Q₀ = 1 → Q becomes ${qFinal}.`,
          `No restoration needed; A stays ${aFinal} (${aFinalSigned}₁₀).`,
        ],
        highlightRegister: 'Q',
        highlightQ0: true,
        highlightSignBit: true,
        restored: false,
      });

      currentA = aFinal;
      currentQ = qFinal;
    }

    // Micro-step 5: End Cycle
    const countAfter = countBefore - 1;
    currentCount = countAfter;
    const aFinalSigned = binaryToSignedDecimal(currentA);

    microSteps.push({
      stepIndex: stepIndex++,
      cycle,
      totalCycles: bitWidth,
      stepNumberInCycle: 5,
      totalStepsInCycle: 5,
      phase: 'end-cycle',
      title: `Step 5 — End Cycle`,
      A: currentA,
      ASignedDecimal: aFinalSigned,
      Q: currentQ,
      QUnsignedDecimal: binaryToUnsignedDecimal(currentQ),
      M: divisorBinary,
      MExtended: divisorExtendedBinary,
      MDecimal: divisor,
      Q0: q0,
      count: countAfter,
      signStatus: getSignStatus(currentA),
      explanation: `Cycle ${cycle} ends with A = ${currentA}₂ (${aFinalSigned}₁₀), Q = ${currentQ}₂ (Q₀ = ${q0}), and Count decremented by 1 to ${countAfter}.${
        countAfter === 0
          ? ' Count has reached 0, completing all iterations of Restoring Division!'
          : ''
      }`,
      bulletPoints: [
        `Updated A = ${currentA} (${aFinalSigned}₁₀)`,
        `Updated Q = ${currentQ} (with Q₀ = ${q0})`,
        `Count decremented: ${countBefore} - 1 = ${countAfter}`,
      ],
      highlightRegister: 'COUNT',
      highlightQ0: true,
      restored,
    });

    restoringCycles.push({
      cycle,
      aBefore,
      qBefore,
      afterShiftA,
      afterShiftQ,
      aMinusM,
      aMinusMSigned,
      sign: signAfterSub,
      q0,
      restored,
      aFinal: currentA,
      qFinal: currentQ,
      countAfter,
    });
  }

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
    algorithm: 'restoring',
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
    restoringCycles,
    verification,
  };
}
