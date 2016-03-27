/*eslint-env mocha */
'use strict';

const assert = require('assert');
const http = require('http');
const https = require('https');
const fetch = require('.');
const s2s = require('string-to-stream');
const fs = require('fs');

const handler = (rq, rs) => {
  rs.writeHead(200, {
    'x-foo-headers': JSON.stringify(rq.headers),
    'x-foo-url': rq.url,
    'x-foo-method': rq.method
  });
  rq.pipe(rs);
};
const key = fs.readFileSync(__dirname + '/../test-data/fake-key.pem'); // eslint-disable-line no-sync
const cert = fs.readFileSync(__dirname + '/../test-data/fake-cert.pem'); // eslint-disable-line no-sync
const options = { key, cert };
const server = http.createServer(handler).listen();
const server2 = https.createServer(options, handler).listen();
const addr = server.address();
const hostname = addr.address;
const port = addr.port;
const addr2 = server2.address();
const hostname2 = addr2.address;
const port2 = addr2.port;

describe('fetch', () => {

  describe('top-level', () => {

    it('should be a function', () => {
      assert.strictEqual(typeof fetch, 'function');
    });

    it('should fetch a url', () => {
      return fetch(`http://localhost:${port}/`)
      .then(resp => {
        assert(resp.headers['x-foo-url'] === '/');
      });
    });

    it('should fetch a url with a param', () => {
      return fetch(`http://localhost:${port}/:id`, { id: 'xyz' })
      .then(resp => {
        assert(resp.headers['x-foo-url'] === '/xyz');
      });
    });

    it('should escape a param', () => {
      return fetch(`http://localhost:${port}/:id`, { id: ' ' })
      .then(resp => {
        assert(resp.headers['x-foo-url'] === '/%20');
      });
    });

    it('should fetch as text', () => {
      return fetch(`http://localhost:${port}/:id`, { id: ' ' }, { as: 'text' })
      .then(str => {
        assert(str === '');
      });
    });

    it('should send a string body', () => {
      const opts = { method: 'POST', as: 'text', body: 'abc' };
      return fetch(`http://localhost:${port}/:id`, { id: ' ' }, opts)
      .then(str => {
        assert(str === 'abc');
      });
    });

    it('should send a buffer body', () => {
      const opts = { method: 'POST', as: 'text', body: new Buffer('abc', 'utf8') };
      return fetch(`http://localhost:${port}/:id`, { id: ' ' }, opts)
      .then(str => {
        assert(str === 'abc');
      });
    });

    it('should send a stream body', () => {
      const opts = { method: 'POST', as: 'text', body: s2s('abc') };
      return fetch(`http://localhost:${port}/:id`, { id: ' ' }, opts)
      .then(str => {
        assert(str === 'abc');
      });
    });

    it('should send object body', () => {
      const opts = { method: 'POST', as: 'text', body: { foo: 2 } };
      return fetch(`http://localhost:${port}/:id`, { id: ' ' }, opts)
      .then(str => {
        assert(str === JSON.stringify({ foo: 2 }));
      });
    });

    it('should fetch as json', () => {
      const opts = { method: 'POST', as: 'json', body: { foo: 2 } };
      return fetch(`http://localhost:${port}/:id`, { id: ' ' }, opts)
      .then(obj => {
        assert.deepEqual(obj, { foo: 2 });
      });
    });

    it('should fetch as buffer', () => {
      const opts = { method: 'POST', as: 'buffer', body: 'hello' };
      return fetch(`http://localhost:${port}/:id`, { id: ' ' }, opts)
      .then(buf => {
        assert(Buffer.isBuffer(buf));
        assert(buf.toString('utf8') === 'hello');
      });
    });
  });
});
