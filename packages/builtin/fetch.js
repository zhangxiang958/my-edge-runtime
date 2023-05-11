const { fetch } = require('undici/lib/fetch');
const Response = require('undici/lib/fetch/response');
const Agent = require('undici/lib/agent');

const fetchImpl = fetch;

let globalDispatcher = new Agent()

module.exports.getGlobalDispatcher = function getGlobalDispatcher() {
  return globalDispatcher
}

module.exports.Response = Response.Response;
module.exports.fetch = async function fetch() {
  const res = await fetchImpl.apply(getGlobalDispatcher(), arguments)
  const response = new Response(res.body, res)
  Object.defineProperty(response, 'url', { value: res.url })
  return response
}
