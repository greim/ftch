/*eslint-env mocha */
'use strict';

/*
 * Adopted from:
 * https://github.com/aslakhellesoy/express-uri-template
 */

const urlTemplateFn = require('./url-template-fn');
const assert = require('assert');

describe('URL template function', function() {

  it('expands a template using object', function() {
    const params = {
      bar: 9,
      snip: 'yo'
    };
    assertRoute('/foo/:bar/zap/:snip', '/foo/9/zap/yo', params);
  });

  it('expands a template using req.params style Array', function() {
    const params = [];
    params['bar'] = 9;
    params['snip'] = 'yo';

    assertRoute('/foo/:bar/zap/:snip', '/foo/9/zap/yo', params);
  });

  it('expands a template with path globs', function() {
    const params = [];
    params['bar'] = 9;
    params[0] = 'yo';
    params[1] = 'there';

    assertRoute('/foo/:bar/zap/*/hello/*', '/foo/9/zap/yo/hello/there', params);
  });

  it('escapes params', function() {
    const params = { name: 'oh hai' };
    assertRoute('/foo/:name', '/foo/oh%20hai', params);
  });

  it('allows unexpanded params', function() {
    const params = {};
    assertRoute('/foo/:name', '/foo/:name', params);
  });
});

function assertRoute(pattern, path, params) {
  assert.equal(urlTemplateFn(pattern, params), path);
}
