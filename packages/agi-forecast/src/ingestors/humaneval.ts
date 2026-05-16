import { ingestGithubStargazers } from './_github';
import { fetchWithTimeout, type IngestResult } from './_fetch';

const URL = 'https://api.github.com/repos/openai/human-eval';

/**
 * HUMANEVAL — OpenAI's reference HumanEval repository
 * (MIT, no auth). Value: stargazer count as a proxy for frontier
 * adoption of HumanEval pass@1 as an evaluation target.
 */
export function ingestHumanEval(
  fetchImpl: typeof fetchWithTimeout = fetchWithTimeout,
): Promise<IngestResult<number>> {
  return ingestGithubStargazers('humaneval', URL, fetchImpl);
}
