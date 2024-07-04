import {ITransportController} from './ITransport'
import {injectable} from 'tsyringe'
import VkTransportService from './vkTransport.service'

@injectable()
export default class VkTransportController implements ITransportController {
  constructor(
    private _vkTransport: VkTransportService
  ) {
  }

  bind(): void {
  }
}
