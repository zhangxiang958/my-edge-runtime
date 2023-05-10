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
    console.log(Request);
    const req = new Request(url, init);
    const event = new FetchEvent(req);

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
    ['util/types', {
      exports: require('util/types')
    }],
    ['events', {
      exports: require('events')
    }],
  ]);

  const contextRequire = createRequire(context, requireCache, undefined, {
    Uint8Array: createUint8ArrayForContext(context),
    Buffer,
    process,
    global: {},
    TextEncoder,
    AbortSignal,
  });
  const requestModulePath = path.resolve(__dirname, '../../builtin/request.js');
  const requestModule = contextRequire.call(null, requestModulePath, requestModulePath);

  Object.defineProperty(context, 'Request', {
    configurable: false,
    enumerable: false,
    value: requestModule.Request,
    writable: true
  });
  console.log(context.Request);
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
