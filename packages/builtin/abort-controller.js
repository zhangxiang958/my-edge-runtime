const kSignal = Symbol('kSignal')
const kAborted = Symbol('kAborted')
const kReason = Symbol('kReason')
const kName = Symbol('kName')
const kOnabort = Symbol('kOnabort')

class EventTarget {
  constructor() {

  }
  dispatchEvent() {
    
  }
}

function createAbortSignal() {
  const signal = new EventTarget()
  Object.setPrototypeOf(signal, AbortSignal.prototype)
  signal[kAborted] = false
  signal[kReason] = undefined
  signal[kOnabort] = undefined
  return signal
}

function abortSignalAbort(signal, reason) {
  if (typeof reason === 'undefined') {
    reason = new DOMException('The operation was aborted.', 'AbortError')
  }
  if (signal.aborted) {
    return
  }

  signal[kReason] = reason
  signal[kAborted] = true
  signal.dispatchEvent(new Event('abort'))
}

module.exports.AbortController = class AbortController {
  constructor() {
    this[kSignal] = createAbortSignal()
  }

  get signal() {
    return this[kSignal]
  }

  abort(reason) {
    abortSignalAbort(this.signal, reason)
  }
}
