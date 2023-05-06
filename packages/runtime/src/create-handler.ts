import { IncomingMessage, ServerResponse } from 'http';

import { EdgeRuntime } from "../../vm/src/runtime"

export interface CreateHanlderOptions {
  runtime: EdgeRuntime
}

export function createHandler(options: CreateHanlderOptions) {
  return {
    hanlder: (req: IncomingMessage, res: ServerResponse) => {
      const body = !['GET', 'HEAD'].includes(req.method || '') ? null : undefined;
    },
    waitUnit: () => Promise.all([])
  }
}
