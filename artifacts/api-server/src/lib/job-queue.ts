export {
  InProcessJobQueue,
  JOB_TYPES,
  type Job,
  type JobStatus,
  jobQueue,
  type WsPublishFn,
} from '@szl-holdings/forge-runtime';

let scheduledJobsStarted = false;

export function startScheduledJobs() {
  if (scheduledJobsStarted) return;
  scheduledJobsStarted = true;
}
