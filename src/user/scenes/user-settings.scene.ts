import {AddStep, Context, Ctx, Scene, SceneEnter} from 'nestjs-vk'
import {ButtonColor, KeyboardBuilder, MessageContext} from 'vk-io'
import {IStepContext} from '@vk-io/scenes'
import {UseFilters} from '@nestjs/common'

import {USER_MAIN_SCENE, USER_PROFILE_SETTINGS_SCENE} from '../user.constants'
import {VkExceptionFilter} from '../../common'

@UseFilters(VkExceptionFilter)
@Scene(USER_PROFILE_SETTINGS_SCENE)
export default class UserSettingsScene {
  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: MessageContext) {
    const step = ctx.scene.state.step
    if (ctx.scene.step.firstTime && step) {
      ctx.scene.step.stepId = step
    }
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

    ctx.scene.state.profile.age = parsedAge

    await ctx.scene.step.next()
  }

  @AddStep(1)
  async onSexInput(@Ctx() ctx: MessageContext) {
    if (ctx.scene.step.firstTime) {
      const keyboard = new KeyboardBuilder()
        .textButton({label: 'Я парень', color: ButtonColor.NEGATIVE, payload: {sex: 0}})
        .textButton({label: 'Я девушка', color: ButtonColor.POSITIVE, payload: {sex: 1}})
      return ctx.send('Теперь определимся с полом', {keyboard})
    }

    if (!ctx.hasMessagePayload) {
      return ctx.send(`
      Нет такого варианта ответа.
      
      1. Парень
      2. Девушка
      `)
    }

    ctx.scene.state.profile.sex = ctx.messagePayload.sex

    await ctx.scene.step.next()
  }

  @AddStep(2)
  async onSexSearchInput(@Ctx() ctx: MessageContext) {
    if (ctx.scene.step.firstTime) {
      const keyboard = new KeyboardBuilder()
        .textButton({label: 'Парни', color: ButtonColor.NEGATIVE, payload: {sexSearch: 0}})
        .textButton({label: 'Девушки', color: ButtonColor.POSITIVE, payload: {sexSearch: 1}})
        .textButton({label: 'Всё равно', color: ButtonColor.PRIMARY, payload: {sexSearch: 2}})
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

    ctx.scene.state.profile.sexSearch = ctx.messagePayload.sexSearch

    await ctx.scene.step.next()
  }

  @AddStep(3)
  async onCityInput(@Ctx() ctx: MessageContext) {
    if (ctx.scene.step.firstTime) {
      return ctx.send('Из какого ты города?', {keyboard: new KeyboardBuilder()})
    }

    ctx.scene.state.profile.city = ctx.text

    await ctx.scene.step.next()
  }

  @AddStep(4)
  async onNameInput(@Ctx() ctx: MessageContext) {
    if (ctx.scene.step.firstTime) {
      return ctx.send('Как мне тебя называть?')
    }

    ctx.scene.state.profile.name = ctx.text

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

    ctx.scene.state.profile.about = ctx.text

    if (ctx.scene.state.step) {
      return ctx.scene.step.go(7)
    }
    return ctx.scene.step.next()
  }

  @AddStep(6)
  async onPhotoInput(@Ctx() ctx: MessageContext) {
    if (ctx.scene.step.firstTime) {
      return ctx.send('Теперь пришли свое фото, его будут видеть другие пользователи', {keyboard: new KeyboardBuilder()})
    }

    if (!ctx.hasAttachments()) {
      return ctx.send('Пришли свое фото, его будут видеть другие пользователи')
    }

    // @ts-ignore
    ctx.scene.state.profile.photo = ctx.attachments[0].payload.orig_photo.url

    if (ctx.scene.state.step) {
      return ctx.scene.step.go(7)
    }
    return ctx.scene.step.next()
  }

  @AddStep(7)
  async onConfirmation(@Ctx() ctx: MessageContext) {
    if (ctx.scene.step.firstTime) {
      const {age, photo, city, about = '', name}  = ctx.scene.state.profile
      const profile = `
      Так выглядит твоя анкета:
      
      ${name}, ${age}, ${city}
      ${about}
      `
      await ctx.sendPhotos({value: photo}, {message: profile})

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

    await ctx.scene.enter(USER_MAIN_SCENE, {state: {profile: ctx.scene.state.profile}})
  }
}
