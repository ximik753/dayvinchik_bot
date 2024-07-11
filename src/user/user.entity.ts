import {Entity, Column, PrimaryColumn, OneToMany} from 'typeorm'
import {Action} from '../action/action.entity'

export enum SexType {
  MALE,
  GIRL,
  ANY_WHERE
}

@Entity()
export class User {
  @PrimaryColumn()
  id: number

  @Column({nullable: true})
  photo?: string

  @Column({nullable: true})
  about?: string

  @Column({nullable: true})
  age?: number

  @Column({nullable: true})
  name?: string

  @Column({nullable: true})
  city?: string

  @Column({nullable: true})
  sex?: SexType

  @Column({nullable: true})
  sexSearch?: SexType

  @Column({default: false})
  isActive: boolean

  @OneToMany(type => Action, action => action.targetId)
  actionTargets: number[]

  @OneToMany(type => Action, action => action.ownerId)
  actionOwners: number[]
}
