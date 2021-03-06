> Extends [senecajs] microservice library: offhandedly, with respect
>
# seneca-extended
[![npm][badge-npm]][npm]
[![coveralls][badge-coveralls]][coveralls]
[![deps][badge-deps]][deps]
[![travis][badge-travis]][travis]

### What is it and what is for
When i started building application using [senecajs] framework, i didn't find the easy ways to solve some of problems:

* ability to use promises
* throw errors on server and catch them by client (with custom payload)
* initialize plugins on asynchronius way before load them into framework
* log messages in own format instead of verbose seneca output
* some other stuff

This wrapper try to solve most of this troubles, offering common interface without changing the basic functionality in my own way.

__WARN: this module don't works in nodejs <6.x (no time for babel, feel free to pull reques with babel support if you need earlier versions support)__

### Install
```
$ npm install seneca-extended
```

### Test
```
$ npm run test
```

### Quck Example
```js
const ld = require('lodash')
const seneca = require('../src')()
// `seneca` is fully usable seneca instance with build-in additional features

/** default senecajs plugin **/
const basicPlugin = function (config) {

  this.add({ role: 'example', method: 'ping' }, (message, done) => {
    // in case of exception here - error will not pass to remote client
    done(null, { ping: 'pong'} )
  })

  this.add('role:example,method:error', (message, done) => {
    this.emitError(new Error('this error will be passed to client'), done)
  })
}

/** extended plugin **/
const route = {
  ping: 'role:example,method:ping',
  error: 'role:example,method:error'
}
const extendedPlugin = {
  name: 'example', // exported routes will be available in: seneca.routes.example.*
  routes: ld.pick(route, ['ping']) // will export only route 'ping' for example
  init: function (senecaInstance, config) {
    // this method will be called on plugin load, async code can be used here
    return Promise.delay(300)
  },
  seneca: function (config) {
    // basoc seneca route add
    this.add('role:example,method:sometest', (message, done) => done(null, { ping: 'sometes'} ))
    this.addAsync(route.ping, message => {
      // we are in promise now, so can just return result - all error will be handled
      return { ping: 'pong' }
    })
    this.addAsync(route.error, message => {
      const error = new Error('this error will be passed to client')
      error.payload = { additional: 'payload' } // we can evend add payload
      throw error
    })
  },
  someOther: function () {
    // we can export other method for futher usage
    // ex.: route schemas/specifications, helper methods etc
  }
}


const sampleOptions = { some: 'config' }

// now seneca able to load not only synchronous code...
seneca.useAsync(basicPlugin, sampleOptions) // same as synchronous seneca.use
seneca.actAsync('role:example,method:error').catch(err => {
  console.log('catched from error:', err.message)
})

// ... but also preload plugins methods as promises
seneca.useAsync(extendedPlugin, sampleOptions).then(() => {
  console.log('async plugins loaded and usable now')
  // 'role:example,method:ping'
  seneca.actAsync(seneca.example.ping, { some: 'payload' }).then(res => {
    console.log('got from ping:', res)
  })
})

// Output:
// async plugins loaded and usable now
// catched from error: this error will be passed to client
// got from ping: { ping: 'pong' }
```
_Advanced example_: custom microservice with deployment into kubernetes, configuration files and common launcher - [micro-test] (maybe outdated)

###  API

Core documentation available at [oficial API page](http://senecajs.org/api/). Following methods are added by `seneca-extended` and not usable without this module:

##### .addAsync(route, promisifiedCallback)
Extened version of `seneca.add` with promisified callback.

##### .useAsync(plugin, [config]) -> Promise
Extened version of `seneca.use` with ability to load promisified plugins.

##### .emitError(Error, callback)
```js
this.add('...', (message, done) => {
  try {
    // some code
    done()
  } catch (err) {
    // now remote clients will catch this error
    this.emitError(err, done)
  }
})
```

##### .actCustom(...)
Extended version of `seneca.act` with error catching (useful if you dont need response)

##### .actAsync
Promisified version of `seneca.actCustom`.
```js
seneca.actAsync('some:route').then(console.log).catch(console.log)
```

##### .logger.warn, .logger.debug, .logger.info, .logger.error
Lightweight logger without default seneca verbosity (should be, just lightweight now :) .


[micro-test]: https://github.com/afoninsky/micro-test
[seneca-launcher]: https://github.com/afoninsky/seneca-launcher
[senecajs]: https://github.com/senecajs/seneca
[travis]: https://travis-ci.org/afoninsky/seneca-extended
[badge-travis]: https://travis-ci.org/afoninsky/seneca-extended.svg?branch=master
[coveralls]: https://coveralls.io/github/afoninsky/seneca-extended?branch=master
[badge-coveralls]: https://coveralls.io/repos/github/afoninsky/seneca-extended/badge.svg?branch=master
[deps]: https://david-dm.org/afoninsky/seneca-extended
[badge-deps]: https://david-dm.org/afoninsky/seneca-extended.svg
[npm]: https://www.npmjs.com/package/seneca-extended
[badge-npm]: https://badge.fury.io/js/seneca-extended.svg
