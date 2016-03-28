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
    const tel = this._data.opts.telemetry;
    if (tel) {
      const abs = Date.now();
      let initTime = this._initTime;
      if (!initTime) {
        initTime = this._initTime = abs;
      }
      const rel = abs - initTime;
      this._history.push({ event, abs, rel });
      if (typeof tel === 'function') {
        tel(event, this._data, this._history);
      } else if (typeof tel.emit === 'function') {
        tel.emit(event, this._data, this._history);
      }
    }
  }
}

module.exports = Telemetry;
