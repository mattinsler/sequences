(function() {
  var Container, InstrumentedContainer, Sequence, q,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  q = require('q');

  Sequence = require('./sequence');

  InstrumentedContainer = require('./instrumented_container');

  Container = (function(_super) {

    __extends(Container, _super);

    function Container() {
      Container.__super__.constructor.call(this);
      this.sequences = {};
    }

    Container.prototype.sequence = function(name) {
      var seq,
        _this = this;
      seq = this.sequences[name];
      if (seq == null) {
        seq = this.sequences[name] = new Sequence(name);
        seq._container = this;
        seq._runs_after = [];
        seq._run_after = [];
        seq._depends_on = [];
        seq._is_depended_on_by = [];
        seq.depends_on = function(name) {
          var other;
          other = _this.sequence(name);
          seq._depends_on.push(name);
          other._is_depended_on_by.push(seq.name);
          return seq;
        };
        seq.runs_after = function(name) {
          var other;
          other = _this.sequence(name);
          seq._runs_after.push(name);
          other._run_after.push(seq.name);
          return seq;
        };
      }
      return seq;
    };

    Container.prototype.before = function(event, callback) {
      var e_parts;
      e_parts = event.split(':');
      if (e_parts.length === 1) {
        return Container.__super__.before.call(this, event, callback);
      }
      this.sequence(e_parts[0]).before(e_parts[1], callback);
      return this;
    };

    Container.prototype.after = function(event, callback) {
      var e_parts;
      e_parts = event.split(':');
      if (e_parts.length === 1) {
        return Container.__super__.after.call(this, event, callback);
      }
      this.sequence(e_parts[0]).after(e_parts[1], callback);
      return this;
    };

    Container.prototype.sequence_execution_list = function(name) {
      var a, c, deps, queue, visited, _i, _len, _ref;
      if (this.sequences[name] == null) {
        return [];
      }
      visited = {};
      deps = [];
      queue = [name];
      while (queue.length > 0) {
        c = queue.shift();
        if (visited[c] === true) {
          continue;
        }
        visited[c] = true;
        _ref = this.sequences[c]._run_after;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          a = _ref[_i];
          Array.prototype.push.apply(deps, this.sequence_execution_list(a));
        }
        deps.push(c);
        Array.prototype.push.apply(queue, this.sequences[c]._depends_on);
      }
      visited = {};
      return deps.reverse().filter(function(d) {
        if (visited[d] === true) {
          return false;
        }
        visited[d] = true;
        return true;
      });
    };

    Container.prototype.step_execution_list = function(name) {
      var list,
        _this = this;
      list = [];
      this.sequence_execution_list(name).forEach(function(seq_name) {
        var steps;
        steps = _this.sequences[seq_name].steps.map(function(step) {
          return seq_name + ':' + step.name;
        });
        return Array.prototype.push.apply(list, steps);
      });
      return list;
    };

    Container.prototype.execute = function(name, context, callback) {
      var list,
        _this = this;
      if (typeof context === 'function') {
        callback = context;
        context = null;
      }
      list = this.sequence_execution_list(name);
      return list.reduce(function(o, seq_name) {
        return o.then(_this._before(seq_name, context)).then(function() {
          return _this.sequences[seq_name].execute(context).then(_this._after(seq_name, context));
        });
      }, q()).nodeify(callback);
    };

    return Container;

  })(InstrumentedContainer);

  module.exports = Container;

}).call(this);
