/*eslint-env mocha */
'use strict';

const assert = require('assert');
const http = require('http');
const https = require('https');
const fetch = require('.');
const s2s = require('string-to-stream');
const fs = require('fs');

const handler = (rq, rs) => {
  const status = parseInt(rq.headers['x-status'] || '200', 10);
  rs.writeHead(status, {
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
const port = addr.port;
const addr2 = server2.address();
const port2 = addr2.port;

const rServer = http.createServer(rHandler).listen();
const rAddr = rServer.address();
const redirectPort = rAddr.port;
function rHandler(rq, rs) {
  if (/^\/[\d]+/.test(rq.url)) {
    let num = parseInt(rq.url.substring(1), 10);
    num--;
    rs.writeHead(301, { location: `http://localhost:${redirectPort}/${num}` });
    rs.end('');
  } else {
    rs.writeHead(200, {});
    rs.end('');
  }
}

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

    it('should fetch a url with a param in a query string', () => {
      return fetch(`http://localhost:${port}/doo?foo=:id`, { id: 'xyz' })
      .then(resp => {
        assert(resp.headers['x-foo-url'] === '/doo?foo=xyz');
      });
    });

    it('should escape a param', () => {
      return fetch(`http://localhost:${port}/:id`, { id: ' ' })
      .then(resp => {
        assert(resp.headers['x-foo-url'] === '/%20');
      });
    });

    it('should fetch as text', () => {
      return fetch(`http://localhost:${port}/`, {}, { as: 'text' })
      .then(str => {
        assert(str === '');
      });
    });

    it('should send a string body', () => {
      const opts = { method: 'POST', as: 'text', body: 'abc' };
      return fetch(`http://localhost:${port}/`, {}, opts)
      .then(str => {
        assert(str === 'abc');
      });
    });

    it('should send a buffer body', () => {
      const opts = { method: 'POST', as: 'text', body: new Buffer('abc', 'utf8') };
      return fetch(`http://localhost:${port}/`, {}, opts)
      .then(str => {
        assert(str === 'abc');
      });
    });

    it('should send a stream body', () => {
      const opts = { method: 'POST', as: 'text', body: s2s('abc') };
      return fetch(`http://localhost:${port}/`, {}, opts)
      .then(str => {
        assert(str === 'abc');
      });
    });

    it('should send object body', () => {
      const opts = { method: 'POST', as: 'text', body: { foo: 2 } };
      return fetch(`http://localhost:${port}/`, {}, opts)
      .then(str => {
        assert(str === JSON.stringify({ foo: 2 }));
      });
    });

    it('should fetch as json', () => {
      const opts = { method: 'POST', as: 'json', body: { foo: 2 } };
      return fetch(`http://localhost:${port}/`, {}, opts)
      .then(obj => {
        assert.deepEqual(obj, { foo: 2 });
      });
    });

    it('should fetch as buffer', () => {
      const opts = { method: 'POST', as: 'buffer', body: 'hello' };
      return fetch(`http://localhost:${port}/`, {}, opts)
      .then(buf => {
        assert(Buffer.isBuffer(buf));
        assert(buf.toString('utf8') === 'hello');
      });
    });

    it('should be successOnly by default', () => {
      const opts = { headers: { 'x-status': 404 } };
      return fetch(`http://localhost:${port}/`, {}, opts)
      .then(() => {
        throw new Error('nope');
      }, () => {
        // yep
      });
    });

    it('should honor successOnly == false', () => {
      const opts = { successOnly: false, headers: { 'x-status': 404 } };
      return fetch(`http://localhost:${port}/`, {}, opts)
      .then(resp => {
        assert(resp.statusCode === 404);
      });
    });

    it('successOnly should reject 1xx', () => {
      const opts = { headers: { 'x-status': 100 } };
      return fetch(`http://localhost:${port}/`, {}, opts)
      .then(() => {
        throw new Error('nope');
      }, () => {
        // yep
      });
    });

    it('successOnly should reject 3xx', () => {
      const opts = { followRedirects: false };
      return fetch(`http://localhost:${redirectPort}/1`, {}, opts)
      .then(() => {
        throw new Error('nope');
      }, () => {
        // yep
      });
    });

    it('successOnly should reject 4xx', () => {
      const opts = { headers: { 'x-status': 400 } };
      return fetch(`http://localhost:${port}/`, {}, opts)
      .then(() => {
        throw new Error('nope');
      }, () => {
        // yep
      });
    });

    it('successOnly should reject 5xx', () => {
      const opts = { headers: { 'x-status': 500 } };
      return fetch(`http://localhost:${port}/`, {}, opts)
      .then(() => {
        throw new Error('nope');
      }, () => {
        // yep
      });
    });

    it('should followRedirects by default', () => {
      //const opts = { headers: { 'x-status': 500 } };
      return fetch(`http://localhost:${redirectPort}/3`)
      .then(resp => {
        assert(resp.statusCode === 200);
      });
    });

    it('should honor followRedirects == false', () => {
      const opts = { followRedirects: false, successOnly: false };
      return fetch(`http://localhost:${redirectPort}/3`, {}, opts)
      .then(resp => {
        assert(resp.statusCode === 301);
        assert(resp.headers.location === `http://localhost:${redirectPort}/2`);
      });
    });

    it('should fetch over https', () => {
      return fetch(`https://localhost:${port2}/`, {}, {
        rejectUnauthorized: false
      })
      .then(resp => {
        assert(resp.statusCode === 200);
      });
    });

    it('should add query params', () => {
      return fetch(`http://localhost:${port}/`, {}, {
        query: { foo: 'bar' }
      })
      .then(resp => {
        assert.strictEqual(resp.headers['x-foo-url'], '/?foo=bar');
      });
    });

    it('should mix query params', () => {
      return fetch(`http://localhost:${port}/?baz=qux`, {}, {
        query: { foo: 'bar' }
      })
      .then(resp => {
        assert.strictEqual(resp.headers['x-foo-url'], '/?baz=qux&foo=bar');
      });
    });

    it('should convert null query params to empty string', () => {
      return fetch(`http://localhost:${port}/`, {}, {
        query: { foo: null }
      })
      .then(resp => {
        assert.strictEqual(resp.headers['x-foo-url'], '/?foo=');
      });
    });

    it('should convert undefined query params to empty string', () => {
      return fetch(`http://localhost:${port}/`, {}, {
        query: { foo: undefined }
      })
      .then(resp => {
        assert.strictEqual(resp.headers['x-foo-url'], '/?foo=');
      });
    });
  });

  describe('extended', () => {

    it('should extend', () => {
      fetch.extend(`http://localhost:${port}/:id`);
    });

    it('should extend twice', () => {
      fetch
      .extend(`http://localhost:${port}/:id`)
      .extend(`http://localhost:${port}/:id`);
    });

    it('should allow omitting URL', () => {
      const child = fetch.extend(`http://localhost:${port}/:id`);
      return child({ id: '234' })
      .then(resp => {
        assert(resp.headers['x-foo-url'] === '/234');
      });
    });

    it('should resolve a protocol-relative URL', () => {
      const child = fetch.extend(`http://localhost:${port}/`);
      return child(`//localhost:${port}/`)
      .then(resp => {
        assert(resp.headers['x-foo-url'] === '/');
      });
    });

    it('should resolve a root-relative URL', () => {
      const child = fetch.extend(`http://localhost:${port}/`);
      return child('/foo/bar')
      .then(resp => {
        assert(resp.headers['x-foo-url'] === '/foo/bar');
      });
    });

    it('should resolve a path-relative URL with a slash', () => {
      const child = fetch.extend(`http://localhost:${port}/foo/`);
      return child('foo/bar')
      .then(resp => {
        assert(resp.headers['x-foo-url'] === '/foo/foo/bar');
      });
    });

    it('should resolve a path-relative URL without a slash', () => {
      const child = fetch.extend(`http://localhost:${port}/foo`);
      return child('foo/bar')
      .then(resp => {
        assert(resp.headers['x-foo-url'] === '/foo/bar');
      });
    });

    it('should extend "as"', () => {
      const child = fetch.extend(`http://localhost:${port}/`, {}, { as: 'text' });
      return child('foo/bar')
      .then(str => {
        assert(typeof str === 'string');
      });
    });

    it('should extend "successOnly"', () => {
      const child = fetch.extend(`http://localhost:${port}/`, {}, { successOnly: 'false' });
      return child('foo/bar', {}, { headers: { 'x-status': 500 } })
      .then(() => {
        assert(false, 'nope');
      }, () => {});
    });

    it('should extend "successOnly" two levels down', () => {
      const child = fetch.extend(`http://localhost:${port}/`, {}, { successOnly: 'false' });
      const grandChild = child.extend('/foo');
      return grandChild({}, { headers: { 'x-status': 500 } })
      .then(() => {
        assert(false, 'nope');
      }, () => {});
    });

    it('should extend params', () => {
      const child = fetch.extend(`http://localhost:${port}/:foo/:bar`, { foo: 1 });
      return child({ bar: 2 })
      .then((resp) => {
        assert(resp.headers['x-foo-url'] === '/1/2');
      });
    });

    it('should extend query params', () => {
      const child = fetch.extend(`http://localhost:${port}/`, {}, { query: { foo: 'bar' } });
      return child({ bar: 2 }, { query: { baz: 'qux' } })
      .then((resp) => {
        assert(resp.headers['x-foo-url'] === '/?foo=bar&baz=qux');
      });
    });
  });
});
