'use strict';

const urlTools = require('url');
const http = require('http');
const https = require('https');
const spatts = require('./status-patterns');

module.exports = followRedirects;

const max = 20;

function followRedirects(resp, telemetry) {
  return new Promise((resolve, reject) => {
    again(resp, 0);
    function again(aResp, count) {
      if (isRedirect(aResp)) {
        if (count >= max) {
          const err = new Error(`Maximum of ${max} redirects exceeded`);
          reject(err);
        } else {
          const url = aResp.headers.location;
          const pUrl = urlTools.parse(url);
          const handler = r => again(r, count + 1);
          const get = pUrl.protocol === 'https:' ? https.get : http.get;
          telemetry.push('redirects', url);
          telemetry.emit('redirect');
          get(pUrl, handler).on('error', reject);
        }
      } else {
        resolve(aResp);
      }
    }
  });
}

function isRedirect(resp) {
  return spatts.redirect.test(resp.statusCode)
    && resp.headers.location;
}
