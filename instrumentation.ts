import { startWorker } from './lib/workflow';

export async function register() {
  // Only in a long-running Node process (next dev / next start).
  // Serverless platforms (Vercel) have no persistent process — automation
  // there runs on-demand (Run now / triggers), which the API fully supports.
  if (
    process.env.NEXT_RUNTIME === 'nodejs' &&
    process.env.NEXT_PHASE !== 'phase-production-build' &&
    !process.env.VERCEL
  ) {
    startWorker();
  }
}
