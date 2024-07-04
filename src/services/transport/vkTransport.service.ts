import 'reflect-metadata'

import {inject, injectable} from 'tsyringe'
import {VK as VKIO} from 'vk-io'
import {ILoggerService} from '../logger'
import {ITransportService} from './ITransport'

@injectable()
export default class VkTransportService implements ITransportService {
  private _vkIo: VKIO

  constructor(
    @inject('Logger') private _loggerService: ILoggerService
  ) {
    this._loggerService.setContext('VkService')
    this._vkIo = new VKIO({
      token: '',
      pollingGroupId: 1
    })
  }

  async startPolling(): Promise<void> {
    // await this._vkIo.updates.start()
    this._loggerService.info('startPolling')
  }
}
