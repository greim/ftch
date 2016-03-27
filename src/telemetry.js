'use strict';

let incr = 1;

class Telemetry {

  constructor(info) {
    this._history = [];
    this._data = Object.assign({ id: incr++ }, info);
  }

  set(name, value) {
    this._data[name] = value;
  }

  push(name, value) {
    let arr = this._data[name];
    if (!arr) {
      arr = this._data[name] = [];
    }
    arr.push(value);
  }

  emit(event) {
    if (this._data.opts.telemetry) {
      const abs = Date.now();
      let initTime = this._initTime;
      if (!initTime) {
        initTime = this._initTime = abs;
      }
      const rel = abs - initTime;
      this._history.push({ event, abs, rel });
      this._data.opts.telemetry.emit('progress', event, this._data, this._history);
    }
  }
}

module.exports = Telemetry;
