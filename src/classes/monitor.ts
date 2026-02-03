import { EmbedBuilder, Guild, Client as DiscordClient, GuildChannel } from 'discord.js'
import { Client, CollectJSONPacket, HintJSONPacket, ITEMS_HANDLING_FLAGS, ItemSendJSONPacket, PrintJSONPacket, SERVER_PACKET_TYPE, SlotData } from 'archipelago.js'
import MonitorData from './monitordata'
import RandomHelper from '../utils/randohelper'

export default class Monitor {
  client: Client<SlotData>
  channel: any
  guild: Guild
  data: MonitorData

  isReconnecting: boolean

  queue = {
    hints: [] as string[],
    items: [] as string[]
  }

  convertData (message: ItemSendJSONPacket | CollectJSONPacket | HintJSONPacket) {
    return message.data.map((slot) => {
      switch (slot.type) {
        case 'player_id':
          return `**${this.client.players.get(parseInt(slot.text))?.name}**`
        case 'item_id':
          return `*${RandomHelper.getItem(this.client, slot.player, parseInt(slot.text), slot.flags)}*`
        case 'location_id':
          return `**${RandomHelper.getLocation(this.client, slot.player, parseInt(slot.text))}**`
        default:
          return slot.text
      }
    }).join(' ')
  }

  addQueue (message: string, type: 'hints' | 'items' = 'hints') {
    if (this.queue.hints.length === 0 && this.queue.items.length === 0) setTimeout(() => this.sendQueue(), 150)

    switch (type) {
      case 'hints':
        this.queue.hints.push(message)
        break
      case 'items':
        this.queue.items.push(message)
        break
    }
  }

  sendQueue () {
    const fields = this.queue.hints.map((message, index) => ({ name: `#${index + 1}`, value: message }))
    this.queue.hints = []
    // split into multiple messages if there are too many items
    while (fields.length > 0) {
      const message = new EmbedBuilder().setTitle('Hints').addFields(fields.splice(0, 25)).data
      this.channel.send({ embeds: [message] }).catch(console.error)
    }

    const items = this.queue.items.map((message, index) => ({ name: `#${index + 1}`, value: message }))
    this.queue.items = []
    // split into multiple messages if there are too many items
    while (items.length > 0) {
      const message = new EmbedBuilder().setTitle('Items').addFields(items.splice(0, 25)).data
      this.channel.send({ embeds: [message] }).catch(console.error)
    }
  }

  send (message: string) {
    // make an embed for the message
    const embed = new EmbedBuilder().setDescription(message).setTitle('Archipelago')
    this.channel.send({ embeds: [embed.data] }).catch(console.error)
  }

  constructor (client: Client<SlotData>, monitorData: MonitorData, discordClient: DiscordClient) {
    this.client = client
    this.data = monitorData

    const channel = discordClient.channels.cache.get(monitorData.channel)
    if (!channel || !channel.isTextBased() || !(channel instanceof GuildChannel)) {
      throw new Error(`Channel ${monitorData.channel} not found, is not text-based, or is not a guild channel.`)
    }

    this.channel = channel
    this.guild = channel.guild

    client.addListener(SERVER_PACKET_TYPE.CONNECTION_REFUSED, this.onDisconnect.bind(this))
    client.addListener(SERVER_PACKET_TYPE.PRINT_JSON, this.onJSON.bind(this))
  }

  onDisconnect () {
    this.send('Disconnected from the server.')

    if (this.isReconnecting) return
    this.isReconnecting = true

    // try to reconnect every 5 minutes
    this.client.connect({
      game: this.data.game,
      hostname: this.data.host,
      port: this.data.port,
      name: this.data.player,
      items_handling: ITEMS_HANDLING_FLAGS.REMOTE_ALL,
      version: { major: 0, minor: 5, build: 0 }
    }).then(() => { this.isReconnecting = false }).catch(() => { setTimeout(() => { this.isReconnecting = false; this.onDisconnect() }, 300000) })
  }

  // When a message is received from the server
  onJSON (packet: PrintJSONPacket) {
    switch (packet.type) {
      case 'Collect':
      case 'ItemSend':
        this.addQueue(this.convertData(packet), 'items')
        break
      case 'Hint':
        this.addQueue(this.convertData(packet), 'hints')
        break
      case 'Join':
        // Overrides for special join messages
        if (packet.tags.includes('Monitor')) return
        if (packet.tags.includes('IgnoreGame')) {
          this.send(`A tracker for **${this.client.players.get(packet.slot)?.name}** has joined the game!`)
          return
        }

        this.send(`**${this.client.players.get(packet.slot)?.name}** (${this.client.players.get(packet.slot)?.game}) joined the game!`)
        break
      case 'Part':
        this.send(`**${this.client.players.get(packet.slot)?.name}** (${this.client.players.get(packet.slot)?.game}) left the game!`)
        break
    }
  }
}
