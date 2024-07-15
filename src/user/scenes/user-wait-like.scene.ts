import {ButtonColor, KeyboardBuilder, MessageContext} from 'vk-io'
import {AddStep, Ctx, Scene} from 'nestjs-vk'
import {UseFilters} from '@nestjs/common'

import {USER_QUESTIONNAIRE_SETTINGS_SCENE, USER_WAIT_LIKE_SCENE} from '../user.constants'
import {ACTION_SCENE} from '../../action/action.constats'
import {VkExceptionFilter} from '../../common'
import {UserService} from '../user.service'

@UseFilters(VkExceptionFilter)
@Scene(USER_WAIT_LIKE_SCENE)
export class UserWaitLikeScene {
  constructor(
    private readonly _userService: UserService
  ) {}

  @AddStep(0)
  async onInit(@Ctx() ctx: MessageContext) {
    const mainMenuText = `
      1. Смотреть анкеты.
      2. Моя анкета.
      3. Я больше не хочу никого искать.
    `
    if (ctx.scene.step.firstTime) {
      const keyboard = new KeyboardBuilder()
        .textButton({label: '1', color: ButtonColor.POSITIVE, payload: {value: 0}})
        .textButton({label: '2', color: ButtonColor.PRIMARY, payload: {value: 1}})
        .textButton({label: '3', color: ButtonColor.PRIMARY, payload: {value: 2}})

      return ctx.send(`
      Подождем пока кто-то увидит твою анкету
      ${mainMenuText}`,
        {keyboard}
      )
    }

    if (!ctx.hasMessagePayload) {
      return ctx.send(`
        Нет такого варианта ответа
        ${mainMenuText}
      `)
    }

    if (ctx.messagePayload.value === 0) {
      return ctx.scene.enter(ACTION_SCENE)
    }
    if (ctx.messagePayload.value === 1) {
      return ctx.scene.enter(USER_QUESTIONNAIRE_SETTINGS_SCENE)
    }
    if (ctx.messagePayload.value === 2) {
      return ctx.scene.step.go(1)
    }
  }

  @AddStep(1)
  async onOffQuestionnaire(@Ctx() ctx: MessageContext) {
    if (ctx.scene.step.firstTime) {
      const keyboard = new KeyboardBuilder()
        .textButton({label: '1', color: ButtonColor.PRIMARY, payload: {value: 0}})
        .textButton({label: '2', color: ButtonColor.POSITIVE, payload: {value: 1}})
      return ctx.send(`
      Так ты не узнаешь, что кому-то нравишься... Точно хочешь отключить свою анкету?

      1. Да, отключить анкету.
      2. Нет, вернуться назад.
      `, {keyboard})
    }

    if (!ctx.hasMessagePayload) {
      return ctx.send(`Нет такого варианта ответа, выбери одну цифру`)
    }

    if (ctx.messagePayload.value === 0) {
      return ctx.scene.step.go(2)
    }
    if (ctx.messagePayload.value === 1) {
      return ctx.scene.step.go(0)
    }
  }

  @AddStep(2)
  async onOffEvent(@Ctx() ctx: MessageContext) {
    if (ctx.scene.step.firstTime) {
      await this._userService.toggleActiveProfile(ctx.senderId)

      const keyboard = new KeyboardBuilder()
        .textButton({label: 'Посмотреть анкеты', color: ButtonColor.POSITIVE, payload: {value: 0}})
      return ctx.send(
        `Надеюсь ты нашел кого-то благодаря мне! Рад был с тобой пообщаться, будет скучно – пиши, обязательно найдем тебе кого-нибудь`,
        {keyboard}
      )
    }

    await this._userService.toggleActiveProfile(ctx.senderId)

    return ctx.scene.enter(ACTION_SCENE)
  }
}
