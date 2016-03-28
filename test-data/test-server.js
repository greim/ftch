'use strict';

const http = require('http');
const https = require('https');
const fs = require('fs');

// mock up a variety of servers for testing purposes

module.exports = function() {
  const handler = (rq, rs) => {
    const status = parseInt(rq.headers['x-status'] || '200', 10);
    rs.writeHead(status, {
      'x-headers': JSON.stringify(rq.headers),
      'x-url': rq.url,
      'x-method': rq.method
    });
    rq.pipe(rs);
  };
  const key = fs.readFileSync(__dirname + '/fake-key.pem'); // eslint-disable-line no-sync
  const cert = fs.readFileSync(__dirname + '/fake-cert.pem'); // eslint-disable-line no-sync
  const options = { key, cert };
  const httpServer = http.createServer(handler).listen();
  const httpsServer = https.createServer(options, handler).listen();
  const httpAddr = httpServer.address();
  const httpsAddr = httpsServer.address();

  function rHandler(rq, rs) {
    if (/^\/[\d]+/.test(rq.url)) {
      let num = parseInt(rq.url.substring(1), 10);
      num--;
      rs.writeHead(301, { location: `http://localhost:${redirPort}/${num}` });
      rs.end('');
    } else {
      rs.writeHead(200, {});
      rs.end('');
    }
  }
  const redirServer = http.createServer(rHandler).listen();
  const redirectAddr = redirServer.address();
  const redirPort = redirectAddr.port;
  return { httpAddr, httpsAddr, redirectAddr };
};
