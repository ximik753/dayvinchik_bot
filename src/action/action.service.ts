import {InjectRepository} from '@nestjs/typeorm'
import {Injectable} from '@nestjs/common'
import {Repository} from 'typeorm'

import {UserService} from '../user/user.service'
import {getRandomNumber} from '../common'
import {User} from '../user/user.entity'
import {Action} from './action.entity'

@Injectable()
export class ActionService {
  constructor(
    @InjectRepository(Action)
    private _actionRepository: Repository<Action>,
    private _userService: UserService
  ) {}

  async findNext(currentUserId: number): Promise<User | null> {
    let nextUsers = await this._userService.findForAction(currentUserId)

    if (!nextUsers.length) {
      nextUsers = await this._userService.findForAction(currentUserId, false)
    }

    if (!nextUsers.length) {
      return null
    }

    const questionnaireIdx = getRandomNumber(0, nextUsers.length - 1)

    return nextUsers[questionnaireIdx]
  }
}
