/**
 * Primitive 79 — Dynamic Workload Scheduler with deadline receipt
 *
 * Inspired by Google Cloud's Dynamic Workload Scheduler (Calendar
 * Mode + Flex-Start). The lift: every scheduled job carries a deadline
 * receipt. If the scheduler cannot guarantee the deadline given
 * current capacity, it MUST refuse the job up front rather than
 * accept-and-fail.
 */

export interface ScheduledJob {
  id: string;
  durationSec: number;
  deadlineSec: number; // wall-clock seconds-from-now by which job must finish
  priority: number;
}

export interface SchedulerCapacity {
  availableSlots: number;
  expectedQueueWaitSec: number;
}

export interface ScheduleVerdict {
  jobId: string;
  accepted: boolean;
  estimatedFinishSec: number;
  reason: string;
}

export function trySchedule(job: ScheduledJob, cap: SchedulerCapacity): ScheduleVerdict {
  if (cap.availableSlots <= 0 && cap.expectedQueueWaitSec <= 0) {
    return { jobId: job.id, accepted: false, estimatedFinishSec: Infinity, reason: "no capacity" };
  }
  const wait = cap.availableSlots > 0 ? 0 : cap.expectedQueueWaitSec;
  const finish = wait + job.durationSec;
  if (finish > job.deadlineSec) {
    return {
      jobId: job.id,
      accepted: false,
      estimatedFinishSec: finish,
      reason: `cannot meet deadline ${job.deadlineSec}s (finish=${finish}s)`,
    };
  }
  return {
    jobId: job.id,
    accepted: true,
    estimatedFinishSec: finish,
    reason: "deadline within capacity",
  };
}
