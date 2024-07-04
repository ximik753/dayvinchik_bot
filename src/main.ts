import 'reflect-metadata'
import {container} from 'tsyringe'

import {ApplicationService} from './services/application'
import {ILoggerService, Log4jsLogger} from './services/logger'
import {ITransportService, VkTransport} from './services/transport'

async function bootstrap() {
  container.register<ILoggerService>('Logger', Log4jsLogger)
  container.register<ITransportService>('Transport', VkTransport)

  const applicationService = container.resolve<ApplicationService>(ApplicationService)
  await applicationService.start()
}

bootstrap()
