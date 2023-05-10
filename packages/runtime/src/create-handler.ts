import { IncomingMessage, ServerResponse } from 'http';

import { EdgeRuntime } from "../../vm/src/runtime"

export interface CreateHanlderOptions {
  runtime: EdgeRuntime
}

export function createHandler(options: CreateHanlderOptions) {
  return {
    hanlder: async (req: IncomingMessage, res: ServerResponse) => {
      // 因为 body 是一次性的，所以需要包装成一个可复制的 stream
      const body = !['GET', 'HEAD'].includes(req.method || '') ? getCloneableBodyStream(req) : undefined;
      
      const requestURLProtocol = (req.socket as any)?.encrypted ? 'https' : 'http';
      const requestURL = new URL(String(req.url), `${requestURLProtocol}://${String(req.headers.host)}`);
      const requestHeaders = Object.keys(req.headers).map(key => {
        const value = req.headers[key];
        return [key, Array.isArray(value) ? value.join(', ') : value ?? ''];
      }) as RequestInit["headers"];
      const response = await options.runtime.dispatchFetch(
        String(requestURL),
        {
          headers: requestHeaders,
          method: req.method,
          body: undefined
        }
      );
      console.log(response);
    },
    waitUnit: () => Promise.all([])
  }
}

function getCloneableBodyStream(requestIncomingMessage: IncomingMessage) {
  let bufferedBodyStream = null;
  return {
    cloneBodyStream() {
      requestIncomingMessage.on('data', (chunk) => {

      });
      requestIncomingMessage.on('end', () => {

      });
      requestIncomingMessage.on('error', (err) => {
        
      });
    }
  }
}
