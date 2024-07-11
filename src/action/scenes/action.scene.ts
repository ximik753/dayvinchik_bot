import {ButtonColor, getRandomId, KeyboardBuilder, MessageContext} from 'vk-io'
import {CACHE_MANAGER} from '@nestjs/cache-manager'
import {UseFilters, Inject} from '@nestjs/common'
import {AddStep, Ctx, Scene} from 'nestjs-vk'

import {ACTION_SCENE} from '../action.constats'
import {ActionService} from '../action.service'
import {VkExceptionFilter} from '../../common'
import {CacheStore} from '@nestjs/cache-manager/dist/interfaces/cache-manager.interface'

@UseFilters(VkExceptionFilter)
@Scene(ACTION_SCENE)
export class ActionScene {
  constructor(
    private readonly _actionService: ActionService,
    @Inject(CACHE_MANAGER) private readonly _cacheManager: CacheStore
  ) {}

  @AddStep(0)
  async onEvent(@Ctx() ctx: MessageContext) {
    if (ctx.scene.step.firstTime) {}

    const senderId = ctx.senderId
    const nextUser = await this._actionService.findNext(senderId)

    if (!nextUser) {
      return ctx.send('Анкеты закончились. Приходите позже')
    }

    const keyboard = new KeyboardBuilder()
      .textButton({label: '❤', color: ButtonColor.POSITIVE, payload: {value: 0, target: nextUser.id}})
      .textButton({label: '💌', color: ButtonColor.POSITIVE, payload: {value: 1, target: nextUser.id}})
      .textButton({label: '👎', color: ButtonColor.NEGATIVE, payload: {value: 2, target: nextUser.id}})
      .textButton({label: '💤', color: ButtonColor.PRIMARY, payload: {value: 3}})
    const {age, photo, city, about = '', name} = nextUser

    const profile = `
      ${name}, ${age}, ${city}
      ${about || ''}
    `
    await ctx.sendPhotos({value: photo!}, {message: profile, keyboard})
  }
}
