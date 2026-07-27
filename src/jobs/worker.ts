// Entry-point worker: încarcă .env (dev) ÎNAINTE de a importa module care ating
// mediul (Prisma). Importurile statice se hoist-uiesc, deci logica reală se
// încarcă dinamic după `loadEnvFile`. În prod, variabilele vin din mediu.

async function boot(): Promise<void> {
  try {
    process.loadEnvFile();
  } catch {
    // fără .env (prod) — mediul e deja configurat
  }
  const { startWorker } = await import("./worker-main");
  await startWorker();
}

boot().catch((e) => {
  console.error("Worker pg-boss a eșuat la pornire:", (e as Error).message);
  process.exitCode = 1;
});
