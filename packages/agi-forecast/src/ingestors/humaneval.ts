import { ingestBenchmarkReadmeFraction } from './_benchmark';
import { fetchWithTimeout, type IngestResult } from './_fetch';

const URL = 'https://api.github.com/repos/openai/human-eval/readme';

/**
 * HUMANEVAL — OpenAI's reference HumanEval repository (MIT, no auth).
 * Value: maximum reported pass@k score (as a [0,1] fraction) parsed from
 * the repo's public README.
 */
export function ingestHumanEval(
  fetchImpl: typeof fetchWithTimeout = fetchWithTimeout,
): Promise<IngestResult<number>> {
  return ingestBenchmarkReadmeFraction('humaneval', URL, fetchImpl);
}
