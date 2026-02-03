import Command from '../classes/command'
import { ApplicationCommandOption, ApplicationCommandOptionType, ChatInputCommandInteraction, MessageFlags } from 'discord.js'
import Database from '../utils/database'

export default class LinkCommand extends Command {
  name = 'link'
  description = 'Link an Archipelago player name to a Discord user.'

  options: ApplicationCommandOption[] = [
    {
      type: ApplicationCommandOptionType.String,
      name: 'player',
      description: 'The Archipelago player name',
      required: true
    },
    {
      type: ApplicationCommandOptionType.User,
      name: 'user',
      description: 'The Discord user to link (defaults to you)',
      required: false
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
    const user = interaction.options.getUser('user') || interaction.user

    try {
      await Database.linkUser(interaction.guildId, player, user.id)
      interaction.reply({
        content: `Linked Archipelago player **${player}** to <@${user.id}>. Notifications involving this player will now mention them.`,
        flags: [MessageFlags.Ephemeral]
      })
    } catch (err) {
      console.error('Failed to link user:', err)
      interaction.reply({ content: 'Failed to link user in database.', flags: [MessageFlags.Ephemeral] })
    }
  }
}
