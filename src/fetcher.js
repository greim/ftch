'use strict';

const urlTools = require('url');
const fetch = require('./fetch');
const Telemetry = require('./telemetry');

class Fetcher {

  constructor(url, params, opts) {
    this._ = { url, params, opts };
  }

  fetch(url, params, opts) {
    const args = resolveArgs(url, params, opts);
    const merged = extendArgs(this._, args);
    const telemetry = new Telemetry(merged);
    return fetch(merged.url, merged.params, merged.opts, telemetry);
  }

  extend(url, params, opts) {
    const args = resolveArgs(url, params, opts);
    const merged = extendArgs(this._, args);
    return new Fetcher(merged.url, merged.params, merged.opts);
  }
}

module.exports = Fetcher;

function resolveArgs(url, params, opts) {
  if (typeof url !== 'string') {
    opts = params;
    params = url;
    url = '';
  }
  opts = opts || {};
  opts.headers = opts.headers || {};
  opts.query = opts.query || {};
  params = params || {};
  url = url || '';
  return { opts, params, url };
}

function extendArgs(parent, child) {
  const merged = {};
  merged.url = urlTools.resolve(parent.url, child.url);
  merged.params = Object.assign({}, parent.params, child.params);
  merged.opts = Object.assign({}, parent.opts, child.opts);
  merged.opts.headers = Object.assign({}, parent.opts.headers, child.opts.headers);
  merged.opts.query = Object.assign({}, parent.opts.query, child.opts.query);
  const parTel = getAsArr(parent.telemetry);
  const chiTel = getAsArr(child.telemetry);
  merged.telemetry = parTel.concat(chiTel);
  if (merged.telemetry.length === 0) {
    delete merged.telemetry;
  } else if (merged.telemetry.length === 1) {
    merged.telemetry = merged.telemetry[0];
  }
  return merged;
}

function getAsArr(thing) {
  if (!thing) {
    return [];
  } else if (!Array.isArray(thing)) {
    return [thing];
  } else {
    return thing;
  }
}
