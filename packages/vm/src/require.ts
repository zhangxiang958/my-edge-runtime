import { Context, runInContext } from 'vm';
import path from 'path';
import { readFileSync } from 'fs';


export function createRequire(
  context: Context,
  cache: Map<string, any>,
  references?: Set<string>,
  scopedContext: Record<any, any> = {}
) {
  return function requireFn(referrer: string, specifier: string) {
    let resolved = require.resolve(specifier, {
      paths: [path.dirname(referrer)]
    });

    const cached = cache.get(specifier) || cache.get(resolved);
    if (cached !== undefined && cached !== null) {
      return cached.exports;
    }
    const module = {
      exports: {},
      loaded: false,
    };

    let fn = runInContext(`
    (function (exports, require, module, __filename, __dirname) {
      ${readFileSync(resolved, 'utf-8')}
    })
    `, context);

    try {
      fn(
        module.exports,
        requireFn.bind(null, resolved),
        module,
        resolved,
        path.dirname(resolved),
      );
    }catch (err) {
      cache.delete(resolved);
      throw err;
    }
    module.loaded = true;
    cache.set(resolved, module);
    return module.exports;
  }
}
