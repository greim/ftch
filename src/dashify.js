'use strict';

const patt = /([A-Z]+)/g;

module.exports = function dashify(s) {
  return s.replace(patt, function($0, $1) {
    return '-' + $1.toLowerCase();
  });
};
