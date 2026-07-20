import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface FunctionTiming {
  name: string;
  calls: number;
  totalTimeMs: number;
  selfTimeMs: number;
}

export interface DeltaItem {
  name: string;
  beforeMs: number;
  afterMs: number;
  deltaMs: number;
  percentageChange: number;
  regression: boolean;
}

export interface ProfileResult {
  target: string;
  language: "python" | "node";
  before: FunctionTiming[];
  after: FunctionTiming[];
  deltas: DeltaItem[];
  summary: {
    totalBeforeMs: number;
    totalAfterMs: number;
    totalDeltaMs: number;
    hasRegression: boolean;
  };
}

export interface ProfileOptions {
  language: "python" | "node";
  entryPoint: string;
  args?: string[];
  cwd?: string;
  runs?: number;
  timeout?: number;
}

export function computeDeltas(
  before: FunctionTiming[],
  after: FunctionTiming[],
): DeltaItem[] {
  const beforeMap = new Map(before.map((f) => [f.name, f]));
  const afterMap = new Map(after.map((f) => [f.name, f]));
  const allNames = new Set([...beforeMap.keys(), ...afterMap.keys()]);

  const deltas: DeltaItem[] = [];
  for (const name of allNames) {
    const b = beforeMap.get(name);
    const a = afterMap.get(name);
    const beforeMs = b?.totalTimeMs ?? 0;
    const afterMs = a?.totalTimeMs ?? 0;
    const deltaMs = afterMs - beforeMs;

    const percentageChange =
      beforeMs > 0
        ? Math.round(((afterMs - beforeMs) / beforeMs) * 100)
        : afterMs > 0
          ? 100
          : 0;

    const regression = deltaMs > 20 || (beforeMs > 0 && deltaMs / beforeMs > 0.2);

    deltas.push({
      name,
      beforeMs: Math.round(beforeMs * 100) / 100,
      afterMs: Math.round(afterMs * 100) / 100,
      deltaMs: Math.round(deltaMs * 100) / 100,
      percentageChange,
      regression,
    });
  }

  return deltas.sort((a, b) => b.deltaMs - a.deltaMs);
}

/**
 * Run benchmark for target script in specified working directory
 */
export async function runScriptBenchmark(
  options: ProfileOptions,
): Promise<FunctionTiming[]> {
  const cwd = options.cwd || process.cwd();
  const entry = options.entryPoint;
  const timeout = (options.timeout || 30) * 1000;

  if (options.language === "node") {
    const start = Date.now();
    const { stdout } = await execFileAsync("node", [entry, ...(options.args || [])], {
      cwd,
      timeout,
    });
    const elapsed = Date.now() - start;

    // Check if script produced timing JSON in stdout
    try {
      const parsed = JSON.parse(stdout.trim());
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Fallback timing
    }

    return [
      {
        name: entry,
        calls: options.runs || 1,
        totalTimeMs: elapsed,
        selfTimeMs: elapsed,
      },
    ];
  } else {
    const start = Date.now();
    const { stdout } = await execFileAsync("python3", [entry, ...(options.args || [])], {
      cwd,
      timeout,
    });
    const elapsed = Date.now() - start;

    try {
      const parsed = JSON.parse(stdout.trim());
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Fallback
    }

    return [
      {
        name: entry,
        calls: options.runs || 1,
        totalTimeMs: elapsed,
        selfTimeMs: elapsed,
      },
    ];
  }
}
