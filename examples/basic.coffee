container = require('../lib/sequences').container()

container.before 'http', (context, done) ->
  console.log 'BEFORE http'
  done()

container.after 'http', (context, done) ->
  console.log 'AFTER http'
  done()

container.before 'http:step-one', (context, done) ->
  console.log 'BEFORE http:step-one'
  done()
  
container.after 'http:step-one', (context, done) ->
  console.log 'AFTER http:step-one'
  done()

one = (cb) ->
  @foo = 'baz'
  cb()

container.sequence('http').add('step-one', one)

foo = {foo: 'bar'}

console.log foo
container.execute 'http', foo, (err) ->
  return console.log(err.stack) if err?
  console.log foo
