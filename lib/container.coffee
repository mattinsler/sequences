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
      # seq._runs_before = []
      seq._runs_after = []
      seq._run_after = []
      
      seq._depends_on = []
      seq._is_depended_on_by = []
      
      seq.depends_on = (name) =>
        other = @sequence(name)
        seq._depends_on.push(name)
        other._is_depended_on_by.push(seq.name)
        seq
      
      # seq.runs_before = (name) =>
      #   other = @sequence(name)
      #   # other._runs_before
      #   
      #   seq._runs_after.push(name)
      #   other._runs_before.push(seq.name)
      #   seq
      
      seq.runs_after = (name) =>
        other = @sequence(name)
        seq._runs_after.push(name)
        other._run_after.push(seq.name)
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
      
      continue if visited[c] is true
      visited[c] = true
      
      Array::push.apply(deps, @sequence_execution_list(a)) for a in @sequences[c]._run_after
      deps.push(c)
      Array::push.apply(queue, @sequences[c]._depends_on)
    
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
