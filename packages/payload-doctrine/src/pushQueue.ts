import type { PushQueueEntry } from "./types.js";

// Source: /tmp/payload/payload.json -> push_queue_ready_one_way_doors
export const PUSH_QUEUE_READY: ReadonlyArray<PushQueueEntry> = [
  {
    id: "PUSH_2_ZENODO_MINT",
    artifact: "_files/thesis/zenodo_pkg/deposit.json",
    targetVersion: "v14",
    status: "READY_AWAITING_CONFIRM",
    blocker: "confirm_action one-way door",
  },
  {
    id: "PUSH_1_ARXIV_SUBMIT",
    artifact: "_files/thesis/arxiv_pkg/arxiv_submission.zip",
    sha256:
      "13ca4a0617dddfa619e97d48a65b042d13d229481354f085f7dcc9199af5973b",
    status: "READY_AWAITING_CONFIRM",
    blocker: "confirm_action one-way door",
  },
];

// Source: /tmp/payload/payload.json -> push_queue_blocked
export const PUSH_QUEUE_BLOCKED: ReadonlyArray<PushQueueEntry> = [
  {
    id: "PUSH_4_OUROBOROS_v6_4_0_rc",
    blocker:
      "TS runtime code (pool, merkle-dag, BLAKE3, xoshiro256**) not implemented",
  },
  {
    id: "PUSH_6_NPM_PUBLISH_a11oy_knowledge",
    blocker: "npm token not in env",
  },
];
