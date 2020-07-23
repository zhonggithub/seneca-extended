const pkg = require(`${process.cwd()}/package`)
const { decorateSeneca, createSenecaLogger } = require(`${__dirname}/utils`)

module.exports = (baseConfig = {}) => {

  const extendedConfig = {}
  const logLevel = baseConfig.logLevel || 'info'
  const customLogger = require(`${__dirname}/logger`)({
    name: pkg.name,
    version: pkg.version,
    level: logLevel
  })

  // rewrite default seneca logger
  extendedConfig.internal = extendedConfig.internal || {}
  extendedConfig.internal.logger = createSenecaLogger(customLogger, logLevel)

  const config = Object.assign({
    log: {
      level: logLevel
    }
  }, baseConfig, extendedConfig)
  const seneca = require('seneca')(config)

  // append additional methods (promisified actions, error emitters, clean loggers etc)
  const customSeneca = decorateSeneca(seneca, customLogger)
  return customSeneca
}
