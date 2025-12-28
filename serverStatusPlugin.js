console.log('🟢 Server Status Plugin caricato');

const { client } = require('./bot');
const { statusJava } = require('minecraft-server-util');

const SERVER_IP = process.env.MC_SERVER_IP;
const SERVER_PORT = Number(process.env.MC_SERVER_PORT);

const COMMAND = '!server'; // puoi cambiarlo quando vuoi

let lastServerOnline = false;
const STATUS_CHANNEL_ID = process.env.SERVER_STATUS_CHANNEL_ID;

async function checkServerStatus() {
  try {
    const result = await statusJava(SERVER_IP, undefined, { timeout: 3000 });

    if (!lastServerOnline) {
      console.log('🟢 Server appena andato ONLINE');

      const channel = await client.channels.fetch(STATUS_CHANNEL_ID);

      await channel.send({
        embeds: [{
          color: 0x57F287,
          title: '🟢 Server ONLINE',
          description: 'Il server Minecraft è ora **disponibile**.',
          fields: [
            { name: 'IP', value: SERVER_IP, inline: true },
            { name: 'Porta', value: String(SERVER_PORT), inline: true },
            {
              name: 'Giocatori',
              value: `${result.players.online} / ${result.players.max}`,
              inline: false
            }
          ],
          timestamp: new Date()
        }]
      });
    }

    lastServerOnline = true;

  } catch {
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

client.on('messageCreate', async (message) => {
  try {
    if (message.author.bot) return;
    if (!message.content.startsWith(COMMAND)) return;

    console.log('📡 Richiesta stato server da', message.author.tag);

    const result = await statusJava(SERVER_IP, undefined, { timeout: 3000 });

    await message.reply({
      embeds: [{
        color: 0x57F287,
        title: '🟢 Server ONLINE',
        fields: [
          { name: 'IP', value: SERVER_IP, inline: true },
          { name: 'Porta', value: String(SERVER_PORT), inline: true },
          {
            name: 'Giocatori',
            value: `${result.players.online} / ${result.players.max}`,
            inline: false
          }
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

// Controllo automatico ogni 60 secondi
setInterval(checkServerStatus, 10 * 1000);
checkServerStatus();

console.log('⏱️ Monitor automatico stato server avviato');

