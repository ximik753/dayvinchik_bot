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

  @Column()
  photo: string

  @Column()
  about?: string

  @Column()
  age: number

  @Column()
  name: string

  @Column()
  city: string

  @Column()
  sex: SexType

  @Column()
  sexSearch: SexType

  @OneToMany(type => Action, action => action.targetId)
  actionTargets: number[]

  @OneToMany(type => Action, action => action.ownerId)
  actionOwners: number[]
}
