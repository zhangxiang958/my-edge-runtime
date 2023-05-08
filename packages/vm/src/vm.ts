import { createContext, runInContext } from 'vm';
import { createRequire } from './require';

export interface VMOptions {
  extend?: (context: VMContext) => VMContext
}

export class VM{
  public readonly context: VMContext;
  public readonly requireCache: Map<string, Record<string| number, any>>;
  private readonly requireFn: (referrer: string, specifier: string) => any;

  constructor(options?: VMOptions) {
    this.context = createContext(
      {},
      {
        name: 'my-edge-runtime',
      }
    ) as VMContext;

    if (options && options.extend) {
      const extendContext = options.extend(this.context);
      if (extendContext) this.context = extendContext;
    }
    this.requireCache = new Map();
    this.requireFn = createRequire(this.context, this.requireCache);
  }

  public evaluate(code: string) {
    return runInContext(code, this.context);
  }

  public require(filePath: string) {
    return this.requireFn(filePath, filePath);
  }

  public requireInContext(filePath: string) {
    const requiredModule = this.require(filePath);
    for (const [key, value] of Object.entries(requiredModule)) {
      this.context[key] = value;
    }
  }

  public requireInlineInContext(code: string) {

  }
}

export interface VMContext {
  [key: string | number]: any;
}
