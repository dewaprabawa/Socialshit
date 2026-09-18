// Runs once when the Next.js server process boots.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { startScheduler } = await import("@/lib/scheduler");
      startScheduler();
    } catch (err) {
      console.error("[instrumentation] scheduler failed to start:", err);
    }
  }
}
