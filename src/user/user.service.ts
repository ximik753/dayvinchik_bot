import {InjectRepository} from '@nestjs/typeorm'
import {Injectable} from '@nestjs/common'
import {Repository} from 'typeorm'

import {UserUpdateDto} from './dto/user-update.dto'
import {Action} from '../action/action.entity'
import {User} from './user.entity'

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private _userRepository: Repository<User>
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
      .andWhere('user.city = :city', {city: userForOwnerCity ? currentUser.city : undefined})
      .andWhere('user.id != :id', {id: currentUser.id})
      .andWhere(':minAge < user.age < :maxAge', {minAge: currentUser.age! - 2, maxAge: currentUser.age! + 2})
      .andWhere('user.isActive = true')
      .andWhere('action.ownerId is null')
      .getMany()
  }
}
