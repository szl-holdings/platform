export {
  InProcessJobQueue,
  jobQueue,
  JOB_TYPES,
  type Job,
  type JobStatus,
  type WsPublishFn,
} from "@szl-holdings/workflow-engine";

let scheduledJobsStarted = false;

export function startScheduledJobs() {
  if (scheduledJobsStarted) return;
  scheduledJobsStarted = true;
}
