
module.exports.Request = require('undici/lib/fetch/request').Request;

// 没有办法直接这样导出，因为 Request 属于 node dom 的 builtin 类
// module.exports = Request;