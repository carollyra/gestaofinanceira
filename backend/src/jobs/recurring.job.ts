import { generateDueRecurringTransactions } from '../services/recurring-generator.service';
import { env } from '../utils/env';

async function runOnce() {
  try {
    const { templates, created } = await generateDueRecurringTransactions();
    if (created > 0) {
      console.info(`[recurring] ${created} transactions created from ${templates} templates`);
    }
  } catch (error) {
    console.error('[recurring] generation failed', error);
  }
}

// In-process scheduler. Runs are idempotent, so overlapping with the
// /generate endpoint or another instance is harmless.
export function startRecurringJob() {
  const minutes = env.RECURRING_JOB_INTERVAL_MINUTES;

  if (minutes === 0 || env.NODE_ENV === 'test') return;

  void runOnce();
  setInterval(() => void runOnce(), minutes * 60 * 1000).unref();
}
