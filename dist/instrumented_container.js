(function() {
  var EventEmitter, InstrumentedContainer, q,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  q = require('q');

  EventEmitter = require('events').EventEmitter;

  InstrumentedContainer = (function(_super) {

    __extends(InstrumentedContainer, _super);

    function InstrumentedContainer() {
      this._callbacks = {
        before: {},
        after: {}
      };
    }

    InstrumentedContainer.prototype.before = function(event, callback) {
      var _base, _ref;
      if ((_ref = (_base = this._callbacks.before)[event]) == null) {
        _base[event] = [];
      }
      this._callbacks.before[event].push(callback);
      return this;
    };

    InstrumentedContainer.prototype.after = function(event, callback) {
      var _base, _ref;
      if ((_ref = (_base = this._callbacks.after)[event]) == null) {
        _base[event] = [];
      }
      this._callbacks.after[event].push(callback);
      return this;
    };

    InstrumentedContainer.prototype._before = function(event, context) {
      var _this = this;
      return function() {
        return (_this._callbacks.before[event] || []).reduce(function(o, cb) {
          return o.then(q.nfcall(cb, context));
        }, q());
      };
    };

    InstrumentedContainer.prototype._after = function(event, context) {
      var _this = this;
      return function() {
        return (_this._callbacks.after[event] || []).reduce(function(o, cb) {
          return o.then(q.nfcall(cb, context));
        }, q());
      };
    };

    return InstrumentedContainer;

  })(EventEmitter);

  module.exports = InstrumentedContainer;

}).call(this);
