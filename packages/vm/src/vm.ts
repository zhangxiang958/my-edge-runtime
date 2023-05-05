import { createContext, runInContext } from 'vm';

export interface VMOptions {
  extend?: (context: VMContext) => VMContext
}

export class VM{
  public context: VMContext;

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
  }

  public evaluate(code: string) {
    return runInContext(code, this.context);
  }
}

export interface VMContext {
  [key: string | number]: any;
}
