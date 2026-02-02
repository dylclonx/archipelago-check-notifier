import mysql from 'mysql2/promise'
import Monitor from '../classes/monitor'
import { Connection } from '../classes/connection'
import MonitorData from '../classes/monitordata'

const pool = mysql.createPool({
  host: process.env.MYSQLHOST || process.env.DB_HOST,
  user: process.env.MYSQLUSER || process.env.DB_USER,
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
  database: process.env.MYSQLDATABASE || process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
})

async function migrate (): Promise<void> {
  await pool.query('CREATE TABLE IF NOT EXISTS connections (id INT AUTO_INCREMENT PRIMARY KEY, host VARCHAR(255), port INT, game VARCHAR(255), player VARCHAR(255), channel VARCHAR(255))')
  await pool.query('CREATE TABLE IF NOT EXISTS activity_log (id INT AUTO_INCREMENT PRIMARY KEY, guild_id VARCHAR(255), user_id VARCHAR(255), action VARCHAR(255), timestamp DATETIME)')
}

async function createLog (guildId: string, userId: string, action: string) {
  await pool.query('INSERT INTO activity_log (guild_id, user_id, action, timestamp) VALUES (?, ?, ?, NOW())', [guildId, userId, action])
}

async function getConnections (): Promise<Connection[]> {
  const [rows] = await pool.query('SELECT * FROM connections')
  return rows as Connection[]
}

async function makeConnection (data: MonitorData): Promise<void> {
  await pool.query('INSERT INTO connections (host, port, game, player, channel) VALUES (?, ?, ?, ?, ?)', [data.host, data.port, data.game, data.player, data.channel])
}

async function removeConnection (monitor: Monitor) {
  await pool.query('DELETE FROM connections WHERE host = ? AND port = ? AND game = ? AND player = ? AND channel = ?', [monitor.data.host, monitor.data.port, monitor.data.game, monitor.data.player, monitor.channel.id])
}

const Database = {
  getConnections,
  makeConnection,
  removeConnection,
  createLog,
  migrate
}

export default Database
