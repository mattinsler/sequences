(function() {

  exports.Sequence = require('./sequence');

  exports.Container = require('./container');

  exports.InstrumentedContainer = require('./instrumented_container');

  exports.container = function() {
    return (function(func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor, result = func.apply(child, args), t = typeof result;
      return t == "object" || t == "function" ? result || child : child;
    })(exports.Container, arguments, function(){});
  };

  exports.sequence = function() {
    return (function(func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor, result = func.apply(child, args), t = typeof result;
      return t == "object" || t == "function" ? result || child : child;
    })(exports.Sequence, arguments, function(){});
  };

}).call(this);
