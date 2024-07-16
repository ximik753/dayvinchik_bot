import {Global, Module} from '@nestjs/common'
import {ioRedisStore} from '@tirke/node-cache-manager-ioredis'
import {ConfigModule, ConfigService} from '@nestjs/config'
import {CacheModule} from '@nestjs/cache-manager'
import {RedisStorage} from 'vk-io-redis-storage'
import {ScheduleModule} from '@nestjs/schedule'
import {SessionManager} from '@vk-io/session'
import {TypeOrmModule} from '@nestjs/typeorm'
import {VkModule} from 'nestjs-vk'

import {ActionModule} from './action/action.module'
import {UserModule} from './user/user.module'
import {Action} from './action/action.entity'
import {User} from './user/user.entity'

@Global()
@Module({
  imports: [
    ScheduleModule.forRoot({}),
    ConfigModule.forRoot({isGlobal: true, envFilePath: '.env'}),
    CacheModule.register({
      store: ioRedisStore,
      isGlobal: true
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'dayvinchik',
      entities: [User, Action],
      synchronize: true
    }),
    VkModule.forManagers({
      useSessionManager: new SessionManager({
        storage: new RedisStorage({
          redis: {
            host: '127.0.0.1'
          }
        }),
        getStorageKey: (ctx) =>
          ctx.userId
            ? `${ctx.userId}:${ctx.userId}`
            : `${ctx.peerId}:${ctx.senderId}`
      })
    }),
    VkModule.forRootAsync({
      imports: [],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        token: configService.get<string>('BOT_TOKEN') as string,
        options: {
          pollingGroupId: configService.get<number>('BOT_GROUP_ID'),
          apiMode: 'parallel'
        },
        notReplyMessage: true,
        include: [UserModule, ActionModule]
      })
    }),
    UserModule, ActionModule
  ]
})
export class AppModule {}
