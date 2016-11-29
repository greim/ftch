'use strict';

const urlTemplateFn = require('./url-template-fn');
const urlTools = require('url');
const _ = require('lodash');

class Template {

  constructor(tplStr) {
    const pUrl = urlTools.parse(tplStr, false, true);
    const path = pUrl.path;
    pUrl.path = null;
    pUrl.pathname = null;
    pUrl.href = null;
    this.base = urlTools.format(pUrl);
    this.path = path;
  }

  execute(data, requireParams) {
    const path = urlTemplateFn(this.path, data, requireParams);
    return urlTools.resolve(this.base, path);
  }
}

const getTemplate = _.memoize(function(tplStr) {
  return new Template(tplStr);
});

module.exports = function(tplStr, data, requireParams) {
  const tpl = getTemplate(tplStr);
  return tpl.execute(data, requireParams);
};
