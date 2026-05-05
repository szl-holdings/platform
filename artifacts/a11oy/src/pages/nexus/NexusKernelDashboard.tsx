import { NexusApiPending } from './NexusApiPending';

export default function KernelDashboard() {
  return (
    <NexusApiPending
      endpoint="GET /api/nexus/kernels"
      description="The NEXUS Kernel Dashboard catalogs GPU inference kernels (FlashAttention, quantization, decode) with benchmark data, hardware requirements, and version provenance. Connect the backend to browse and compare kernels."
    />
  );
}
