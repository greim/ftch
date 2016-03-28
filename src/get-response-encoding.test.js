/*eslint-env mocha */
'use strict';

const assert = require('assert');
const gre = require('./get-response-encoding');

describe('get-response-encoding', () => {

  it('should return "utf8" if not found (1)', () => {
    assert.strictEqual(gre({}), 'utf8');
  });

  it('should return "utf8" if not found (2)', () => {
    assert.strictEqual(gre({ headers:{}}), 'utf8');
  });

  it('should return "utf8" if not found (3)', () => {
    assert.strictEqual(gre({ headers:{
      'content-type': 'text/plain'
    }}), 'utf8');
  });

  it('should return "utf8" if found "utf-8"', () => {
    assert.strictEqual(gre({ headers: {
      'content-type': 'application/json; charset=utf-8'
    }}), 'utf8');
  });

  it('should return "utf8" if found "UTF-8"', () => {
    assert.strictEqual(gre({ headers: {
      'content-type': 'text/plain; charset=UTF-8'
    }}), 'utf8');
  });

  it('should return "utf8" if found "CHARSET=utf-8"', () => {
    assert.strictEqual(gre({ headers: {
      'content-type': 'text/plain; CHARSET=utf-8'
    }}), 'utf8');
  });

  it('should return "foo" if found "foo"', () => {
    assert.strictEqual(gre({ headers: {
      'content-type': 'text/html; charset=foo'
    }}), 'foo');
  });

  it('should return "foo" if found "FOO"', () => {
    assert.strictEqual(gre({ headers: {
      'content-type': 'text/html; charset=FOO'
    }}), 'foo');
  });

  it('should ignore header case', () => {
    assert.strictEqual(gre({ headers: {
      'content-type': 'TeXt/HtMl; ChArSeT=FoO'
    }}), 'foo');
  });
});
