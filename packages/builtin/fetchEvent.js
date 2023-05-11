// https://github.com/mysticatea/event-target-shim/blob/master/src/lib/event.ts#L61
class EventTarget {
  constructor() {

  }
  dispatchEvent() {
    
  }
}

module.exports.FetchEvent = class FetchEvent extends EventTarget {
  constructor(request) {
    super();
    this.request = request;
    this.response = null;
    this.awaiting = new Set();
  }

  respondWith(response) {
    this.response = response;
  }

  waitUnit(promise) {
    this.awaiting.add(promise);
    promise.finally(() => {
      this.awaiting.delete(promise);
    });
  }
}
