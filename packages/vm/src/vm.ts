import { createContext, runInContext } from 'vm';

export class VM{
  public context: VMContext;

  constructor() {
    this.context = createContext(
      {},
      {
        name: 'my-edge-runtime',
      }
    ) as VMContext;
  }

  public evaluate(code: string) {
    return runInContext(code, this.context);
  }
}

export interface VMContext {
  [key: string | number]: any;
}
