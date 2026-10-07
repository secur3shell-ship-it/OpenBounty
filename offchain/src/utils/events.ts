// Anchor events reach the logs as "Program data: <base64>" lines, but any
// program can write such a line. Only lines written while `programId` itself
// is running (top of the invoke stack) are its events.

const INVOKE = / invoke \[\d+\]$/;
const DATA_PREFIX = 'Program data: ';

/** The base64 payloads of the "Program data:" lines that `programId` wrote. */
export function programDataLogs(logs: readonly string[], programId: string): string[] {
  const stack: string[] = [];
  const data: string[] = [];
  for (const line of logs) {
    if (line.startsWith('Program ') && INVOKE.test(line)) {
      stack.push(line.slice('Program '.length).split(' ')[0]);
    } else if (/^Program \S+ (success|failed)/.test(line)) {
      stack.pop();
    } else if (line.startsWith(DATA_PREFIX) && stack.at(-1) === programId) {
      data.push(line.slice(DATA_PREFIX.length));
    }
  }
  return data;
}
