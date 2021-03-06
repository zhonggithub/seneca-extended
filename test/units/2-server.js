const { test } = require('ava')
const logger = require(`${process.env.PWD}/src/logger`)

const seneca = require(`${process.env.PWD}/src`)({
  useTimeout: 100,
  logLevel: 'fatal' // mute errors
})

const customPlugin = require(`${process.env.PWD}/test/fixtures/plugins/custom`)

test.before(() => {
  return seneca.useAsync(customPlugin, {}, 'custom')
})

test('load base plugin', () => {
	return seneca.useAsync(`${process.env.PWD}/test/fixtures/plugins/base`)
})

test('load incorect plugin', t => {
  t.throws(seneca.useAsync(`${process.env.PWD}/test/fixtures/plugins/not-a-plugin`), /not a seneca plugin/)
})

test('ensure routes loaded', t => {
  t.deepEqual(seneca.routes.custom, customPlugin.routes)
})

test('promisified action', t => {
	return seneca.actAsync('role:debug,cmd:echo', { some: 'payload'}).then(res => {
		t.is(res.some, 'payload')
	})
})

test('handle custom error', t => {
	return seneca.actAsync('role:debug,cmd:error').catch(err => {
		t.is(err.message, 'custom error')
	})
})

test('handle payload error', t => {
	return seneca.actAsync(seneca.routes.custom.errorPayloaded).catch(err => {
		t.is(err.message, 'custom payload')
		t.is(err.name, 'custom')
		t.is(err.code, 500)
		t.is(err.statusCode, 500)
		t.is(err.payload.some, 'data')
	})
})

test('handle unregistered action', t => {
	return seneca.actAsync('role:nosuchrole').catch(err => {
		t.regex(err.message, /No matching action pattern found/)
	})
})

test('timeout', t => {
	return seneca.actAsync(seneca.routes.custom.errorTimeout).catch(err => {
		t.regex(err.message, /timeout on route/)
	})
})

test('handle internal error', t => {
	return seneca.actAsync('role:debug,cmd:error-internal').catch(err => {
		t.regex(err.message, /badfunction is not defined/)
	})
})

test('log something', t => {
  // mute stdout
  const write = process.stdout.write
  process.stdout.write = () => {}

	t.throws(() => {
		logger()
	})


  const log = logger({
    name: 'test'
  })
	log.debug('some message')
	log.debug(new Error('serialize me plzkthx'))
	log.debug({err: 'not a error'})
	process.stdout.write = write
})
