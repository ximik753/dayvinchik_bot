import {Module} from '@nestjs/common'

import UserSettingsScene from './scenes/user-settings.scene'
import UserUpdate from './user.update'
import UserService from './user.service'
import UserScene from './scenes/user.scene'

@Module({
  providers: [UserSettingsScene, UserScene, UserUpdate, UserService]
})
export class UserModule {}
