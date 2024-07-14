import {AddStep, Context, Ctx, Scene, SceneEnter, SceneLeave} from 'nestjs-vk'
import {ButtonColor, KeyboardBuilder, MessageContext} from 'vk-io'
import {IStepContext} from '@vk-io/scenes'
import {UseFilters} from '@nestjs/common'

import {USER_QUESTIONNAIRE_SETTINGS_SCENE, USER_QUESTIONNAIRE_CHANGING_SCENE} from '../user.constants'
import {ACTION_SCENE} from '../../action/action.constats'
import {UserUpdateDto} from '../dto/user-update.dto'
import {VkExceptionFilter} from '../../common'
import {UserService} from '../user.service'
import {SexType, User} from '../user.entity'

@UseFilters(VkExceptionFilter)
@Scene(USER_QUESTIONNAIRE_CHANGING_SCENE)
export class UserQuestionnaireChangingScene {
  constructor(
    private _userService: UserService
  ) {}

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: MessageContext) {
    const step = ctx.scene.state.step
    if (ctx.scene.step.firstTime && step) {
      ctx.scene.step.stepId = step
    }

    if (ctx.scene.step.firstTime) {
      const userDto = new UserUpdateDto()
      userDto.id = ctx.senderId
      userDto.isActive = false
      await this._userService.update(userDto)
    }
  }

  @SceneLeave()
  async onSceneLeave(@Ctx() ctx: MessageContext) {
    const userDto = new UserUpdateDto()
    userDto.id = ctx.senderId
    userDto.isActive = true
    await this._userService.update(userDto)
  }

  @AddStep(0)
  async onAgeInput(@Context() ctx: IStepContext<Record<string, any>>) {
    if (ctx.scene.step.firstTime) {
      ctx.scene.state.firstTime = false
      await ctx.send('Сколько тебе лет?', {keyboard: new KeyboardBuilder()})
      return
    }

    const parsedAge = parseInt(ctx.text)

    if (isNaN(parsedAge) || parsedAge < 0) {
      return ctx.send(`Введен не корректный возраст`)
    }

    const userDto = new UserUpdateDto()
    userDto.id = ctx.senderId
    userDto.age = parsedAge
    await this._userService.update(userDto)

    await ctx.scene.step.next()
  }

  @AddStep(1)
  async onSexInput(@Ctx() ctx: MessageContext) {
    if (ctx.scene.step.firstTime) {
      const keyboard = new KeyboardBuilder()
        .textButton({label: 'Я парень', color: ButtonColor.NEGATIVE, payload: {sex: SexType.MALE}})
        .textButton({label: 'Я девушка', color: ButtonColor.POSITIVE, payload: {sex: SexType.GIRL}})
      return ctx.send('Теперь определимся с полом', {keyboard})
    }

    if (!ctx.hasMessagePayload) {
      return ctx.send(`
      Нет такого варианта ответа.
      
      1. Парень
      2. Девушка
      `)
    }

    const userDto = new UserUpdateDto()
    userDto.id = ctx.senderId
    userDto.sex = ctx.messagePayload.sex
    await this._userService.update(userDto)

    await ctx.scene.step.next()
  }

  @AddStep(2)
  async onSexSearchInput(@Ctx() ctx: MessageContext) {
    if (ctx.scene.step.firstTime) {
      const keyboard = new KeyboardBuilder()
        .textButton({label: 'Парни', color: ButtonColor.NEGATIVE, payload: {sexSearch: SexType.MALE}})
        .textButton({label: 'Девушки', color: ButtonColor.POSITIVE, payload: {sexSearch: SexType.GIRL}})
        .textButton({label: 'Всё равно', color: ButtonColor.PRIMARY, payload: {sexSearch: SexType.ANY_WHERE}})
      return ctx.send('Кто тебе интересен?', {keyboard})
    }

    if (!ctx.hasMessagePayload) {
      return ctx.send(`
      Нет такого варианта ответа.
      
      1. Парни
      2. Девушки
      3. Всё равно
      `)
    }

    const userDto = new UserUpdateDto()
    userDto.id = ctx.senderId
    userDto.sexSearch = ctx.messagePayload.sexSearch
    await this._userService.update(userDto)

    await ctx.scene.step.next()
  }

  @AddStep(3)
  async onCityInput(@Ctx() ctx: MessageContext) {
    if (ctx.scene.step.firstTime) {
      return ctx.send('Из какого ты города?', {keyboard: new KeyboardBuilder()})
    }

    const userDto = new UserUpdateDto()
    userDto.id = ctx.senderId
    userDto.city = ctx.text
    await this._userService.update(userDto)

    await ctx.scene.step.next()
  }

  @AddStep(4)
  async onNameInput(@Ctx() ctx: MessageContext) {
    if (ctx.scene.step.firstTime) {
      return ctx.send('Как мне тебя называть?')
    }

    const userDto = new UserUpdateDto()
    userDto.id = ctx.senderId
    userDto.name = ctx.text
    await this._userService.update(userDto)

    await ctx.scene.step.next()
  }

  @AddStep(5)
  async onAboutInput(@Ctx() ctx: MessageContext) {
    if (ctx.scene.step.firstTime) {
      const keyboard = new KeyboardBuilder()
        .textButton({label: 'Без текста', color: ButtonColor.NEGATIVE, payload: {empty: true}})
      return ctx.send('Расскажи о себе и кого хочешь найти, чем предлагаешь заняться. Это поможет лучше подобрать тебе компанию.', {keyboard})
    }

    if (ctx.hasMessagePayload) {
      if (ctx.scene.state.step) {
        return ctx.scene.step.go(7)
      }
      return ctx.scene.step.next()
    }

    const userDto = new UserUpdateDto()
    userDto.id = ctx.senderId
    userDto.about = ctx.text
    await this._userService.update(userDto)

    if (ctx.scene.state.step) {
      return ctx.scene.step.go(7)
    }
    return ctx.scene.step.next()
  }

  @AddStep(6)
  async onPhotoInput(@Ctx() ctx: MessageContext) {
    if (ctx.scene.step.firstTime) {
      const keyboard = new KeyboardBuilder()
        .textButton({label: 'Взять моё основное фото из ВК.', color: ButtonColor.PRIMARY, payload: {takeFromVk: true}})
      return ctx.send('Теперь пришли свое фото, его будут видеть другие пользователи', {keyboard})
    }

    const takeFormVk = ctx.hasMessagePayload

    if (!ctx.hasAttachments() && !takeFormVk) {
      return ctx.send('Пришли свое фото, его будут видеть другие пользователи')
    }

    let photoFromVk
    if (takeFormVk) {
      const userInfo = await this._userService.getUserInfoFromVk(ctx.senderId)
      photoFromVk = userInfo.photo_max_orig
    }

    const userDto = new UserUpdateDto()
    userDto.id = ctx.senderId
    userDto.photo = takeFormVk
      ? photoFromVk
        // @ts-ignore
      : ctx.attachments[0].payload.orig_photo.url
    await this._userService.update(userDto)

    if (ctx.scene.state.step) {
      return ctx.scene.step.go(7)
    }
    return ctx.scene.step.next()
  }

  @AddStep(7)
  async onConfirmation(@Ctx() ctx: MessageContext) {
    if (ctx.scene.step.firstTime) {
      const {age, photo, city, about = '', name} = await this._userService.findOneById(ctx.senderId) as User
      const profile = `
      Так выглядит твоя анкета:
      
      ${name}, ${age}, ${city}
      ${about || ''}
      `
      await ctx.sendPhotos({value: photo!}, {message: profile})

      const keyboard = new KeyboardBuilder()
        .textButton({label: 'Всё верно', color: ButtonColor.NEGATIVE, payload: {value: 0}})
        .textButton({label: 'Изменить анкету', color: ButtonColor.POSITIVE, payload: {value: 1}})
      return ctx.send('Всё верно?', {keyboard})
    }

    if (!ctx.hasMessagePayload) {
      return ctx.send(`
      Такого варианта ответа нет.
      
      1. Всё верно
      2. Изменить анкету
      `)
    }

    if (ctx.messagePayload.value === 0) {
      await ctx.scene.enter(ACTION_SCENE)
      return
    }

    await ctx.scene.enter(USER_QUESTIONNAIRE_SETTINGS_SCENE)
  }
}
