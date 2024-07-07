import {Ctx, Hears, Update} from 'nestjs-vk'
import {UseFilters} from '@nestjs/common'
import {MessageContext} from 'vk-io'

import {USER_PROFILE_SETTINGS_SCENE} from './user.constants'
import {VkExceptionFilter} from '../common'

@Update()
@UseFilters(VkExceptionFilter)
export default class UserUpdate {
  @Hears('/start')
  async start(@Ctx() ctx: MessageContext) {
    await ctx.scene.enter(USER_PROFILE_SETTINGS_SCENE, {state: {profile: {}}})
  }
}
