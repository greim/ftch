/*eslint-env mocha */
'use strict';

const assert = require('assert');
const fr = require('./follow-redirects');
const Telemetry = require('./telemetry');
const http = require('http');
const url = require('url');

const server = http.createServer(handler).listen();
const addr = server.address();
const port = addr.port;
const tel = new Telemetry({opts:{}});
function handler(rq, rs) {
  if (/^\/[\d]+/.test(rq.url)) {
    let num = parseInt(rq.url.substring(1), 10);
    num--;
    rs.writeHead(301, { location: `http://localhost:${port}/${num}` });
    rs.end('');
  } else {
    rs.writeHead(200, {});
    rs.end('');
  }
}

describe('follow-redirects', () => {

  it('should follow 0 redirects', (done) => {
    http.get(url.parse(`http://localhost:${port}/`), resp => {
      assert(resp.statusCode === 200);
      fr(resp, tel).then(resp2 => {
        assert(resp === resp2);
        done();
      }, done);
    });
  });

  it('should follow 1 redirects', (done) => {
    http.get(url.parse(`http://localhost:${port}/1`), resp => {
      assert(resp.statusCode === 301);
      fr(resp, tel).then(resp2 => {
        assert(resp2.statusCode === 200);
        done();
      }, done);
    });
  });

  it('should follow 2 redirects', (done) => {
    http.get(url.parse(`http://localhost:${port}/2`), resp => {
      assert(resp.statusCode === 301);
      fr(resp, tel).then(resp2 => {
        assert(resp2.statusCode === 200);
        done();
      }, done);
    });
  });

  it('should follow 19 redirects', (done) => {
    http.get(url.parse(`http://localhost:${port}/19`), resp => {
      assert(resp.statusCode === 301);
      fr(resp, tel).then(resp2 => {
        assert(resp2.statusCode === 200);
        done();
      }, done);
    });
  });

  it('should not follow 20 redirects', (done) => {
    http.get(url.parse(`http://localhost:${port}/20`), resp => {
      assert(resp.statusCode === 301);
      fr(resp, tel).then(() => {
        done(new Error('did not expect that to work'));
      }, err => {
        assert(err.message.includes('exceeded'));
        done();
      });
    });
  });

  it('should not follow 150 redirects', (done) => {
    http.get(url.parse(`http://localhost:${port}/150`), resp => {
      assert(resp.statusCode === 301);
      fr(resp, tel).then(() => {
        done(new Error('did not expect that to work'));
      }, err => {
        assert(err.message.includes('exceeded'));
        done();
      });
    });
  });
});
