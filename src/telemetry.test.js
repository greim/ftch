/*eslint-env mocha */
'use strict';

const assert = require('assert');
const sinon = require('sinon');
const events = require('events');
const Telemetry = require('./telemetry');

const EE = events.EventEmitter;

describe('telemetry', () => {

  it('should construct', () => {
    const tel = new Telemetry({ // eslint-disable-line no-unused-vars
      url: 'http://foo.bar/',
      params: {},
      opts: { telemetry() {} }
    });
  });

  it('should set', () => {
    const tel = new Telemetry({
      url: 'http://foo.bar/',
      params: {},
      opts: { telemetry() {} }
    });
    tel.set('foo', 'bar');
  });

  it('should push', () => {
    const tel = new Telemetry({
      url: 'http://foo.bar/',
      params: {},
      opts: { telemetry() {} }
    });
    tel.push('foo', 'bar');
  });

  it('should emit', () => {
    const telemetry = sinon.spy();
    const tel = new Telemetry({
      url: 'http://foo.bar/',
      params: {},
      opts: { telemetry }
    });
    tel.emit('hello');
    assert(telemetry.calledOnce);
  });

  it('should emit with event name', () => {
    const telemetry = sinon.spy();
    const tel = new Telemetry({
      url: 'http://foo.bar/',
      params: {},
      opts: { telemetry }
    });
    tel.emit('hello');
    const evName = telemetry.getCall(0).args[0];
    assert.strictEqual(evName, 'hello');
  });

  it('should emit with config data', () => {
    const telemetry = sinon.spy();
    const tel = new Telemetry({
      url: 'http://foo.bar/',
      params: {},
      opts: { telemetry }
    });
    tel.emit('hello');
    const configData = telemetry.getCall(0).args[1];
    assert(configData.hasOwnProperty('url'));
    assert(configData.hasOwnProperty('params'));
    assert(configData.hasOwnProperty('opts'));
  });

  it('should emit with set data', () => {
    const telemetry = sinon.spy();
    const tel = new Telemetry({
      url: 'http://foo.bar/',
      params: {},
      opts: { telemetry }
    });
    tel.set('foo', 'bar');
    tel.emit('hello');
    const configData = telemetry.getCall(0).args[1];
    assert(configData.foo === 'bar');
  });

  it('should emit with history', () => {
    const telemetry = sinon.spy();
    const tel = new Telemetry({
      url: 'http://foo.bar/',
      params: {},
      opts: { telemetry }
    });
    tel.emit('hello');
    const history = telemetry.getCall(0).args[2];
    assert(Array.isArray(history));
    assert(history.length === 1);
  });

  it('should have correct history props', () => {
    const telemetry = sinon.spy();
    const tel = new Telemetry({
      url: 'http://foo.bar/',
      params: {},
      opts: { telemetry }
    });
    tel.emit('hello');
    const history = telemetry.getCall(0).args[2];
    assert(typeof history[0].event === 'string');
    assert(typeof history[0].abs === 'number');
    assert(typeof history[0].rel === 'number');
    assert(history[0].abs > history[0].rel);
  });

  it('should accept an event emitter', () => {
    const telemetry = new EE();
    const spy = sinon.spy();
    telemetry.on('hello', spy);
    const tel = new Telemetry({
      url: 'http://foo.bar/',
      params: {},
      opts: { telemetry }
    });
    tel.emit('hello');
    const args = spy.getCall(0).args;
    assert(args.length === 2);
    assert(typeof args[0] === 'object');
    assert(Array.isArray(args[1]));
  });
});
