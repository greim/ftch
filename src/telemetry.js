'use strict';

const incr = 1;

class Telemetry {

  constructor(events, info) {
    this._events = events;
    this._history = [];
    this._data = Object.assign({ id: incr++ }, info);
    this.history('init');
  }

  set(name, value) {
    this._data[name] = value;
  }

  get(name) {
    return this._data[name];
  }

  push(name, value) {
    const arr = this._data[name];
    if (!arr) {
      this._data[name] = [];
    }
    arr.push(value);
  }

  emit(event) {
    if (this._events) {
      const abs = Date.now();
      const initTime = this._initTime;
      if (!initTime) {
        initTime = this._initTime = abs;
      }
      const rel = abs - initTime;
      this._history.push({ event, abs, rel });
      this._events.emit(event, this._data, this._history);
    }
  }
}

module.exports = Telemetry;
