'use strict';

const urlTools = require('url');
const fetch = require('./fetch');
const Telemetry = require('./telemetry');
const defaultOpts = require('./default-options');

class Fetcher {

  constructor(url, opts) {
    const merged = extendArgs('http://localhost/', defaultOpts, url, opts);
    this._ = merged;
  }

  fetch(url, opts) {
    const merged = extendArgs(this._.url, this._.opts, url, opts);
    const telemetry = new Telemetry(merged, merged.opts.events);
    return fetch(merged.url, merged.opts, telemetry);
  }

  fetchJson(url, opts) {
    return this.fetch(url, opts).then(res => res.json());
  }

  fetchText(url, opts) {
    return this.fetch(url, opts).then(res => res.text());
  }

  extend(url, opts) {
    const merged = extendArgs(this._.url, this._.opts, url, opts);
    return new Fetcher(merged.url, merged.opts);
  }
}

module.exports = Fetcher;

function extendArgs(baseUrl, baseOpts, url, opts) {
  opts = opts || {};
  opts.headers = opts.headers || {};
  const finalUrl = urlTools.resolve(baseUrl, url);
  const finalHeaders = Object.assign({}, baseOpts.headers, opts.headers);
  const finalOpts = Object.assign({}, baseOpts, opts);
  finalOpts.headers = finalHeaders;
  Object.freeze(finalOpts.headers);
  Object.freeze(finalOpts);
  return Object.freeze({ opts: finalOpts, url: finalUrl });
}
