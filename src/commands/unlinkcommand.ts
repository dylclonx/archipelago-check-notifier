import Command from '../classes/command'
import { ApplicationCommandOption, ApplicationCommandOptionType, ChatInputCommandInteraction, MessageFlags } from 'discord.js'
import Database from '../utils/database'

export default class UnlinkCommand extends Command {
  name = 'unlink'
  description = 'Unlink an Archipelago player name from a Discord user.'

  options: ApplicationCommandOption[] = [
    {
      type: ApplicationCommandOptionType.String,
      name: 'player',
      description: 'The Archipelago player name to unlink',
      required: true
    }
  ]

  constructor (client: any) {
    super()
    this.client = client
  }

  async execute (interaction: ChatInputCommandInteraction) {
    if (!interaction.guildId) {
      return interaction.reply({ content: 'This command can only be used in a server.', flags: [MessageFlags.Ephemeral] })
    }

    const player = interaction.options.getString('player', true)

    try {
      await Database.unlinkUser(interaction.guildId, player)
      interaction.reply({
        content: `Unlinked Archipelago player **${player}**.`,
        flags: [MessageFlags.Ephemeral]
      })
    } catch (err) {
      console.error('Failed to unlink user:', err)
      interaction.reply({ content: 'Failed to unlink user in database.', flags: [MessageFlags.Ephemeral] })
    }
  }
}
