'use strict';

const urlTools = require('url');
const http = require('http');
const request = require('./request');
const followRedirects = require('./follow-redirects');
const spatts = require('./status-patterns');
const dashify = require('./dashify');
const defaultOpts = require('./default-options');

const alrighty = Promise.resolve();

module.exports = function fetch(url, opts, telemetry) {
  return alrighty.then(() => {
    const pUrl = urlTools.parse(url);
    const headers = getHeaders(opts);
    telemetry.set('requestHeaders', headers);
    telemetry.emit('start');
    const reqOpts = getRequestOpts(pUrl, opts, headers);
    return request(reqOpts, opts.body, telemetry);
  }).then(resp => {
    return opts.followRedirects
      ? followRedirects(resp, opts.events, telemetry)
      : resp;
  }).then(resp => {
    telemetry.set('status', resp.statusCode);
    telemetry.set('responseHeaders', resp.headers);
    telemetry.emit('received');
    if (opts.successOnly) { checkSuccess(resp, opts); }
    resp.text = textifier(resp, telemetry);
    resp.json = jsonifier(resp, telemetry);
    return resp;
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

function textifier(resp, telemetry) {
  return function text() {
    return collect(resp).then(txt => {
      telemetry.set('responseBody', txt);
      telemetry.emit('buffered');
      return txt;
    });
  };
}

function jsonifier(resp, telemetry) {
  return function text() {
    return collect(resp).then(txt => {
      const obj = JSON.parse(txt);
      telemetry.set('responseBody', obj);
      telemetry.emit('buffered');
      return obj;
    });
  };
}

function collect(readable) {
  return new Promise((resolve, reject) => {
    readable.setEncoding('utf8');
    const chunks = [];
    readable.on('error', reject);
    readable.on('data', chunk => chunks.push(chunk));
    readable.on('end', () => {
      const txt = chunks.join('');
      resolve(txt);
    });
  });
}

function getRequestOpts(pUrl, opts, headers) {
  return {
    protocol: pUrl.protocol,
    hostname: pUrl.hostname,
    port: pUrl.port,
    method: opts.method || 'GET',
    path: pUrl.path,
    headers: headers,
  };
}

function getHeaders(opts) {
  const headers = {};
  for (const prop of Object.keys(opts)) {
    if (!defaultOpts.hasOwnProperty(prop)) {
      headers[dashify(prop)] = opts[prop];
    }
  }
  if (typeof opts.headers === 'object') {
    Object.assign(headers, opts.headers);
  }
  return headers;
}
