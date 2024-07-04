import 'reflect-metadata'

import log4js from 'log4js'
import {injectable} from 'tsyringe'
import {ILoggerService} from './ILogger'

@injectable()
export default class Log4jsLoggerService implements ILoggerService {
  private _logger: log4js.Logger = log4js.getLogger()

  constructor() {
    this._logger.level = 'debug'
  }

  setContext(tagName: string) {
    this._logger = log4js.getLogger(tagName)
    this._logger.level = 'debug'
  }

  warn(message: unknown) {
    this._logger.warn(message)
  }

  error(message: unknown) {
    this._logger.error(message)
  }

  info(message: unknown) {
    this._logger.info(message)
  }
}
