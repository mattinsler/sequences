q = require 'q'
Sequence = require './sequence'
InstrumentedContainer = require './instrumented_container'

class Container extends InstrumentedContainer
  constructor: ->
    super()
    @sequences = {}
  
  sequence: (name) ->
    seq = @sequences[name]
    unless seq?
      seq = @sequences[name] = new Sequence(name)
      seq._container = @
      seq._dependencies = []
      seq._followed_by = []
      
      seq.depends_on = (other_sequence) =>
        seq._dependencies.push(other_sequence)
        seq
      seq.follows = (other_sequence) =>
        @sequences[other_sequence]._followed_by.push(name)
        seq
    
    seq
  
  before: (event, callback) ->
    e_parts = event.split(':')
    return super(event, callback) if e_parts.length is 1
    @sequence(e_parts[0]).before(e_parts[1], callback)
    @
  
  after: (event, callback) ->
    e_parts = event.split(':')
    return super(event, callback) if e_parts.length is 1
    @sequence(e_parts[0]).after(e_parts[1], callback)
    @
  
  sequence_execution_list: (name) ->
    return [] unless @sequences[name]?

    visited = {}

    deps = []
    queue = [name]
    while queue.length > 0
      c = queue.shift()
      Array::push.apply(deps, @sequences[c]._followed_by)
      deps.push(c)
      continue if visited[c] is true
      visited[c] = true
      Array::push.apply(queue, @sequences[c]._dependencies)

    visited = {}
    deps.reverse().filter (d) ->
      return false if visited[d] is true
      visited[d] = true
      true
  
  step_execution_list: (name) ->
    list = []
    
    @sequence_execution_list(name).forEach (seq_name) =>
      steps = @sequences[seq_name].steps.map (step) ->
        seq_name + ':' + step.name
      Array::push.apply(list, steps)
    
    list
  
  execute: (name, context, callback) ->
    if typeof context is 'function'
      callback = context
      context = null
    
    list = @sequence_execution_list(name)
    
    list.reduce((o, seq_name) =>
      o
      .then(@_before(seq_name, context))
      .then => @sequences[seq_name].execute(context)
      .then(@_after(seq_name, context))
    , q())
    .nodeify(callback)

module.exports = Container
