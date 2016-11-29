'use strict';

/*
 * Adopted from:
 * https://github.com/aslakhellesoy/express-uri-template
 */

module.exports = function(pattern, params) {
  let result = pattern;

  // First, replace non-glob params (:xxx params)
  for (let param in params) { // eslint-disable-line guard-for-in
    result = result.replace(':' + param, encodeURIComponent(params[param]));
  }

  // Second, replace glob params (*)
  if (Array.isArray(params)) {
    for (const param of params) {
      result = result.replace('*', encodeURIComponent(param));
    }
  }

  // I didn't want this behavior from express-uri-template
  // but leaving this here for instructional purposes
  //if (result.match(/[\*:]/)) {
  //  throw new Error('There were unexpanded params: ' + result);
  //}

  return result;
};
