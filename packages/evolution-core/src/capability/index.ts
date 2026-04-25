/**
 * Precision Capability Layer — Layer B
 *
 * Detects runtime capabilities honestly and assigns the correct PrecisionProfile.
 * NEVER claims FP8 or CUDA support without verifiable evidence.
 *
 * In Replit's CPU-only environment this always returns 'cpu_safe' unless
 * PRECISION_PROFILE is explicitly configured AND a remote backend is healthy.
 * This is honest — the UI labels it clearly.
 */

import type { CapabilitySnapshot, PrecisionProfile } from '../types.js';

const EVOLUTION_MODE = process.env.EVOLUTION_MODE ?? 'simulation';
const PRECISION_PROFILE_OVERRIDE = process.env.PRECISION_PROFILE as PrecisionProfile | undefined;
const INFERENCE_BACKEND = process.env.INFERENCE_BACKEND ?? 'local_safe';

/**
 * Detect the actual runtime precision profile.
 *
 * Resolution order:
 * 1. If PRECISION_PROFILE env var is set AND it is not a CUDA profile, honour it directly.
 * 2. If PRECISION_PROFILE env var claims CUDA, verify CUDA is actually available — fall back to cpu_safe if not.
 * 3. If INFERENCE_BACKEND is remote_accelerated and health check passes, return remote_accelerated.
 * 4. Default: cpu_safe.
 */
export async function detectCapabilities(): Promise<CapabilitySnapshot> {
  const now = new Date().toISOString();

  const cudaAvailable = await checkCudaAvailable();
  const bf16Supported = cudaAvailable && (await checkBf16Supported());
  const fp8Supported = cudaAvailable && bf16Supported && (await checkFp8Supported());
  const remoteConfigured = INFERENCE_BACKEND === 'remote_accelerated' || INFERENCE_BACKEND === 'nvidia_nim';
  const remoteHealthy = remoteConfigured ? await checkRemoteBackendHealth() : false;

  let profile = resolveProfile({
    override: PRECISION_PROFILE_OVERRIDE,
    cudaAvailable,
    bf16Supported,
    fp8Supported,
    remoteConfigured,
    remoteHealthy,
  });

  const environmentMode = resolveEnvironmentMode();
  const isSimulatedEnv = environmentMode === 'simulation' || EVOLUTION_MODE === 'simulation';

  return {
    profile,
    environmentMode,
    cudaAvailable,
    cudaDeviceName: cudaAvailable ? 'detected-gpu' : null,
    bf16Supported,
    fp8Supported,
    remoteBackendConfigured: remoteConfigured,
    remoteBackendHealthy: remoteHealthy,
    detectedAt: now,
    simulated: isSimulatedEnv,
  };
}

function resolveProfile(opts: {
  override?: PrecisionProfile;
  cudaAvailable: boolean;
  bf16Supported: boolean;
  fp8Supported: boolean;
  remoteConfigured: boolean;
  remoteHealthy: boolean;
}): PrecisionProfile {
  const { override, cudaAvailable, bf16Supported, fp8Supported, remoteConfigured, remoteHealthy } = opts;

  if (override) {
    const cudaProfiles: PrecisionProfile[] = [
      'cuda_bf16',
      'cuda_fp8_linear',
      'cuda_fp8_linear_kv',
      'future_blackwell_path',
    ];
    if (cudaProfiles.includes(override)) {
      if (!cudaAvailable) {
        return 'cpu_safe';
      }
      if ((override === 'cuda_fp8_linear' || override === 'cuda_fp8_linear_kv' || override === 'future_blackwell_path') && !fp8Supported) {
        return bf16Supported ? 'cuda_bf16' : 'cpu_safe';
      }
    }
    if (override === 'remote_accelerated' && !remoteHealthy) {
      return 'cpu_safe';
    }
    return override;
  }

  if (remoteConfigured && remoteHealthy) return 'remote_accelerated';
  if (fp8Supported) return 'cuda_fp8_linear';
  if (bf16Supported) return 'cuda_bf16';
  if (cudaAvailable) return 'cuda_bf16';
  return 'cpu_safe';
}

function resolveEnvironmentMode(): CapabilitySnapshot['environmentMode'] {
  const nodeEnv = process.env.NODE_ENV;
  const appEnv = process.env.APP_ENV;
  if (EVOLUTION_MODE === 'simulation') return 'simulation';
  if (nodeEnv === 'production' || appEnv === 'production') return 'production';
  if (appEnv === 'staging') return 'staging';
  return 'local_dev';
}

async function checkCudaAvailable(): Promise<boolean> {
  if (EVOLUTION_MODE === 'simulation') return false;
  try {
    const { execFile } = await import('node:child_process');
    const { promisify } = await import('node:util');
    const exec = promisify(execFile);
    await exec('nvidia-smi', ['--query-gpu=name', '--format=csv,noheader']);
    return true;
  } catch {
    return false;
  }
}

async function checkBf16Supported(): Promise<boolean> {
  try {
    const { execFile } = await import('node:child_process');
    const { promisify } = await import('node:util');
    const exec = promisify(execFile);
    const { stdout } = await exec('nvidia-smi', [
      '--query-gpu=compute_cap',
      '--format=csv,noheader',
    ]);
    const computeCap = parseFloat(stdout.trim().split('\n')[0] ?? '0');
    return computeCap >= 8.0;
  } catch {
    return false;
  }
}

async function checkFp8Supported(): Promise<boolean> {
  try {
    const { execFile } = await import('node:child_process');
    const { promisify } = await import('node:util');
    const exec = promisify(execFile);
    const { stdout } = await exec('nvidia-smi', [
      '--query-gpu=compute_cap',
      '--format=csv,noheader',
    ]);
    const computeCap = parseFloat(stdout.trim().split('\n')[0] ?? '0');
    return computeCap >= 9.0;
  } catch {
    return false;
  }
}

async function checkRemoteBackendHealth(): Promise<boolean> {
  const healthUrl = process.env.REMOTE_INFERENCE_HEALTH_URL;
  if (!healthUrl) return false;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const resp = await fetch(healthUrl, { signal: controller.signal });
    clearTimeout(timer);
    return resp.ok;
  } catch {
    return false;
  }
}

export function describeProfile(profile: PrecisionProfile): string {
  const descriptions: Record<PrecisionProfile, string> = {
    cpu_safe: 'CPU-only execution. Safe for all environments including Replit. No GPU required.',
    cuda_bf16: 'CUDA BF16 execution. Requires NVIDIA GPU with Ampere or later architecture.',
    cuda_fp8_linear: 'CUDA FP8 linear execution. Requires NVIDIA Hopper (H100) or later.',
    cuda_fp8_linear_kv: 'CUDA FP8 + KV-cache quantisation. Requires NVIDIA Hopper (H100) or later.',
    remote_accelerated: 'Remote accelerated backend (NIM / remote GPU). Requires REMOTE_INFERENCE_HEALTH_URL.',
    future_blackwell_path: 'Reserved for NVIDIA Blackwell (B100/B200) FP8 tensor-parallel execution. Not yet available.',
  };
  return descriptions[profile];
}
