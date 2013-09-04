exports.Sequence = require './sequence'
exports.Container = require './container'
exports.InstrumentedContainer = require './instrumented_container'

exports.container = -> new exports.Container(arguments...)
exports.sequence = -> new exports.Sequence(arguments...)
