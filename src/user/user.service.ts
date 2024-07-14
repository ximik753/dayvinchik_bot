import {InjectRepository} from '@nestjs/typeorm'
import {Injectable} from '@nestjs/common'
import {InjectVkApi} from 'nestjs-vk'
import {Repository} from 'typeorm'
import {VK} from 'vk-io'

import {UserUpdateDto} from './dto/user-update.dto'
import {Action, ActionType} from '../action/action.entity'
import {User} from './user.entity'

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private _userRepository: Repository<User>,
    // @ts-ignore
    @InjectVkApi() private readonly vk: VK
  ) {}

  async update(user: UserUpdateDto) {
    await this._userRepository.save(user)
  }

  async findOneById(userId: number) {
    return this._userRepository.findOne({
      where: {
        id: userId
      }
    })
  }

  async findForAction(ownerId: number, userForOwnerCity = true) {
    const currentUser = await this.findOneById(ownerId) as User

    return this._userRepository.createQueryBuilder('user')
      .leftJoinAndSelect(Action, 'action', 'user.id = action.targetId')
      .where('(user.sex = :sex OR 2 = :sex)', {sex: currentUser.sexSearch})
      .andWhere(userForOwnerCity ? 'user.city = :city' : 'user.city != :city', {city: currentUser.city})
      .andWhere('user.id != :id', {id: currentUser.id})
      .andWhere(':minAge <= user.age <= :maxAge', {minAge: currentUser.age! - 2, maxAge: currentUser.age! + 2})
      .andWhere('user.isActive = true')
      .andWhere('action.ownerId is null')
      .getMany()
  }

  async getUserInfoFromVk(userId: number) {
    const usersGetResponse = await this.vk.api.users.get({
      user_ids: [userId],
      fields: ['photo_max_orig']
    })
    return usersGetResponse[0]
  }
}
