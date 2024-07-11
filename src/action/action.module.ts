import {TypeOrmModule} from '@nestjs/typeorm'
import {Module} from '@nestjs/common'

import {ActionScene} from './scenes/action.scene'
import {UserModule} from '../user/user.module'
import {ActionService} from './action.service'
import {Action} from './action.entity'

@Module({
  providers: [ActionService, ActionScene],
  imports: [TypeOrmModule.forFeature([Action]), UserModule],
  exports: [TypeOrmModule]
})
export class ActionModule {}
