
function MockRuntimeModule(signal) {
  if (!(this instanceof MockRuntimeModule)) return new MockRuntimeModule(signal);
  this.signal = signal;
  this.name = 'MockRuntimeModule';
}

module.exports.RuntimeModule = MockRuntimeModule;
