import {SexType} from '../user.entity'

export class UserUpdateDto {
  id: number

  photo?: string

  about?: string

  age?: number

  name?: string

  city?: string

  sex?: SexType

  sexSearch?: SexType
}
