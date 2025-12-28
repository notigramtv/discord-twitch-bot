console.log('🟢 Server Status Plugin caricato');

const { client } = require('./bot');

const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

// CONFIG
const SERVER_HOST = process.env.MC_SERVER_HOST; // es: play.notigram.aternos.me
const STATUS_CHANNEL_ID = process.env.SERVER_STATUS_CHANNEL_ID;
const COMMAND = '!server';

let lastServerOnline = false;

/**
 * Ping server tramite mcstatus.io (AFFIDABILE CON ATERNOS)
 */
async function fetchServerStatus() {
  const url = `https://api.mcstatus.io/v2/status/${SERVER_HOST}`;

  const res = await fetch(url, { timeout: 5000 });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json();
  if (!data.online) throw new Error('Server offline');

  return {
    playersOnline: data.players.online,
    playersMax: data.players.max,
    version: data.version.name_clean,
    motd: data.motd.clean,
    ip: data.host,
    port: data.port
  };
}

/**
 * MONITOR AUTOMATICO
 */
async function checkServerStatus() {
  try {
    const result = await fetchServerStatus();

    if (!lastServerOnline) {
      console.log('🟢 Server appena andato ONLINE');

      const channel = await client.channels.fetch(STATUS_CHANNEL_ID);

      await channel.send({
        embeds: [{
          color: 0x57F287,
          title: '🟢 Server ONLINE',
          description: 'Il server Minecraft è ora **disponibile**.',
          fields: [
            { name: 'Indirizzo', value: SERVER_HOST, inline: true },
            {
              name: 'Giocatori',
              value: `${result.playersOnline} / ${result.playersMax}`,
              inline: true
            },
            { name: 'Versione', value: result.version, inline: false }
          ],
          timestamp: new Date()
        }]
      });
    }

    lastServerOnline = true;

  } catch (err) {
    if (lastServerOnline) {
      console.log('🔴 Server appena andato OFFLINE');

      const channel = await client.channels.fetch(STATUS_CHANNEL_ID);

      await channel.send({
        embeds: [{
          color: 0xED4245,
          title: '🔴 Server OFFLINE',
          description: 'Il NotiCraft non è acceso al momento.',
          timestamp: new Date()
        }]
      });
    }

    lastServerOnline = false;
  }
}

/**
 * COMANDO !server
 */
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(COMMAND)) return;

  console.log('📡 Richiesta stato server da', message.author.tag);

  try {
    const result = await fetchServerStatus();

    await message.reply({
      embeds: [{
        color: 0x57F287,
        title: '🟢 Server ONLINE',
        fields: [
          { name: 'Indirizzo', value: SERVER_HOST, inline: true },
          {
            name: 'Giocatori',
            value: `${result.playersOnline} / ${result.playersMax}`,
            inline: true
          },
          { name: 'Versione', value: result.version, inline: false }
        ],
        timestamp: new Date()
      }]
    });

  } catch {
    await message.reply({
      embeds: [{
        color: 0xED4245,
        title: '🔴 Server OFFLINE',
        description: 'Il server non è raggiungibile al momento.',
        timestamp: new Date()
      }]
    });
  }
});

console.log('🟢 Server Status Plugin attivo');

// MONITOR AUTOMATICO (10s per test)
setInterval(checkServerStatus, 10 * 1000);
checkServerStatus();

console.log('⏱️ Monitor automatico stato server avviato');