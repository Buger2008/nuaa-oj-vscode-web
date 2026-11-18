export type CaseStatus = 'AC' | 'WA' | 'PE' | 'RE' | 'TLE' | 'CE' | 'OK';

export interface CaseResult {
  index: number;
  input: string;
  expected: string;
  actual: string;
  stderr: string;
  status: CaseStatus;
  timeMs: number;
}

export interface RunResult {
  ok: boolean;
  language: string;
  skipped?: string;
  compileError?: string;
  cases: CaseResult[];
  totalTimeMs: number;
  cloud?: boolean;
}
