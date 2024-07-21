import {InjectRepository} from '@nestjs/typeorm'
import {Injectable} from '@nestjs/common'
import {InjectVkApi} from 'nestjs-vk'
import {Repository} from 'typeorm'
import {VK} from 'vk-io'

import {UserUpdateDto} from './dto/user-update.dto'
import {Action} from '../action/action.entity'
import {User} from './user.entity'

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private _userRepository: Repository<User>,
    @InjectRepository(Action)
    private _actionRepository: Repository<Action>,
    // @ts-ignore
    @InjectVkApi() private readonly vk: VK
  ) {}

  async update(user: UserUpdateDto) {
    await this._userRepository.save(user)
  }

  async toggleActiveProfile(userId: number) {
    const {isActive} = await this.findOneById(userId) as User
    await this._userRepository.update({
      id: userId
    }, {isActive: !isActive})
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

    const subActionQuery = this._actionRepository
      .createQueryBuilder('action')
      .select('targetId')
      .where(`ownerId = ${currentUser.id}`)

    return this._userRepository.createQueryBuilder('user')
      .where(`user.id not in (${subActionQuery.getQuery()})`)
      .andWhere('(user.sex = :sex OR 2 = :sex)', {sex: currentUser.sexSearch})
      .andWhere(userForOwnerCity ? 'user.city = :city' : 'user.city != :city', {city: currentUser.city})
      .andWhere('user.id != :id', {id: currentUser.id})
      .andWhere('user.age between :minAge AND :maxAge', {minAge: currentUser.age! - 3, maxAge: currentUser.age! + 3})
      .andWhere('user.isActive = true')
      .getMany()
  }

  async getUserInfoFromVk(userId: number) {
    const usersGetResponse = await this.vk.api.users.get({
      user_ids: [userId],
      fields: ['photo_max_orig']
    })
    return usersGetResponse[0]
  }

  async getActiveUsers() {
    return this._userRepository.find({
      where: {
        isActive: true
      }
    })
  }

  getQuestionnaireText(user: User) {
    return `
    ${user.name}, ${user.age}, ${user.city}
    ${user.about || ''}
    `
  }
}
