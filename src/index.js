'use strict';

const Fetcher = require('./fetcher');
const defaultOpts = require('./default-options');

const topFetcher = new Fetcher('http://localhost/', {}, defaultOpts);

function extend(fetcher) {
  const fetch = fetcher.fetch.bind(fetcher);
  fetch.extend = function(url, params, options) {
    const child = fetcher.extend(url, params, options);
    return extend(child);
  };
  return fetch;
}

module.exports = extend(topFetcher);
