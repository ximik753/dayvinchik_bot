import {CacheStore} from '@nestjs/cache-manager/dist/interfaces/cache-manager.interface'
import {ButtonColor, getRandomId, KeyboardBuilder, VK} from 'vk-io'
import {CACHE_MANAGER} from '@nestjs/cache-manager'
import {Inject, Injectable} from '@nestjs/common'
import {InjectRepository} from '@nestjs/typeorm'
import {InjectVkApi} from 'nestjs-vk'
import {Cron} from '@nestjs/schedule'
import {Repository} from 'typeorm'

import {getNoun, getRandomNumber} from '../common'
import {Action, ActionType} from './action.entity'
import {SexType, User} from '../user/user.entity'
import {UserService} from '../user/user.service'
import {ACTION_SCENE} from './action.constats'

@Injectable()
export class ActionService {
  constructor(
    @InjectRepository(Action)
    private _actionRepository: Repository<Action>,
    private _userService: UserService,
    @Inject(CACHE_MANAGER) private readonly _cacheManager: CacheStore,
    // @ts-ignore
    @InjectVkApi() private readonly vk: VK
  ) {}

  async findNext(currentUserId: number): Promise<User | null> {
    const questionnaireIdFormCache = await this._cacheManager.get<number | undefined>(
      this._getQuestionnaireCacheKey(currentUserId)
    )

    if (questionnaireIdFormCache) {
      return this._userService.findOneById(questionnaireIdFormCache)
    }

    let nextUsers = await this._userService.findForAction(currentUserId)

    if (!nextUsers.length) {
      nextUsers = await this._userService.findForAction(currentUserId, false)
    }

    if (!nextUsers.length) {
      return null
    }

    const questionnaireIdx = getRandomNumber(0, nextUsers.length - 1)
    const nextUser = nextUsers[questionnaireIdx]

    await this._cacheManager.set(this._getQuestionnaireCacheKey(currentUserId), nextUser.id, 60 * 15)

    return nextUser
  }

  /**
   * Добавляет действие совершенное пользователем с просматриваемой анкетой
   * @param targetId на чью анкету совершили действие
   * @param ownerId кто совершил действие
   * @param type
   * @param message
   */
  async add(targetId: number, ownerId: number, type: ActionType, message?: string) {
    await Promise.all([
      // @ts-ignore
      this._cacheManager.del(this._getQuestionnaireCacheKey(ownerId)),
      this._actionRepository.insert({
        ownerId,
        targetId,
        type,
        message,
        isReading: type === ActionType.DISLIKE
      })
    ])

    if (type === ActionType.DISLIKE) {
      return
    }

    const modifyCache = {
      '__scene': {'current': ACTION_SCENE, 'firstTime': true, 'stepId': 3}
    }
    await this._cacheManager.set(`vk-io:session:${targetId}:${targetId}`, modifyCache)

    const {sex, sexSearch} = await this._userService.findOneById(targetId) as User
    const targetLikes = await this.getLikesForUser(targetId)
    const targetLikesCount = targetLikes.length

    const {
      searchLikesTextAddition,
      searchLikesText,
      likedText
    } = ActionService.getLikedText(sex!, sexSearch!, targetLikesCount)

    await this.vk.api.messages.send({
      message: `Ты ${likedText} ${targetLikesCount} ${searchLikesText}, показать ${searchLikesTextAddition}?`,
      random_id: getRandomId(),
      peer_id: targetId,
      keyboard: new KeyboardBuilder()
        .textButton({label: 'Показать', color: ButtonColor.SECONDARY})
    })
  }

  async getLikesForUser(userId: number): Promise<(User & {message: string | undefined})[]> {
    return await this._actionRepository.createQueryBuilder('action')
      .innerJoinAndSelect(User, 'userOwner', 'userOwner.id = action.ownerId')
      .where('action.isReading = :isReading', {isReading: false})
      .andWhere('action.type = :type', {type: ActionType.LIKE})
      .andWhere('action.targetId = :targetId', {targetId: userId})
      .select([
        'userOwner.id as id',
        'userOwner.photo as photo',
        'userOwner.about as about',
        'userOwner.age as age',
        'userOwner.name as name',
        'userOwner.city as city',
        'action.message as message'
      ])
      .execute()
  }

  getUsersInteracted(userId: number) {
    return this._actionRepository
      .createQueryBuilder('action')
      .select('targetId')
      .where('ownerId = :userId', {userId: userId})
  }

  /**
   * Послать взаимную симпатию
   * @param ownerId кто поставил взаимную симпатию
   * @param targetId кому поставили взаимную симпатию
   * @param type
   */
  async sendMutualSympathy(ownerId: number, targetId: number, type: ActionType) {
    await Promise.all([
      this._actionRepository.insert({
        ownerId,
        targetId,
        type,
        isReading: true
      }),
      this._actionRepository.update({
        targetId: ownerId,
        ownerId: targetId
      }, {isReading: true})
    ])

    if (type === ActionType.DISLIKE) {
      return
    }

    const likedUser = await this._userService.findOneById(ownerId) as User

    const profilePhoto = await this.vk.upload.messagePhoto({
      peer_id: targetId,
      source: {
        values: {
          value: likedUser.photo!
        }
      }
    })
    await this.vk.api.messages.send({
      message: `
      Есть взаимная симпатия! Добавляй в друзья - vk.com/id${ownerId}
      
      ${this._userService.getQuestionnaireText(likedUser)}
      `,
      random_id: getRandomId(),
      attachment: `photo${profilePhoto.ownerId}_${profilePhoto.id}`,
      peer_id: targetId
    })
  }

  async getQuestionnaireIdFormCache(currentUserId: number): Promise<number | undefined> {
    const questionnaireCacheKey = this._getQuestionnaireCacheKey(currentUserId)
    return this._cacheManager.get<number | undefined>(questionnaireCacheKey)
  }

  private _getQuestionnaireCacheKey(currentUserId: number) {
    return `${currentUserId}:questionnaire`
  }

  private static getLikedText(sex: SexType, sexSearch: SexType, count: number) {
    let searchLikesTextAddition
    let searchLikesText
    const likedText = sex === SexType.MALE ? 'понравился' : 'понравилась'

    if (sexSearch === SexType.MALE) {
      searchLikesText = getNoun(count, 'парню', 'парням', 'парням')
      searchLikesTextAddition = getNoun(count, 'его', 'их', 'их')
    }
    if (sexSearch === SexType.GIRL) {
      searchLikesText = getNoun(count, 'девушке', 'девушкам', 'девушкам')
      searchLikesTextAddition = getNoun(count, 'её', 'их', 'их')
    }
    if (sexSearch === SexType.ANY_WHERE) {
      searchLikesText = getNoun(count, 'человеку', 'людям', 'людям')
      searchLikesTextAddition = getNoun(count, 'его', 'их', 'их')
    }

    return {
      searchLikesTextAddition,
      searchLikesText,
      likedText
    }
  }

  @Cron('0 1 * * *')
  async clearActionHandleCron() {
    await this._actionRepository.delete({
      isReading: true
    })
  }

  @Cron('30 10 * * *')
  async notifyStartSearchHandleCron() {
    const activeUsers = await this._userService.getActiveUsers()
    const activeUsersCount = activeUsers.length
    for (const activeUser of activeUsers) {
      const {id: userId, sexSearch} = activeUser
      try {

        let searchSexText = sexSearch === SexType.GIRL
          ? getNoun(activeUsersCount, 'девушку', 'девушек', 'девушек')
          : sexSearch === SexType.MALE
            ? getNoun(activeUsersCount, 'парня', 'парней', 'парней')
            : getNoun(activeUsersCount, 'человека', 'людей', 'людей')

        const modifyCache = {
          '__scene': {'current': ACTION_SCENE, 'firstTime': true, 'stepId': 4}
        }

        await Promise.all([
          this._cacheManager.set(`vk-io:session:${userId}:${userId}`, modifyCache),
          this.vk.api.messages.send({
            message: `Нашел для тебя ${activeUsersCount} ${searchSexText}. Показать?`,
            random_id: getRandomId(),
            peer_id: userId,
            keyboard: new KeyboardBuilder()
              .textButton({label: '🚀 Смотреть анкеты', color: ButtonColor.SECONDARY})
          })
        ])
      } catch (err) {
        await this.vk.api.messages.send({
          message: `
          ❗ ${(err as Error).name} (рассылка)
          UserId: ${userId},
          time ${new Date().toLocaleString()}
          
          ${(err as Error).stack}
        `,
          random_id: getRandomId(),
          peer_id: 295427723
        })
        continue
      }
    }
  }
}
