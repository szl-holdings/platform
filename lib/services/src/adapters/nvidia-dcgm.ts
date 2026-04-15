import { ServiceAdapter } from "../base.js";

export interface DcgmGpuMetrics {
  gpuIndex: number;
  uuid: string;
  modelName: string;
  utilizationPct: number;
  memoryUsedMb: number;
  memoryTotalMb: number;
  temperatureCelsius: number;
  powerDrawWatts: number;
  powerLimitWatts: number;
  smClockMhz: number;
  memClockMhz: number;
  eccSingleBit: number;
  eccDoubleBit: number;
  pcieRxBytesPerSec: number;
  pcieTxBytesPerSec: number;
  fanSpeedPct: number;
  throttleReasons: string[];
}

export interface DcgmClusterSummary {
  totalGpus: number;
  activeGpus: number;
  avgUtilization: number;
  totalVramGb: number;
  usedVramGb: number;
  totalPowerKw: number;
  eccErrorsTotal: number;
  throttledGpus: number;
  gpus: DcgmGpuMetrics[];
}

const DEMO_GPUS: DcgmGpuMetrics[] = [
  { gpuIndex: 0, uuid: "GPU-a1b2c3d4", modelName: "NVIDIA H100 80GB HBM3", utilizationPct: 94, memoryUsedMb: 72_448, memoryTotalMb: 81_920, temperatureCelsius: 71, powerDrawWatts: 648, powerLimitWatts: 700, smClockMhz: 1980, memClockMhz: 2619, eccSingleBit: 0, eccDoubleBit: 0, pcieRxBytesPerSec: 8_200_000_000, pcieTxBytesPerSec: 6_100_000_000, fanSpeedPct: 65, throttleReasons: [] },
  { gpuIndex: 1, uuid: "GPU-e5f6g7h8", modelName: "NVIDIA H100 80GB HBM3", utilizationPct: 88, memoryUsedMb: 68_096, memoryTotalMb: 81_920, temperatureCelsius: 68, powerDrawWatts: 612, powerLimitWatts: 700, smClockMhz: 1980, memClockMhz: 2619, eccSingleBit: 0, eccDoubleBit: 0, pcieRxBytesPerSec: 7_400_000_000, pcieTxBytesPerSec: 5_800_000_000, fanSpeedPct: 62, throttleReasons: [] },
  { gpuIndex: 2, uuid: "GPU-i9j0k1l2", modelName: "NVIDIA A100 80GB SXM", utilizationPct: 76, memoryUsedMb: 61_440, memoryTotalMb: 81_920, temperatureCelsius: 64, powerDrawWatts: 285, powerLimitWatts: 400, smClockMhz: 1410, memClockMhz: 1593, eccSingleBit: 2, eccDoubleBit: 0, pcieRxBytesPerSec: 5_900_000_000, pcieTxBytesPerSec: 4_200_000_000, fanSpeedPct: 55, throttleReasons: [] },
  { gpuIndex: 3, uuid: "GPU-m3n4o5p6", modelName: "NVIDIA A100 80GB SXM", utilizationPct: 42, memoryUsedMb: 34_816, memoryTotalMb: 81_920, temperatureCelsius: 56, powerDrawWatts: 218, powerLimitWatts: 400, smClockMhz: 1410, memClockMhz: 1593, eccSingleBit: 0, eccDoubleBit: 0, pcieRxBytesPerSec: 3_100_000_000, pcieTxBytesPerSec: 2_400_000_000, fanSpeedPct: 45, throttleReasons: [] },
  { gpuIndex: 4, uuid: "GPU-q7r8s9t0", modelName: "NVIDIA H200 141GB HBM3e", utilizationPct: 97, memoryUsedMb: 132_096, memoryTotalMb: 144_384, temperatureCelsius: 78, powerDrawWatts: 680, powerLimitWatts: 700, smClockMhz: 1980, memClockMhz: 2619, eccSingleBit: 0, eccDoubleBit: 0, pcieRxBytesPerSec: 11_200_000_000, pcieTxBytesPerSec: 9_800_000_000, fanSpeedPct: 78, throttleReasons: ["sw_thermal"] },
];

export class NvidiaDcgmAdapter extends ServiceAdapter {
  readonly name = "nvidia-dcgm";
  readonly description = "NVIDIA DCGM — GPU cluster telemetry via DCGM Exporter Prometheus endpoints";
  readonly requiredEnvVars = ["DCGM_EXPORTER_URL"];

  protected rateLimitPerMinute = 30;

  private get exporterUrl(): string {
    return (process.env["DCGM_EXPORTER_URL"] ?? "").replace(/\/$/, "");
  }

  protected async performHealthCheck(): Promise<void> {
    const res = await this.resilientFetch(`${this.exporterUrl}/metrics`, {
      maxRetries: 1,
      timeoutMs: 8_000,
    });
    if (!res.ok) throw new Error(`DCGM Exporter HTTP ${res.status}`);
    const text = await res.text();
    if (!text.includes("DCGM_FI_DEV_GPU_UTIL") && !text.includes("dcgm_")) {
      throw new Error("Response does not contain DCGM metrics");
    }
  }

  private parsePrometheusMetrics(text: string): Map<string, Map<string, number>> {
    const gpuMetrics = new Map<string, Map<string, number>>();

    for (const line of text.split("\n")) {
      if (line.startsWith("#") || line.trim() === "") continue;

      const match = line.match(/^(\w+)\{([^}]*)\}\s+(\S+)/);
      if (!match) continue;

      const [, metricName, labelsStr, valueStr] = match;
      const value = parseFloat(valueStr);
      if (isNaN(value)) continue;

      const gpuMatch = labelsStr.match(/gpu="(\d+)"/);
      const uuidMatch = labelsStr.match(/UUID="([^"]+)"/);
      const key = gpuMatch?.[1] ?? uuidMatch?.[1] ?? "0";

      if (!gpuMetrics.has(key)) gpuMetrics.set(key, new Map());
      gpuMetrics.get(key)!.set(metricName, value);
    }

    return gpuMetrics;
  }

  async getGpuMetrics(): Promise<DcgmGpuMetrics[]> {
    if (!this.isLive) return [...DEMO_GPUS];

    const res = await this.resilientFetch(`${this.exporterUrl}/metrics`, {
      timeoutMs: 10_000,
    });

    if (!res.ok) return [...DEMO_GPUS];
    const text = await res.text();
    const parsed = this.parsePrometheusMetrics(text);

    if (parsed.size === 0) return [...DEMO_GPUS];

    const gpus: DcgmGpuMetrics[] = [];
    for (const [key, metrics] of parsed) {
      const throttleReasons: string[] = [];
      if ((metrics.get("DCGM_FI_DEV_THERMAL_VIOLATION") ?? 0) > 0) throttleReasons.push("sw_thermal");
      if ((metrics.get("DCGM_FI_DEV_POWER_VIOLATION") ?? 0) > 0) throttleReasons.push("hw_power_brake");

      gpus.push({
        gpuIndex: parseInt(key) || gpus.length,
        uuid: `GPU-${key}`,
        modelName: "NVIDIA GPU",
        utilizationPct: metrics.get("DCGM_FI_DEV_GPU_UTIL") ?? 0,
        memoryUsedMb: Math.round((metrics.get("DCGM_FI_DEV_FB_USED") ?? 0)),
        memoryTotalMb: Math.round((metrics.get("DCGM_FI_DEV_FB_USED") ?? 0) + (metrics.get("DCGM_FI_DEV_FB_FREE") ?? 0)),
        temperatureCelsius: metrics.get("DCGM_FI_DEV_GPU_TEMP") ?? 0,
        powerDrawWatts: metrics.get("DCGM_FI_DEV_POWER_USAGE") ?? 0,
        powerLimitWatts: metrics.get("DCGM_FI_DEV_ENFORCED_POWER_LIMIT") ?? 700,
        smClockMhz: metrics.get("DCGM_FI_DEV_SM_CLOCK") ?? 0,
        memClockMhz: metrics.get("DCGM_FI_DEV_MEM_CLOCK") ?? 0,
        eccSingleBit: metrics.get("DCGM_FI_DEV_ECC_SBE_VOL_TOTAL") ?? 0,
        eccDoubleBit: metrics.get("DCGM_FI_DEV_ECC_DBE_VOL_TOTAL") ?? 0,
        pcieRxBytesPerSec: metrics.get("DCGM_FI_DEV_PCIE_RX_THROUGHPUT") ?? 0,
        pcieTxBytesPerSec: metrics.get("DCGM_FI_DEV_PCIE_TX_THROUGHPUT") ?? 0,
        fanSpeedPct: metrics.get("DCGM_FI_DEV_FAN_SPEED") ?? 0,
        throttleReasons,
      });
    }

    return gpus;
  }

  async getClusterSummary(): Promise<DcgmClusterSummary> {
    const gpus = await this.getGpuMetrics();
    const active = gpus.filter((g) => g.utilizationPct > 5);

    return {
      totalGpus: gpus.length,
      activeGpus: active.length,
      avgUtilization: gpus.length > 0 ? gpus.reduce((s, g) => s + g.utilizationPct, 0) / gpus.length : 0,
      totalVramGb: gpus.reduce((s, g) => s + g.memoryTotalMb, 0) / 1024,
      usedVramGb: gpus.reduce((s, g) => s + g.memoryUsedMb, 0) / 1024,
      totalPowerKw: gpus.reduce((s, g) => s + g.powerDrawWatts, 0) / 1000,
      eccErrorsTotal: gpus.reduce((s, g) => s + g.eccSingleBit + g.eccDoubleBit, 0),
      throttledGpus: gpus.filter((g) => g.throttleReasons.length > 0).length,
      gpus,
    };
  }
}
