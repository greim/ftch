'use strict';

const urlTools = require('url');
const http = require('http');
const request = require('./request');
const followRedirects = require('./follow-redirects');
const spatts = require('./status-patterns');
const urlTemplate = require('./url-template');

const alrighty = Promise.resolve();

module.exports = function fetch(urlTpl, params, opts, telemetry) {
  return alrighty.then(() => {
    const url = urlTemplate(urlTpl, params);
    const pUrl = urlTools.parse(url);
    const headers = opts.headers;
    telemetry.set('requestHeaders', headers);
    telemetry.emit('start');
    const reqOpts = getRequestOpts(pUrl, opts, headers);
    return request(reqOpts, opts.body, telemetry);
  }).then(resp => {
    return opts.followRedirects
      ? followRedirects(resp, telemetry)
      : resp;
  }).then(resp => {
    telemetry.set('status', resp.statusCode);
    telemetry.set('responseHeaders', resp.headers);
    telemetry.emit('received');
    if (opts.successOnly) { checkSuccess(resp, opts); }
    if (opts.as === 'text') {
      return textify(resp, telemetry);
    } else if (opts.as === 'json') {
      return jsonify(resp, telemetry);
    } else if (opts.as === 'buffer') {
      return bufferify(resp, telemetry);
    } else {
      return resp;
    }
  });
};

function checkSuccess(resp) {
  const status = resp.statusCode;
  if (!spatts.success.test(status)) {
    const statusMessage = http.STATUS_CODES[status];
    let message;
    if (spatts.server.test(status)) {
      message = `Server error ${status}: ${statusMessage}`;
    } else if (spatts.client.test(status)) {
      message = `Server error ${status}: ${statusMessage}`;
    } else if (spatts.client.test(status)) {
      message = `Redirect ${status}: ${statusMessage}`;
    } else if (spatts.client.test(status)) {
      message = `Provisional ${status}: ${statusMessage}`;
    } else {
      message = `Unknown status ${status}: ${statusMessage}`;
    }
    const err = new Error(message);
    err.status = status;
    throw err;
  }
}

function textify(resp, telemetry) {
  return collect(resp).then(chunks => {
    const buffer = Buffer.concat(chunks);
    const str = buffer.toString('utf8');
    telemetry.set('responseBody', str);
    telemetry.emit('buffered');
    return str;
  });
}

function jsonify(resp, telemetry) {
  return collect(resp).then(chunks => {
    const buffer = Buffer.concat(chunks);
    const str = buffer.toString('utf8');
    const obj = JSON.parse(str);
    telemetry.set('responseBody', obj);
    telemetry.emit('buffered');
    return obj;
  });
}

function bufferify(resp, telemetry) {
  return collect(resp).then(chunks => {
    const buffer = Buffer.concat(chunks);
    telemetry.set('responseBody', buffer);
    telemetry.emit('buffered');
    return buffer;
  });
}

function collect(readable) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readable.on('error', reject);
    readable.on('data', chunk => chunks.push(chunk));
    readable.on('end', () => {
      resolve(chunks);
    });
  });
}

function getRequestOpts(pUrl, opts, headers) {
  return Object.assign({}, opts.requestOpts, {
    protocol: pUrl.protocol,
    hostname: pUrl.hostname,
    port: pUrl.port,
    method: opts.method || 'GET',
    path: pUrl.path,
    headers: headers,
  });
}
