import Discord from 'discord.js';
import { environment } from '../environment';

export async function help(message: Discord.Message, discord: Discord.Client) {
  const response = new Discord.MessageEmbed()
    .setTitle('Help')
    .addField(`\`${environment.command_prefix}help\``, 'Displays this help message')
    .addField(
      `\`${environment.command_prefix}setup\``,
      "Creates the initial category and voice channel if you're admin",
    )
    .addField(
      `\`${environment.command_prefix}lock\``,
      'Locks the currently occupied room for exclusive use',
    )
    .addField(
      `\`${environment.command_prefix}bitrate <BITRATE_IN_KBPS>\``,
      'Admins can adjust the bitrate of the currently occupied room',
    )
    .addField(
      `\`${environment.command_prefix}unlock <CHANNEL_NAME>\``,
      "Admins unlock a channel by specifying the channel name. You may also just write a partial bit of the channel's name",
    )
    .addField(
      `\`${environment.command_prefix}unlock\``,
      'Unlocks the currently occupied room for shared use',
    )
    .setColor(environment.embed_color)
    .setTimestamp();

  await message.author.send(response);
}
