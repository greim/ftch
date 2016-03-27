/*eslint-env mocha */
'use strict';

const assert = require('assert');
const sinon = require('sinon');
const Telemetry = require('./telemetry');
const events = require('events');

const EventEmitter = events.EventEmitter;

describe('telemetry', () => {

  it('should construct', () => {
    const tel = new Telemetry({ // eslint-disable-line no-unused-vars
      url: 'http://foo.bar/',
      params: {},
      opts: { telemetry: new EventEmitter() }
    });
  });

  it('should set', () => {
    const tel = new Telemetry({
      url: 'http://foo.bar/',
      params: {},
      opts: { telemetry: new EventEmitter() }
    });
    tel.set('foo', 'bar');
  });

  it('should push', () => {
    const tel = new Telemetry({
      url: 'http://foo.bar/',
      params: {},
      opts: { telemetry: new EventEmitter() }
    });
    tel.push('foo', 'bar');
  });

  it('should emit', () => {
    const ev = new EventEmitter();
    const spy = sinon.spy();
    ev.on('progress', spy);
    const tel = new Telemetry({
      url: 'http://foo.bar/',
      params: {},
      opts: { telemetry: ev }
    });
    tel.emit('hello');
    assert(spy.calledOnce);
  });

  it('should emit with event name', () => {
    const ev = new EventEmitter();
    const spy = sinon.spy();
    ev.on('progress', spy);
    const tel = new Telemetry({
      url: 'http://foo.bar/',
      params: {},
      opts: { telemetry: ev }
    });
    tel.emit('hello');
    const evName = spy.getCall(0).args[0];
    assert.strictEqual(evName, 'hello');
  });

  it('should emit with config data', () => {
    const ev = new EventEmitter();
    const spy = sinon.spy();
    ev.on('progress', spy);
    const tel = new Telemetry({
      url: 'http://foo.bar/',
      params: {},
      opts: { telemetry: ev }
    });
    tel.emit('hello');
    const configData = spy.getCall(0).args[1];
    assert(configData.hasOwnProperty('url'));
    assert(configData.hasOwnProperty('params'));
    assert(configData.hasOwnProperty('opts'));
  });

  it('should emit with set data', () => {
    const ev = new EventEmitter();
    const spy = sinon.spy();
    ev.on('progress', spy);
    const tel = new Telemetry({
      url: 'http://foo.bar/',
      params: {},
      opts: { telemetry: ev }
    });
    tel.set('foo', 'bar');
    tel.emit('hello');
    const configData = spy.getCall(0).args[1];
    assert(configData.foo === 'bar');
  });

  it('should emit with history', () => {
    const ev = new EventEmitter();
    const spy = sinon.spy();
    ev.on('progress', spy);
    const tel = new Telemetry({
      url: 'http://foo.bar/',
      params: {},
      opts: { telemetry: ev }
    });
    tel.emit('hello');
    const history = spy.getCall(0).args[2];
    assert(Array.isArray(history));
    assert(history.length === 1);
  });

  it('should have correct history props', () => {
    const ev = new EventEmitter();
    const spy = sinon.spy();
    ev.on('progress', spy);
    const tel = new Telemetry({
      url: 'http://foo.bar/',
      params: {},
      opts: { telemetry: ev }
    });
    tel.emit('hello');
    const history = spy.getCall(0).args[2];
    assert(typeof history[0].event === 'string');
    assert(typeof history[0].abs === 'number');
    assert(typeof history[0].rel === 'number');
    assert(history[0].abs > history[0].rel);
  });
});
