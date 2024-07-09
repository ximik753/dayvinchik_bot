import {InjectRepository} from '@nestjs/typeorm'
import {Injectable} from '@nestjs/common'
import {Repository} from 'typeorm'

import {User} from './user.entity'
import {UserUpdateDto} from './dto/user-update.dto'

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private _userRepository: Repository<User>
  ) {}

  async update(user: UserUpdateDto) {
    await this._userRepository.save(user)
  }

  async findOneById(id: number) {
    return this._userRepository.findOne({
      where: {
        id
      }
    })
  }
}
