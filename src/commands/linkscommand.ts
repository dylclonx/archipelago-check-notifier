import Command from '../classes/command'
import { ApplicationCommandOption, ChatInputCommandInteraction, MessageFlags, EmbedBuilder } from 'discord.js'
import Database from '../utils/database'

export default class LinksCommand extends Command {
  name = 'links'
  description = 'Show all linked Archipelago players in this server.'

  options: ApplicationCommandOption[] = []

  constructor (client: any) {
    super()
    this.client = client
  }

  async execute (interaction: ChatInputCommandInteraction) {
    if (!interaction.guildId) {
      return interaction.reply({ content: 'This command can only be used in a server.', flags: [MessageFlags.Ephemeral] })
    }

    try {
      const links = await Database.getLinks(interaction.guildId)
      if (links.length === 0) {
        return interaction.reply({ content: 'No players are currently linked in this server.', flags: [MessageFlags.Ephemeral] })
      }

      const embed = new EmbedBuilder()
        .setTitle('Linked Archipelago Players')
        .setDescription(links.map(link => `**${link.archipelago_name}**: <@${link.discord_id}>`).join('\n'))
        .setColor('#0099ff')

      interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] })
    } catch (err) {
      console.error('Failed to get links:', err)
      interaction.reply({ content: 'Failed to retrieve links from database.', flags: [MessageFlags.Ephemeral] })
    }
  }
}
