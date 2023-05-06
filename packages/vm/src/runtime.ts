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
    return new Response();
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
  return context;
}
