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
