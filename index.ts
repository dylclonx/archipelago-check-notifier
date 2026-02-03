import { Client, Events, InteractionType, MessageFlags } from 'discord.js'
import Commands from './src/commands'
import Database from './src/utils/database'
import Monitors from './src/utils/monitors'
import { Connection } from './src/classes/connection'

const client = new Client({ intents: ['Guilds'] })

client.on(Events.ClientReady, async () => {
  try {
    await Database.migrate()
    console.log('Database migrated.')
  } catch (err) {
    console.error('Database migration failed:', err)
  }

  try {
    await Commands.init(client)
    console.log('Commands initialized.')
  } catch (err) {
    console.error('Command initialization failed:', err)
  }

  // Reconnect to all monitors
  try {
    const connections: Connection[] = await Database.getConnections()
    console.log(`Reconnecting to ${connections.length} monitors...`)
    for (const result of connections) {
      Monitors.make(result, client).catch(err => {
        console.error(`Failed to reconnect to monitor ${result.host}:${result.port}:`, err)
      })
    }
  } catch (err) {
    console.error('Failed to load connections from database:', err)
  }
})

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    switch (interaction.type) {
      case InteractionType.ApplicationCommandAutocomplete:
        Commands.Autocomplete(interaction)
        break
      case InteractionType.ApplicationCommand:
        Commands.Execute(interaction)
        await Database.createLog(interaction.guildId || '0', interaction.user.id, `Executed command ${interaction.commandName}`)
        break
    }
  } catch (err) {
    console.error('Interaction error:', err)
    if (interaction.type === InteractionType.ApplicationCommand) {
      if (interaction.replied || interaction.deferred) {
        interaction.followUp({ content: 'There was an error while executing this command!', flags: [MessageFlags.Ephemeral] }).catch(() => {})
      } else {
        interaction.reply({ content: 'There was an error while executing this command!', flags: [MessageFlags.Ephemeral] }).catch(() => {})
      }
    }
  }
})

client.on(Events.GuildCreate, async (guild) => {
  await Database.createLog(guild.id, '0', 'Added to guild')

  if (process.env.LOG_CHANNEL) {
    const channel = client.channels.cache.get(process.env.LOG_CHANNEL)
    if (channel?.isTextBased()) {
      (channel as any).send(`Added to guild ${guild.name}`).catch(console.error)
    }
  }
})

client.on(Events.GuildDelete, async (guild) => {
  await Database.createLog(guild.id, '0', 'Removed from guild')
})

client.login(process.env.DISCORD_TOKEN)
