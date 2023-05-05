import { VM } from "./vm";

export interface EdgeRuntimeOptions {
  initialCode?: string
}

export class EdgeRuntime extends VM {
  constructor (options?: EdgeRuntimeOptions) {
    super();

    this.evaluate(getBuiltinEventListenersCode());
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
    if (eventType === 'fetch' && self.__listerners.fetch) {
      throw new TypeError('event "fetch" just can register one hanlder');
    }

    self.__listeners[eventType] = self.__listeners[eventType] || [];
    self.__listeners[eventType].push(handler);
  }
  `;
}
