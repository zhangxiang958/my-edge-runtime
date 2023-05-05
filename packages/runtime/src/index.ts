import path from 'path';
import { readFileSync } from 'fs';

import { EdgeRuntime } from '../../vm/src/runtime';

async function main() {
  const [_, edgeFunctionScriptPath] = process.argv.slice(1);
  if (!edgeFunctionScriptPath) {
    throw new Error('miss edge function path');
  }

  const absEdgeFunctionPath = path.resolve(process.cwd(), edgeFunctionScriptPath);
  const initialCode = readFileSync(absEdgeFunctionPath, 'utf-8');
  console.log(initialCode);

  const runtime = new EdgeRuntime({
    initialCode
  });

  runtime.evaluate('');
}

main().catch(err => {
  console.error('runtime catch err:', err);
  process.exit(1);
});
