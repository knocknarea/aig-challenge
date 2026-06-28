import { join } from 'path';
import { buildApp } from './app';
import { KbManager } from './kb-manager';

const PORT = Number(process.env['PORT'] ?? 3000);
const HOST = process.env['HOST'] ?? '0.0.0.0';
const kbPath = process.env['KB_PATH'] ?? join(process.cwd(), 'risk-kb.json');

let kbManager!: KbManager; // definite assignment — the only other exit path is process.exit(1)
try {
  kbManager = new KbManager(kbPath);
} catch (err) {
  console.error(JSON.stringify({ event: 'STARTUP_FAILED', message: String(err) }));
  process.exit(1);
}

kbManager.startWatching();
const app = buildApp(kbManager);

app.addHook('onClose', async () => kbManager.stopWatching());

app.listen({ port: PORT, host: HOST }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Backend listening at ${address}`);
});
