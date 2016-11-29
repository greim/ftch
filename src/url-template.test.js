/*eslint-env mocha */
'use strict';

const assert = require('assert');
const ut = require('./url-template');

describe('url-template', () => {

  it('should be a function', () => {
    assert.strictEqual(typeof ut, 'function');
  });

  it('should create a URL with no params', () => {
    const url = ut('foo/bar', {});
    assert.strictEqual(url, 'foo/bar');
  });

  it('should create a URL with two params', () => {
    const url = ut('foo/:bar/:baz', { bar: '1', baz: '2' });
    assert.strictEqual(url, 'foo/1/2');
  });

  it('should escape params', () => {
    const url = ut('foo/:id', { id: '1 3' });
    assert.strictEqual(url, 'foo/1%203');
  });

  it('should create a relative URL', () => {
    const url = ut('foo/:id', { id: '123' });
    assert.strictEqual(url, 'foo/123');
  });

  it('should create a root-relative URL', () => {
    const url = ut('/foo/:id', { id: '123' });
    assert.strictEqual(url, '/foo/123');
  });

  it('should create a protocol-relative URL', () => {
    const url = ut('//foo.com/foo/:id', { id: '123' });
    assert.strictEqual(url, '//foo.com/foo/123');
  });

  it('should create a protocol-relative URL with a port', () => {
    const url = ut('//foo.com:8080/foo/:id', { id: '123' });
    assert.strictEqual(url, '//foo.com:8080/foo/123');
  });

  it('should create an absolute URL', () => {
    const url = ut('http://foo.com/foo/:id', { id: '123' });
    assert.strictEqual(url, 'http://foo.com/foo/123');
  });

  it('should create an absolute URL with a port', () => {
    const url = ut('http://foo.com:80/foo/:id', { id: '123' });
    assert.strictEqual(url, 'http://foo.com:80/foo/123');
  });

  it('should create a URL with a query string', () => {
    const url = ut('/foo?bar=3', {});
    assert.strictEqual(url, '/foo?bar=3');
  });

  it('should create a URL with a param in a query string', () => {
    const url = ut('/foo?bar=:id', { id: '123' });
    assert.strictEqual(url, '/foo?bar=123');
  });

  it('should not throw on missing param', () => {
    ut('/foo?bar=:id', { x: '123' });
  });

  it('should optionally throw on missing param', () => {
    assert.throws(() => ut('/foo?bar=:id', { x: '123' }, true), /There were unexpanded params/);
  });

  it('should ignore unused params', () => {
    const url = ut('/foo?bar=123', { x: '123' });
    assert.strictEqual(url, '/foo?bar=123');
  });
});
