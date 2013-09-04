q = require 'q'

class InstrumentedContainer
  constructor: ->
    @_callbacks =
      before: {}
      after: {}
  
  before: (event, callback) ->
    @_callbacks.before[event] ?= []
    @_callbacks.before[event].push(callback)
    @

  after: (event, callback) ->
    @_callbacks.after[event] ?= []
    @_callbacks.after[event].push(callback)
    @
  
  _before: (event, context) ->
    =>
      (@_callbacks.before[event] or []).reduce (o, cb) ->
        o.then(q.nfcall(cb, context))
      , q()

  _after: (event, context) ->
    =>
      (@_callbacks.after[event] or []).reduce (o, cb) ->
        o.then(q.nfcall(cb, context))
      , q()

module.exports = InstrumentedContainer
