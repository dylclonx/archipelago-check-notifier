import { Client, Events, InteractionType, TextBasedChannel } from 'discord.js'
import Commands from './src/commands'
import Database from './src/utils/database'
import Monitors from './src/utils/monitors'
import { Connection } from './src/classes/connection'

const client = new Client({ intents: ['Guilds'] })

client.on(Events.ClientReady, async () => {
  Database.migrate()
  Commands.init(client)

  // Reconnect to all monitors
  const connections: Connection[] = await Database.getConnections()
  connections.forEach((result: any) => Monitors.make(result, client))
})

client.on(Events.InteractionCreate, async (interaction) => {
  switch (interaction.type) {
    case InteractionType.ApplicationCommandAutocomplete:
      Commands.Autocomplete(interaction)
      break
    case InteractionType.ApplicationCommand:
      Commands.Execute(interaction)
      Database.createLog(interaction.guildId || '0', interaction.user.id, `Executed command ${interaction.commandName}`)
      break
  }
})

client.on(Events.GuildCreate, async (guild) => {
  await Database.createLog(guild.id, '0', 'Added to guild')

  if (process.env.LOG_CHANNEL) {
    const channel = client.channels.cache.get(process.env.LOG_CHANNEL) as TextBasedChannel
    channel?.send(`Added to guild ${guild.name}`)
  }
})

client.on(Events.GuildDelete, async (guild) => {
  await Database.createLog(guild.id, '0', 'Removed from guild')
})

client.login(process.env.DISCORD_TOKEN)
