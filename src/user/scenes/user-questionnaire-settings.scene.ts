import {UseFilters} from '@nestjs/common'
import {ButtonColor, KeyboardBuilder, MessageContext} from 'vk-io'
import {AddStep, Ctx, Scene} from 'nestjs-vk'

import {USER_QUESTIONNAIRE_SETTINGS_SCENE, USER_QUESTIONNAIRE_CHANGING_SCENE} from '../user.constants'
import {VkExceptionFilter} from '../../common'

@UseFilters(VkExceptionFilter)
@Scene(USER_QUESTIONNAIRE_SETTINGS_SCENE)
export class UserQuestionnaireSettingsScene {
  @AddStep(0)
  async onInit(@Ctx() ctx: MessageContext) {
    const messageText = `
    1. Заполнить анкету заново.
    2. Изменить фото.
    3. Изменить текст анкеты.
    ***
    4. Смотреть анкеты.`

    if (ctx.scene.step.firstTime) {
      const keyboard = new KeyboardBuilder()
        .row()
        .textButton({label: '1', color: ButtonColor.NEGATIVE, payload: {createNew: true}})
        .textButton({label: '2', color: ButtonColor.SECONDARY, payload: {changePhoto: true}})
        .textButton({label: '3', color: ButtonColor.SECONDARY, payload: {changeAbout: true}})
        .row()
        .textButton({label: '4', color: ButtonColor.POSITIVE, payload: {search: true}})
      return ctx.send(messageText, {keyboard})
    }

    if (!ctx.hasMessagePayload) {
      return ctx.send(messageText)
    }

    if (ctx.messagePayload.createNew) {
      return ctx.scene.enter(USER_QUESTIONNAIRE_CHANGING_SCENE, {state: {profile: {}}})
    }

    if (ctx.messagePayload.changePhoto) {
      return ctx.scene.enter(USER_QUESTIONNAIRE_CHANGING_SCENE, {state: {profile: ctx.scene.state.profile, step: 6}})
    }

    if (ctx.messagePayload.changeAbout) {
      return ctx.scene.enter(USER_QUESTIONNAIRE_CHANGING_SCENE, {state: {profile: ctx.scene.state.profile, step: 5}})
    }

    if (ctx.messagePayload.search) {
      return ctx.send(`Функционал ещё не реализован`)
    }
  }
}
