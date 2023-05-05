import { VM } from '../src/vm';

it('creates a VM with empty context', () => {
    const vm = new VM();
    vm.evaluate(`this.foo = "bar";`);
    expect(vm.context).toStrictEqual({ foo: 'bar' });
});

