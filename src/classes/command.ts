import { ApplicationCommandOption, AutocompleteInteraction, ChatInputCommandInteraction, Client } from 'discord.js'

export default class Command {
  name: string
  description: string
  options: ApplicationCommandOption[]

  client: Client

  execute (interaction: ChatInputCommandInteraction) {
    console.log('Command executed')
  }

  autocomplete (interaction: AutocompleteInteraction) {
    console.log('Command autocompleted')
  }
}
