'use strict';

const urlTools = require('url');
const http = require('http');
const request = require('./request');
const followRedirects = require('./follow-redirects');
const spatts = require('./status-patterns');
const urlTemplate = require('./url-template');
const querystring = require('querystring');
const getRespEncoding = require('./get-response-encoding');

const alrighty = Promise.resolve();

module.exports = function fetch(urlTpl, params, opts, telemetry) {
  return alrighty.then(() => {
    let url = urlTemplate(urlTpl, params);
    url = addQuery(url, opts.query);
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
    } else if (!opts.as || opts.as === 'stream') {
      telemetry.emit('done');
      resp.buffer = bufferify.bind(null, resp);
      resp.text = textify.bind(null, resp);
      resp.json = jsonify.bind(null, resp);
      return resp;
    } else {
      const err = new Error(`'${opts.as}' is not a valid value for 'as'`);
      throw err;
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
      message = `Unknown status: ${status} ${statusMessage}`;
    }
    const err = new Error(message);
    err.status = status;
    throw err;
  }
}

function textify(resp, telemetry) {
  return collect(resp).then(chunks => {
    const buffer = Buffer.concat(chunks);
    const enc = getRespEncoding(resp);
    const str = buffer.toString(enc);
    if (telemetry) {
      telemetry.set('responseBody', str);
      telemetry.emit('buffered');
      telemetry.emit('done');
    }
    return str;
  });
}

function jsonify(resp, telemetry) {
  return collect(resp).then(chunks => {
    const buffer = Buffer.concat(chunks);
    const enc = getRespEncoding(resp);
    const str = buffer.toString(enc);
    const obj = JSON.parse(str);
    if (telemetry) {
      telemetry.set('responseBody', obj);
      telemetry.emit('buffered');
      telemetry.emit('done');
    }
    return obj;
  });
}

function bufferify(resp, telemetry) {
  return collect(resp).then(chunks => {
    const buffer = Buffer.concat(chunks);
    if (telemetry) {
      telemetry.set('responseBody', buffer);
      telemetry.emit('buffered');
      telemetry.emit('done');
    }
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
  const result = {
    protocol: pUrl.protocol,
    hostname: pUrl.hostname,
    port: pUrl.port,
    method: opts.method || 'GET',
    path: pUrl.path,
    headers: headers,
    rejectUnauthorized: opts.rejectUnauthorized,
  };
  for (const prop of passThruOpts) {
    if (opts.hasOwnProperty(prop)) {
      result[prop] = opts[prop];
    }
  }
  return result;
}

function addQuery(url, query) {
  if (!query) {
    return url;
  } else {
    const pUrl = urlTools.parse(url, true);
    const fullQuery = Object.assign(pUrl.query, query);
    pUrl.search = querystring.stringify(fullQuery);
    return urlTools.format(pUrl);
  }
}

const passThruOpts = [
  'family',
  'auth',
  'agent',
  'pfx',
  'key',
  'passphrase',
  'cert',
  'ca',
  'ciphers',
  'rejectUnauthorized',
  'secureProtocol',
  'servername',
];
