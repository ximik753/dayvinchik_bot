import {ButtonColor, KeyboardBuilder, MessageContext} from 'vk-io'
import {AddStep, Ctx, Scene} from 'nestjs-vk'
import {UseFilters} from '@nestjs/common'

import {USER_WAIT_LIKE_SCENE} from '../../user/user.constants'
import {UserService} from '../../user/user.service'
import {ACTION_SCENE} from '../action.constats'
import {ActionService} from '../action.service'
import {VkExceptionFilter} from '../../common'
import {ActionType} from '../action.entity'

@UseFilters(VkExceptionFilter)
@Scene(ACTION_SCENE)
export class ActionScene {
  constructor(
    private readonly _actionService: ActionService,
    private readonly _userService: UserService,
  ) {}

  @AddStep(0)
  async onMainEvent(@Ctx() ctx: MessageContext) {
    // если не была нажата кнопка + это не первый заход
    if (!ctx.hasMessagePayload && !ctx.scene.step.firstTime) {
      return ctx.send('Нет такого варианта ответа')
    }

    if (!ctx.scene.step.firstTime) {
      const {value, target} = ctx.messagePayload

      if (value === 0) {
        await this._actionService.add(target, ctx.senderId, ActionType.LIKE)
      }

      if (value === 1) {
        return ctx.scene.step.go(1)
      }

      if (value === 2) {
        await this._actionService.add(target, ctx.senderId, ActionType.DISLIKE)
      }

      if (value === 3) {
        return ctx.scene.enter(USER_WAIT_LIKE_SCENE)
      }
    }

    const senderId = ctx.senderId
    const nextUser = await this._actionService.findNext(senderId)

    if (!nextUser) {
      return ctx.scene.step.go(2)
    }

    const keyboard = new KeyboardBuilder()
      .textButton({label: '❤', color: ButtonColor.POSITIVE, payload: {value: 0, target: nextUser.id}})
      .textButton({label: '💌', color: ButtonColor.POSITIVE, payload: {value: 1, target: nextUser.id}})
      .textButton({label: '👎', color: ButtonColor.NEGATIVE, payload: {value: 2, target: nextUser.id}})
      .textButton({label: '💤', color: ButtonColor.PRIMARY, payload: {value: 3}})

    const profile = this._userService.getQuestionnaireText(nextUser)
    await ctx.sendPhotos({value: nextUser.photo!}, {message: profile, keyboard})
  }

  @AddStep(1)
  async onSendLikeWithMessage(@Ctx() ctx: MessageContext) {
    if (ctx.scene.step.firstTime) {
      const keyboard = new KeyboardBuilder()
        .textButton({label: 'Вернуться назад', color: ButtonColor.PRIMARY, payload: {value: 0}})
      return ctx.send('Напиши сообщение для этого пользователя', {keyboard})
    }

    if (ctx.hasMessagePayload) {
      return ctx.scene.step.go(0)
    }

    const currentUserId = ctx.senderId
    const questionnaireIdFormCache = await this._actionService.getQuestionnaireIdFormCache(currentUserId)

    if (!questionnaireIdFormCache) {
      await ctx.send('Время просмотра анкеты истекло, действие не выполнено.')
      return ctx.scene.step.go(0)
    }

    await this._actionService.add(questionnaireIdFormCache, currentUserId, ActionType.LIKE, ctx.text)
    return ctx.scene.step.go(0)
  }

  @AddStep(2)
  async onQuestionnaireEnd(@Ctx() ctx: MessageContext) {
    if (ctx.scene.step.firstTime) {
      const keyboard = new KeyboardBuilder()
        .textButton({label: 'Начать поиск', color: ButtonColor.POSITIVE, payload: {value: 0}})
        .textButton({label: '💤', color: ButtonColor.PRIMARY, payload: {value: 1}})
      return ctx.send('Анкеты закончились. Приходите позже', {keyboard})
    }

    if (!ctx.hasMessagePayload) {
      return ctx.send('Нет такого варианта ответа')
    }

    if (ctx.messagePayload.value === 0) {
      return ctx.scene.step.go(0)
    }
    return ctx.scene.enter(USER_WAIT_LIKE_SCENE)
  }

  @AddStep(3)
  async onSeeLikes(@Ctx() ctx: MessageContext) {
    if (!ctx.scene.step.firstTime) {
      const {value, target} = ctx.messagePayload

      if (value === 0) {
        await this._actionService.sendMutualSympathy(ctx.senderId, target, ActionType.LIKE)
        await ctx.send(`Отлично! Надеюсь хорошо проведете время ;) Начинай общаться 👉 vk.com/id${target}`)
      }

      if (value === 1) {
        await this._actionService.sendMutualSympathy(ctx.senderId, target, ActionType.DISLIKE)
      }
    }

    const likes = await this._actionService.getLikesForUser(ctx.senderId)
    const likesCount = likes.length
    if (!likesCount) {
      return ctx.scene.step.go(0)
    }

    const like = likes[0]
    const hasMoreLike = likesCount - 1 > 0
    const keyboard = new KeyboardBuilder()
      .textButton({label: '❤', color: ButtonColor.POSITIVE, payload: {value: 0, target: like.id}})
      .textButton({label: '👎', color: ButtonColor.NEGATIVE, payload: {value: 1, target: like.id}})

    const likeMessage = like.message
      ? `Сообщение для тебя💌: ${like.message}`
      : ''

    await ctx.sendPhotos(
      {value: like.photo!},
      {
        message: `
        Кому-то понравилась твоя анкета${hasMoreLike ? `(и ещё ${likesCount - 1})` : ''}:
        
        ${this._userService.getQuestionnaireText(like)}
        
        ${likeMessage}
        `,
        keyboard
      }
    )
  }

  @AddStep(4)
  async onStartSearch(@Ctx() ctx: MessageContext) {
    return ctx.scene.step.go(0)
  }
}
