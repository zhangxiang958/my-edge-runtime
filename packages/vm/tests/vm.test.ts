import path from 'path';
import { VM } from '../src/vm';

it('creates a VM with empty context', () => {
  const vm = new VM();
  vm.evaluate(`this.foo = "bar";`);
  expect(vm.context).toStrictEqual({ foo: 'bar' });
});

it('extend the context', () => {
  const vm = new VM({
    extend: (context) => {
      Object.assign(context, {
        process: {
          env: {
            NODE_ENV: 'development'
          }
        }
      });
      return context
    }
  });

  expect(vm.context.process.env.NODE_ENV).toEqual('development')
  const env = vm.evaluate('process.env.NODE_ENV');
  expect(env).toEqual('development');
});

it('extend the context using dot operator', () => {
  const vm = new VM({
    extend: (context) => {
      context.__vm_info = 'my-edge-runtime';
      return context
    }
  });

  expect(vm.context.__vm_info).toEqual('my-edge-runtime')
  const info = vm.evaluate('__vm_info');
  expect(info).toEqual('my-edge-runtime');
});

it('require a CJS module and load it in context', () => {
  const vm = new VM();
  const modulePath = path.resolve(__dirname, './fixtures/cjs-module.js');
  
  vm.requireInContext(modulePath);

  vm.evaluate('this.hasRuntimeModule = !!RuntimeModule');
  vm.evaluate('this.runtimeModule = new RuntimeModule("my-runtime")');

  expect(vm.context.hasRuntimeModule).toBeTruthy();
  expect(vm.context.runtimeModule.signal).toEqual('my-runtime');
  expect(vm.context.runtimeModule.name).toEqual('MockRuntimeModule');;
})

it('does not define `require`', () => {
  const vm = new VM();

  expect(() => {
    vm.evaluate(`const Blob = require('buffer').Blob; this.blob = new Blob()`);
  }).toThrow({
    name: 'ReferenceError',
    message: 'require is not defined'
  });
});
