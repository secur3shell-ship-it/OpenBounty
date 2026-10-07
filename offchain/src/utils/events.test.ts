import { describe, expect, it } from 'vitest';
import { programDataLogs } from './events';

const OURS = 'HTvHgRG4uHnj1KQeynNXsKEvBE3oqsc9TxRaGTgqgEk4';
const OTHER = 'Attacker1111111111111111111111111111111111';
const SYSTEM = '11111111111111111111111111111111';

describe('programDataLogs', () => {
  it('keeps the events our program wrote, also around its CPIs', () => {
    const logs = [
      `Program ${OURS} invoke [1]`,
      'Program log: Instruction: ClaimPrize',
      `Program ${SYSTEM} invoke [2]`,
      `Program ${SYSTEM} success`,
      'Program data: AAAA',
      `Program ${OURS} consumed 9000 of 200000 compute units`,
      `Program ${OURS} success`,
    ];
    expect(programDataLogs(logs, OURS)).toEqual(['AAAA']);
  });

  it('ignores the same line written by another program', () => {
    const logs = [`Program ${OTHER} invoke [1]`, 'Program data: AAAA', `Program ${OTHER} success`];
    expect(programDataLogs(logs, OURS)).toEqual([]);
  });

  it('ignores another program called by ours, and a failed call', () => {
    const logs = [
      `Program ${OURS} invoke [1]`,
      `Program ${OTHER} invoke [2]`,
      'Program data: BBBB',
      `Program ${OTHER} failed: custom program error: 0x1`,
      'Program data: CCCC',
      `Program ${OURS} success`,
    ];
    expect(programDataLogs(logs, OURS)).toEqual(['CCCC']);
  });
});
