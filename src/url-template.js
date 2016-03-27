'use strict';

const eut = require('express-uri-template');
const urlTools = require('url');
const _ = require('lodash');

class Template {

  constructor(tplStr) {
    let pUrl;
    if (tplStr.startsWith('//')) {
      pUrl = urlTools.parse('http:' + tplStr);
      pUrl.protocol = null;
    } else {
      pUrl = urlTools.parse(tplStr);
    }
    const path = pUrl.path;
    pUrl.path = null;
    pUrl.pathname = null;
    pUrl.href = null;
    this.base = urlTools.format(pUrl);
    this.path = path;
  }

  execute(data) {
    const path = eut(this.path, data);
    return urlTools.resolve(this.base, path);
  }
}

const getTemplate = _.memoize(function(tplStr) {
  return new Template(tplStr);
});

module.exports = function(tplStr, data) {
  const tpl = getTemplate(tplStr);
  return tpl.execute(data);
};
