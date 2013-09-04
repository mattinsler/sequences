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
        seq._dependencies = [];
        seq._followed_by = [];
        seq.depends_on = function(other_sequence) {
          seq._dependencies.push(other_sequence);
          return seq;
        };
        seq.follows = function(other_sequence) {
          _this.sequences[other_sequence]._followed_by.push(name);
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
      var c, deps, queue, visited;
      if (this.sequences[name] == null) {
        return [];
      }
      visited = {};
      deps = [];
      queue = [name];
      while (queue.length > 0) {
        c = queue.shift();
        Array.prototype.push.apply(deps, this.sequences[c]._followed_by);
        deps.push(c);
        if (visited[c] === true) {
          continue;
        }
        visited[c] = true;
        Array.prototype.push.apply(queue, this.sequences[c]._dependencies);
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
