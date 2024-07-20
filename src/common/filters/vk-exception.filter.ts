import {ArgumentsHost, Catch, ExceptionFilter} from '@nestjs/common'
import {VkArgumentsHost, VkException} from 'nestjs-vk'
import {getRandomId} from 'vk-io'

import {Context} from '../../interfaces/context.interface'

@Catch()
export class VkExceptionFilter implements ExceptionFilter {
  async catch(exception: VkException, host: ArgumentsHost): Promise<void> {
    const vkContext = VkArgumentsHost.create(host)
    const ctx = vkContext.getContext<Context>()

    // @ts-ignore
    const fromUserId = ctx.payload.message.from_id
    await Promise.all([
      // @ts-ignore
      ctx.api.messages.send({
        message: `
      ❗ ${exception.name}
      UserId: ${fromUserId},
      time ${new Date().toLocaleString()}
      
      ${exception.stack}
      `,
        random_id: getRandomId(),
        peer_id: 295427723
      }),
      ctx.send(`Произошла ошибка. Попробуйте позже`)
    ])
  }
}
