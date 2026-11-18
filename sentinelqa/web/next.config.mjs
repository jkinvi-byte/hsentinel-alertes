import path from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export default {
  // Le catalogue est partagé avec le runner, dans sentinelqa/contrats.
  turbopack: { root: racine },
  outputFileTracingRoot: racine,
};
