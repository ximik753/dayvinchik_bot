import {TypeOrmModule} from '@nestjs/typeorm'
import {Module} from '@nestjs/common'

import {UserQuestionnaireChangingScene} from './scenes/user-questionnaire-changing.scene'
import {UserQuestionnaireSettingsScene} from './scenes/user-questionnaire-settings.scene'
import {UserService} from './user.service'
import UserUpdate from './user.update'
import {User} from './user.entity'

@Module({
  providers: [UserQuestionnaireChangingScene, UserQuestionnaireSettingsScene, UserUpdate, UserService],
  imports: [TypeOrmModule.forFeature([User])],
  exports: [TypeOrmModule, UserService]
})
export class UserModule {}
