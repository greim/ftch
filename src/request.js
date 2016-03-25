'use strict';

const http = require('http');
const https = require('https');

module.exports = function request(opts, body, telemetry) {
  return new Promise((resolve, reject) => {
    let req;
    if (opts.protocol === 'https:') {
      req = https.request;
    } else if (opts.protocol === 'http:') {
      req = http.request;
    } else {
      const err = new Error(`Missing or invalid protocol: ${JSON.stringify(opts.protocol)}`);
      throw err;
    }
    const writable = req(opts, resolve);
    writable.on('error', reject);
    writable.on('finish', () => telemetry.emit('sent'));
    write(writable, body);
  });
};

function write(writable, body) {
  if (!body) {
    writable.end('');
  } else if (typeof body === 'string') {
    writable.setEncoding('utf8');
    writable.end(body);
  } else if (Buffer.isBuffer(body)) {
    writable.end(body);
  } else if (typeof writable === 'object') {
    if (typeof writable.pipe === 'function') {
      body.pipe(writable);
    } else {
      writable.setEncoding('utf8');
      writable.end(JSON.stringify(body));
    }
  } else {
    const err = new TypeError('Unsupported body type');
    throw err;
  }
}
