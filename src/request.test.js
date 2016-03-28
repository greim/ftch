/*eslint-env mocha */
'use strict';

const assert = require('assert');
const req = require('./request');
const Telemetry = require('./telemetry');
const s2s = require('string-to-stream');
const testServer = require('../test-data/test-server');

const server = testServer();
const hostname = server.httpAddr.address;
const port = server.httpAddr.port;
const hostname2 = server.httpsAddr.address;
const port2 = server.httpsAddr.port;
const tel = new Telemetry({opts:{}});

describe('request', () => {

  it('should be a function', () => {
    assert.strictEqual(typeof req, 'function');
  });

  it('should send url', () => {
    return req({
      protocol: 'http:',
      hostname,
      port,
      path: '/foo'
    }, null, tel).then(resp => {
      assert.strictEqual(resp.headers['x-url'], '/foo');
    });
  });

  it('should send method', () => {
    return req({
      method: 'POST',
      protocol: 'http:',
      hostname,
      port,
      path: '/foo'
    }, null, tel).then(resp => {
      assert.strictEqual(resp.headers['x-method'], 'POST');
    });
  });

  it('should send headers', () => {
    return req({
      protocol: 'http:',
      hostname,
      port,
      path: '/foo',
      headers: { 'x-blah': 'bar' }
    }, null, tel).then(resp => {
      const headers = JSON.parse(resp.headers['x-headers']);
      assert.strictEqual(headers['x-blah'], 'bar');
    });
  });

  it('should send string as body', () => {
    return req({
      method: 'POST',
      protocol: 'http:',
      hostname,
      port,
      path: '/foo',
    }, 'hello', tel)
    .then(resp => collect(resp))
    .then(body => {
      assert.strictEqual(body, 'hello');
    });
  });

  it('should send obj as body', () => {
    return req({
      method: 'POST',
      protocol: 'http:',
      hostname,
      port,
      path: '/foo',
    }, { foo: 3 }, tel)
    .then(resp => collect(resp))
    .then(str => JSON.parse(str))
    .then(obj => {
      assert.deepEqual(obj, { foo: 3 });
    });
  });

  it('should send buffer as body', () => {
    return req({
      method: 'POST',
      protocol: 'http:',
      hostname,
      port,
      path: '/foo',
    }, new Buffer('pwpwpwpwp', 'utf8'), tel)
    .then(resp => collect(resp))
    .then(str => {
      assert.strictEqual(str, 'pwpwpwpwp');
    });
  });

  it('should send stream as body', () => {
    return req({
      method: 'POST',
      protocol: 'http:',
      hostname,
      port,
      path: '/foo',
    }, s2s('fgdskhf'), tel)
    .then(resp => collect(resp))
    .then(str => {
      assert.strictEqual(str, 'fgdskhf');
    });
  });

  it('should connect over https', () => {
    return req({
      method: 'POST',
      protocol: 'https:',
      hostname: hostname2,
      port: port2,
      path: '/foo',
      rejectUnauthorized: false
    }, 'fgdskhf', tel)
    .then(resp => collect(resp))
    .then(str => {
      assert.strictEqual(str, 'fgdskhf');
    });
  });
});

function collect(readable) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readable.on('error', reject);
    readable.on('data', chunk => chunks.push(chunk));
    readable.on('end', () => {
      const buf = Buffer.concat(chunks);
      const str = buf.toString('utf8');
      resolve(str);
    });
  });
}
