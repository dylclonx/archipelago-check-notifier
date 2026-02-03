import Command from '../classes/command'
import { ApplicationCommandOption, ApplicationCommandOptionType, AutocompleteInteraction, ChatInputCommandInteraction } from 'discord.js'
import Monitors from '../utils/monitors'

export default class UnmonitorCommand extends Command {
  name = 'unmonitor'
  description = 'Stop tracking an archipelago session.'

  options: ApplicationCommandOption[] = [
    { type: ApplicationCommandOptionType.String, name: 'uri', description: 'The URI of the archipelago room to remove.', required: true, autocomplete: true }
  ]

  constructor (client: any) {
    super()
    this.client = client
  }

  execute (interaction: ChatInputCommandInteraction) {
    const uri = interaction.options.getString('uri', true)

    // Do not remove if there is no monitor
    if (!Monitors.has(uri)) {
      interaction.reply({ content: `There is no active monitor on ${uri}.`, ephemeral: true })
      return
    }

    Monitors.remove(uri)
    interaction.reply({ content: `The tracker will no longer track ${uri}.`, ephemeral: true })
  }

  autocomplete (interaction: AutocompleteInteraction): void {
    if (interaction.guildId == null) return
    interaction.respond(Monitors.get(interaction.guildId).map(monitor => ({ name: monitor.client.uri || '', value: monitor.client.uri || '' })))
  }
}
