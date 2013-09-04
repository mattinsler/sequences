(function() {
  var InstrumentedContainer, Sequence, index_of, q,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  q = require('q');

  InstrumentedContainer = require('./instrumented_container');

  index_of = function(arr, predicate) {
    var x, _i, _ref;
    for (x = _i = 0, _ref = arr.length; 0 <= _ref ? _i < _ref : _i > _ref; x = 0 <= _ref ? ++_i : --_i) {
      if (predicate(arr[x])) {
        return x;
      }
    }
    return -1;
  };

  Sequence = (function(_super) {

    __extends(Sequence, _super);

    function Sequence(name) {
      this.name = name;
      Sequence.__super__.constructor.call(this);
      this.steps = [];
    }

    Sequence.prototype.add = function() {
      var steps;
      steps = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (steps.length === 2 && typeof steps[0] === 'string' && typeof steps[1] === 'function') {
        steps = [
          {
            name: steps[0],
            method: steps[1]
          }
        ];
      }
      Array.prototype.push.apply(this.steps, steps);
      return this;
    };

    Sequence.prototype.remove = function() {
      var idx, name, names, _i, _len;
      names = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      for (_i = 0, _len = names.length; _i < _len; _i++) {
        name = names[_i];
        idx = _(this.steps).indexOf(function(s) {
          return s.name === name;
        });
        if (idx !== -1) {
          this.steps.splice(idx, 1);
        }
      }
      return this;
    };

    Sequence.prototype.insert = function(name, method, opts) {
      var idx, other_name, step;
      step = {
        name: name,
        method: method
      };
      other_name = opts.after || opts.before || opts.replace;
      idx = index_of(this.steps, function(s) {
        return s.name === other_name;
      });
      if (opts.after != null) {
        if (idx === -1) {
          this.steps.push(step);
        } else {
          this.steps.splice(idx + 1, 0, step);
        }
      } else if (opts.before != null) {
        this.steps.splice((idx === -1 ? 0 : idx), 0, step);
      } else if (opts.replace != null) {
        if (idx === -1) {
          throw new Error('Could not find Sequence step ' + opts.replace + ' to replace with ' + name);
        }
        this.steps.splice(idx, 1, step);
      }
      return this;
    };

    Sequence.prototype.execute = function(context, callback) {
      var _this = this;
      if (typeof context === 'function') {
        callback = context;
        context = null;
      }
      return this.steps.reduce(function(o, s) {
        return o.then(_this._before(s.name, context)).then(function() {
          var d;
          d = q.defer();
          s.method.call(context, d.makeNodeResolver());
          return d.promise;
        }).then(_this._after(s.name, context));
      }, q()).nodeify(callback);
    };

    return Sequence;

  })(InstrumentedContainer);

  module.exports = Sequence;

}).call(this);
