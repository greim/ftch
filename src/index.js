'use strict';

const Fetcher = require('./fetcher');

module.exports.create = function(url, opts) {
  return new Fetcher(url, opts);
};
