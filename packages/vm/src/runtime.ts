import path from 'path';
import { runInContext } from 'vm';

import { createRequire } from "./require";
import { VM, VMContext, VMOptions } from "./vm";

export interface EdgeRuntimeOptions extends VMOptions {
  initialCode?: string
}

interface DispatchFetch {
  (input: string, init?: RequestInit): Promise<Response & {
    waitUnit: () => Promise<any>
  }>
}

export class EdgeRuntime extends VM {
  public readonly dispatchFetch: DispatchFetch;
  constructor (options?: EdgeRuntimeOptions) {
    super({
      ...options,
      extend: (context) => {
        if (options?.extend) {
          return options.extend(addBuiltin(context));
        }
        return addBuiltin(context);
      }
    });

    this.evaluate(getBuiltinEventListenersCode());
    this.dispatchFetch = this.evaluate(getDispatchFetchCode());
    if (options?.initialCode) {
      this.evaluate(options.initialCode);
    }
  }
}

function getBuiltinEventListenersCode(): string {
  return `
  Object.defineProperty(self, '__listeners', {
    configurable: false, // true 才可以被改变和删除
    enumerable: false, // true 才可以出现在枚举属性里
    value: {},
    writable: true, // 可以用赋值语句赋值
  });

  function addEventListener(type, hanlder) {
    const eventType = type.toLowerCase();
    if (eventType === 'fetch' && self.__listeners.fetch) {
      throw new TypeError('event "fetch" just can register one hanlder');
    }

    self.__listeners[eventType] = self.__listeners[eventType] || [];
    self.__listeners[eventType].push(hanlder);
  }
  `;
}

function getDispatchFetchCode(): string {
  return `
  (async function dispatchFetch(url, init) {
    const req = new Request(url, init);
    const event = new FetchEvent(req);

    const getResponse = ({ response, error }) => {
      if (error || !response || !(response instanceof Response)) {
        console.error(error ? error.toString() : 'The event listener did not respond')
        response = new Response(null, {
          statusText: 'Internal Server Error',
          status: 500
        })
      }

      response.waitUntil = () => Promise.all(event.awaiting);

      if (response.status < 300 || response.status >= 400 ) {
        response.headers.delete('content-encoding');
        response.headers.delete('transform-encoding');
        response.headers.delete('content-length');
      }

      return response;
    }

    try {
      await self.__listeners.fetch[0].call(event, event)
    } catch (error) {
      return getResponse({ error })
    }
    return Promise.resolve(event.response)
    .then(response => getResponse({ response }))
    .catch(error => getResponse({ error }));
  })
  `;
}

function addBuiltin(context: VMContext): VMContext {
  Object.defineProperty(context, 'self', {
    configurable: false,
    enumerable: true,
    value: context,
    writable: true
  });

  const requireCache = new Map([
    ['stream', {
      exports: require('stream')
    }],
    ['buffer', {
      exports: require('buffer')
    }],
    ['assert', {
      exports: require('assert')
    }],
    ['http', {
      exports: require('http')
    }],
    ['net', {
      exports: require('net')
    }],
    ['util', {
      exports: require('util')
    }],
    ['querystring', {
      exports: require('querystring')
    }],
    ['worker_threads', {
      exports: require('worker_threads')
    }],
    ['perf_hooks', {
      exports: require('perf_hooks')
    }],
    ['util/types', { // request 里面需要用到
      exports: require('util/types')
    }],
    ['events', {
      exports: require('events')
    }],
    ['tr46', { // url 里面需要用到
      exports: require('tr46')
    }],
    ['stream/web', { // fetch 需要用到
      exports: require('stream/web')
    }],
    ['zlib', { // fetch 需要用到
      exports: require('zlib')
    }]
  ]);

  const contextRequire = createRequire(context, requireCache, undefined, {
    Uint8Array: createUint8ArrayForContext(context),
    Buffer,
    process,
    global: {},
    TextEncoder,
    TextDecoder,
    AbortSignal,
    console,
  });
  const requestModulePath = path.resolve(__dirname, '../../builtin/request.js');
  const requestModule = contextRequire.call(null, requestModulePath, requestModulePath);

  Object.defineProperty(context, 'Request', {
    configurable: false,
    enumerable: false,
    value: requestModule.Request,
    writable: true
  });

  const urlModulePath = path.resolve(__dirname, '../../builtin/url.js');
  const urlModule = contextRequire.call(null, urlModulePath, urlModulePath);
  Object.defineProperty(context, 'URL', {
    configurable: false,
    enumerable: false,
    value: urlModule.URL,
    writable: true
  });
  Object.defineProperty(context, 'URLSearchParams', {
    configurable: false,
    enumerable: false,
    value: urlModule.URLSearchParams,
    writable: true
  });

  const abortControllerModulePath = path.resolve(__dirname, '../../builtin/abort-controller.js');
  const abortControllerModule = contextRequire.call(null, abortControllerModulePath, abortControllerModulePath);
  Object.defineProperty(context, 'AbortController', {
    configurable: false,
    enumerable: false,
    value: abortControllerModule.AbortController,
    writable: true
  });

  const fetchEventModulePath = path.resolve(__dirname, '../../builtin/fetchEvent.js');
  const fetchEventModule = contextRequire.call(null, fetchEventModulePath, fetchEventModulePath);
  Object.defineProperty(context, 'FetchEvent', {
    configurable: false,
    enumerable: false,
    value: fetchEventModule.FetchEvent,
    writable: true
  });

  const fetchModulePath = path.resolve(__dirname, '../../builtin/fetch.js');
  const fetchModule = contextRequire.call(null, fetchModulePath, fetchModulePath);
  Object.defineProperty(context, 'fetch', {
    configurable: false,
    enumerable: false,
    value: fetchModule.fetch,
    writable: true
  });
  Object.defineProperty(context, 'Response', {
    configurable: false,
    enumerable: false,
    value: fetchModule.Response,
    writable: true
  });
  Object.defineProperty(context, 'getGlobalDispatcher', {
    configurable: false,
    enumerable: false,
    value: fetchModule.getGlobalDispatcher,
    writable: true
  });


  // console
  const consoleModulePath = path.resolve(__dirname, '../../builtin/console.js');
  const consoleModule = contextRequire.call(null, consoleModulePath, consoleModulePath);
  Object.defineProperty(context, 'console', {
    configurable: false,
    enumerable: false,
    value: consoleModule.konsole,
    writable: true
  });

  return context;
}

function createUint8ArrayForContext(context: VMContext) {
  return new Proxy(runInContext('Uint8Array', context), {
    // on every construction (new Uint8Array(...))
    construct(target, args) {
      // construct it
      const value: Uint8Array = new target(...args)

      // if this is not a buffer
      if (!(args[0] instanceof Buffer)) {
        // return what we just constructed
        return value
      }

      // if it is a buffer, then we spread the binary data into an array,
      // and build the Uint8Array from that
      return new target([...value])
    },
  });
}
