'use strict';

const contentType = require('content-type');

/*
module.exports = function getRespEncoding(resp) {
  const header = ((resp.headers||{})['content-type']||'').toLowerCase();
  const pre = '; charset=';
  const iop = header.indexOf(pre);
  let encoding;
  if (iop > -1) {
    encoding = header.substring(iop + pre.length);
    if (!encoding || encoding === 'utf-8') {
      encoding = 'utf8';
    }
  } else {
    encoding = 'utf8';
  }
  return encoding;
};
*/

module.exports = function getRespEncoding(resp) {
  const header = (resp.headers||{})['content-type'];
  let encoding;
  if (header) {
    const obj = contentType.parse(header);
    const params = obj.parameters;
    encoding = params.charset;
  }
  if (!encoding) {
    encoding = 'utf8';
  } else {
    encoding = encoding.toLowerCase();
  }
  if (encoding === 'utf-8') {
    encoding = 'utf8';
  }
  return encoding;
};
