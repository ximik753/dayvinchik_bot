import {Column, Entity, JoinColumn, ManyToOne, PrimaryColumn} from 'typeorm'
import {User} from '../user/user.entity'

export enum ActionType {
  LIKE,
  DISLIKE
}

@Entity()
export class Action {
  @PrimaryColumn({name: 'ownerId'})
  @ManyToOne(type => User)
  @JoinColumn({referencedColumnName: 'id', name: 'ownerId'})
  ownerId: number

  @PrimaryColumn({name: 'targetId'})
  @ManyToOne(type => User)
  @JoinColumn({referencedColumnName: 'id', name: 'targetId'})
  targetId: number

  @Column()
  type: ActionType

  @Column({nullable: true})
  message: string

  @Column()
  isReading: boolean
}
