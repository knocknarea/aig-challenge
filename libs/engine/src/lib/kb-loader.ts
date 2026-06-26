import { readFileSync } from 'fs';
import { join } from 'path';
import { Kb, KbSchema } from 'shared';

export function loadKb(kbPath?: string): Kb {
  const resolvedPath = kbPath ?? process.env['KB_PATH'] ?? join(process.cwd(), 'risk-kb.json');
  const raw = readFileSync(resolvedPath, 'utf-8');
  return KbSchema.parse(JSON.parse(raw));
}
