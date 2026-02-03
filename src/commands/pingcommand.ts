import Command from '../classes/command'
import { ApplicationCommandOption, ChatInputCommandInteraction } from 'discord.js'

export default class PingCommand extends Command {
  name = 'ping'
  description = 'Test the bot\'s responsiveness by a ping.'

  options: ApplicationCommandOption[] = []

  constructor (client: any) {
    super()
    this.client = client
  }

  execute (interaction: ChatInputCommandInteraction) {
    interaction.reply({ content: 'Pong!', ephemeral: true })
  }
}
