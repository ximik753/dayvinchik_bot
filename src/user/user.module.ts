import {TypeOrmModule} from '@nestjs/typeorm'
import {Module} from '@nestjs/common'

import UserSettingsScene from './scenes/user-settings.scene'
import UserUpdate from './user.update'
import {UserService} from './user.service'
import UserScene from './scenes/user.scene'
import {User} from './user.entity'

@Module({
  providers: [UserSettingsScene, UserScene, UserUpdate, UserService],
  imports: [TypeOrmModule.forFeature([User])],
  exports: [TypeOrmModule]
})
export class UserModule {}
