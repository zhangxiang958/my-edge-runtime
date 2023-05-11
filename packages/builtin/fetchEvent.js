// https://github.com/mysticatea/event-target-shim/blob/master/src/lib/event.ts#L61
module.exports.FetchEvent = class FetchEvent {
  constructor(request) {
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
