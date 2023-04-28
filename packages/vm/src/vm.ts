import { createContext } from 'vm';

export class VM{
  public context: VMContext;

  constructor() {
    this.context = {};
  }
}

export interface VMContext {
  [key: string | number]: any;
}
