import crypto from 'crypto';
import Discord from 'discord.js';
import { environment } from '../../environment';
import { getPracticeCategoryTextChannels, getPracticeCategoryVoiceChannels } from './categories';
import { VC_IDENTIFERS } from './constants';

export async function lockChannel(
  manager: Discord.GuildChannelManager,
  voiceChannel: Discord.VoiceChannel,
  member: Discord.GuildMember,
) {
  if (voiceChannel.parent?.name !== environment.channel_category) {
    return;
  }

  // Mute other users
  const otherUsers = voiceChannel.members.filter((m) => m.id !== member?.id);

  if (otherUsers) {
    const muteRequest = otherUsers.map(async (a) => {
      await a.voice.setMute(true);
    });
    await Promise.all(muteRequest);
  }

  // Update voice and text channel names
  const matchingTextChannel = getMatchingTextChannel(manager, voiceChannel.name);
  const newRoomName = getLockedChannelName(member);
  await voiceChannel.setName(newRoomName);
  await matchingTextChannel?.setName(newRoomName);
}

export async function unlockChannel(
  guildManager: Discord.GuildChannelManager,
  channel: Discord.VoiceChannel | string,
) {
  let updatedManager = guildManager;
  const voiceChannel =
    typeof channel === 'string' ? await getVoiceChannelFromName(updatedManager, channel) : channel;

  if (voiceChannel && isLockedVoiceChannel(voiceChannel)) {
    const matchingTextChannel = getMatchingTextChannel(updatedManager, voiceChannel.name);
    const practiceChannels = getPracticeCategoryVoiceChannels(updatedManager);
    if (practiceChannels) {
      const roomName = getNewUnlockedChannelName(practiceChannels.map((c) => c.name));
      if (!roomName) {
        return updatedManager;
      }
      const resp = await voiceChannel.setName(roomName);
      await matchingTextChannel?.setName(roomName);
      updatedManager = resp.guild.channels;
    }

    const unmuteRequest = voiceChannel.members.map(async (a) => {
      await a.voice.setMute(false);
    });
    await Promise.all(unmuteRequest);
  }
  return updatedManager;
}

export function isPracticeChannel(channel: Discord.GuildChannel) {
  if (channel?.parent?.name !== environment.channel_category) {
    return false;
  }
  if (channel?.name.startsWith(`${environment.channel_name_prefix}`)) {
    const id = channel.name.split(environment.channel_name_prefix)[1];

    if (VC_IDENTIFERS.includes(id)) {
      return true;
    }
  }
  if (channel?.name.endsWith(' 🔒')) {
    return true;
  }
  return false;
}

export function isLockedVoiceChannel(channel: Discord.VoiceChannel | Discord.GuildChannel) {
  if (channel.name.endsWith(' 🔒')) {
    return true;
  }
  return false;
}

export function getLockedChannelName(member: Discord.GuildMember) {
  const name = member.user.id;
  const hash = crypto
    .createHash('md5')
    .update(name)
    .digest('hex');
  return `${member.user.username.slice(0, 6)}'s  Room (${hash.slice(0, 6).toUpperCase()}) 🔒`;
}

export function getNewUnlockedChannelName(existingChannels: string[]) {
  const leftOverIdentifiers = VC_IDENTIFERS.filter(
    (n) => !existingChannels?.find((e) => e.includes(n)),
  );
  if (leftOverIdentifiers.length > 0) {
    const id = leftOverIdentifiers[existingChannels.length % (leftOverIdentifiers.length - 1)];
    return `${environment.channel_name_prefix}${id}`;
  }
  console.log('Out of room ids');
}

export function getMatchingTextChannel(
  channelManager: Discord.GuildChannelManager,
  roomName: string,
) {
  const existingTextChannels = getPracticeCategoryTextChannels(channelManager);
  const regex = /\((.+)\) 🔒$/g;
  const ids = regex.exec(roomName);
  const id = ids && ids[1];

  // Search unlocked channels
  const existingUnlockedChannel = existingTextChannels?.find(
    (tc) => tc.name === roomName.toLowerCase().replace(/\s/g, '-'),
  );
  if (existingUnlockedChannel) {
    return existingUnlockedChannel;
  }

  // Search locked channels
  const lockedChannelName = `${id}-🔒`.toLowerCase();
  return existingTextChannels?.find((tc) => {
    return tc.name.toLowerCase().endsWith(lockedChannelName);
  });
}

export async function setChannelBitrate(
  guildManager: Discord.GuildChannelManager,
  channel: Discord.VoiceChannel | string,
  bitrate: number,
) {
  const voiceChannel =
    typeof channel === 'string' ? await getVoiceChannelFromName(guildManager, channel) : channel;

  if (voiceChannel) {
    try {
      return await voiceChannel.edit({ bitrate: bitrate });
    } catch (error) {
      throw new Error(error.toString().split('int ')[1]);
    }
  }
}

async function getVoiceChannelFromName(manager: Discord.GuildChannelManager, channelName: string) {
  const existingChannels = getPracticeCategoryVoiceChannels(manager);
  return existingChannels?.find((c) =>
    c.name.toLocaleLowerCase().includes(channelName.toLocaleLowerCase()),
  );
}
