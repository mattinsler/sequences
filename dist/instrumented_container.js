(function() {
  var InstrumentedContainer, q;

  q = require('q');

  InstrumentedContainer = (function() {

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

  })();

  module.exports = InstrumentedContainer;

}).call(this);
