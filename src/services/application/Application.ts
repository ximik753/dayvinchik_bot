import 'reflect-metadata'
import {autoInjectable, inject} from 'tsyringe'

import {ITransportService} from '../transport'
import {ILoggerService} from '../logger'

@autoInjectable()
export default class Application {
  constructor(
    @inject('Transport') private _transportService: ITransportService,
    @inject('Logger') private _loggerService: ILoggerService
  ) {
    this._loggerService.setContext('ApplicationService')
  }

  async start(): Promise<void> {
    await this._transportService.startPolling()
  }
}
