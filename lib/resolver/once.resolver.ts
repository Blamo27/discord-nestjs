import { DiscordResolve } from '../interface/discord-resolve';
import { ClientEvents } from 'discord.js';
import { DiscordClient, OnDecoratorOptions } from '..';
import { ONCE_DECORATOR } from '../constant/discord.constant';
import { DiscordResolveOptions } from '../interface/discord-resolve-options';
import { DiscordMiddlewareService } from '../discord-middleware.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class OnceResolver implements DiscordResolve {
  constructor(private readonly discordMiddlewareService: DiscordMiddlewareService) {
  }

  resolve(options: DiscordResolveOptions): void {
    const {discordClient, instance, methodName, middlewareList} = options;
    const metadata: OnDecoratorOptions = Reflect.getMetadata(ONCE_DECORATOR, instance, methodName);
    if (metadata) {
      discordClient.once(metadata.event, async (...data: ClientEvents[keyof ClientEvents]) => {
        if (!this.isAllowGuild(discordClient, data)) {
          return;
        }
        if (this.isDenyGuild(discordClient, data)) {
          return;
        }
        await this.discordMiddlewareService.applyMiddleware(middlewareList, metadata.event, data);
        instance[methodName](...data);
      });
    }
  }


  private isAllowGuild(discordClient: DiscordClient, data: any[]): boolean {
    const guild = data.find((item) => !!item && !!item.guild);
    const guildId = !!guild && guild.guild.id;
    if (!!guildId) {
      return discordClient.isAllowGuild(guildId);
    }
    return true;
  }

  private isDenyGuild(discordClient: DiscordClient, data: any[] = []): boolean {
    const guild = data.find((item) => !!item && !!item.guild);
    const guildId = !!guild && guild.guild.id;
    if (!!guildId) {
      return discordClient.isDenyGuild(guildId);
    }
    return false;
  }
}