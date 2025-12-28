console.log('🟢 Server Status Plugin caricato');

const { client } = require('./bot');
const {
  statusJava,
  statusBedrock
} = require('minecraft-server-util');

const SERVER_IP = process.env.MC_SERVER_IP;
const SERVER_PORT = Number(process.env.MC_SERVER_PORT);
const SERVER_TYPE = (process.env.MC_SERVER_TYPE || 'java').toLowerCase();

const COMMAND = '!server'; // puoi cambiarlo quando vuoi

let lastServerOnline = false;
const STATUS_CHANNEL_ID = process.env.SERVER_STATUS_CHANNEL_ID;

async function checkServerStatus() {
  try {
    let result;

    if (SERVER_TYPE === 'java') {
      result = await statusJava(SERVER_IP, SERVER_PORT, { timeout: 3000 });
    } else {
      result = await statusBedrock(SERVER_IP, SERVER_PORT, { timeout: 3000 });
    }

    // 🔄 OFFLINE → ONLINE
    if (!lastServerOnline) {
      console.log('🟢 Server appena andato ONLINE');

      const channel = await client.channels.fetch(STATUS_CHANNEL_ID);

      await channel.send({
        embeds: [
          {
            color: 0x57F287,
            title: '🟢 Server ONLINE',
            description: 'Il server Minecraft è ora **disponibile**.',
            fields: [
              { name: 'IP', value: SERVER_IP, inline: true },
              { name: 'Porta', value: String(SERVER_PORT), inline: true },
              { name: 'Tipo', value: SERVER_TYPE.toUpperCase(), inline: true },
              {
                name: 'Giocatori',
                value: SERVER_TYPE === 'java'
                  ? `${result.players.online} / ${result.players.max}`
                  : `${result.playersOnline} / ${result.playersMax}`,
                inline: false
              }
            ],
            timestamp: new Date()
          }
        ]
      });
    }

    lastServerOnline = true;

  } catch (err) {
    // 🔄 ONLINE → OFFLINE
    if (lastServerOnline) {
      console.log('🔴 Server appena andato OFFLINE');

      try {
        const channel = await client.channels.fetch(STATUS_CHANNEL_ID);

        await channel.send({
          embeds: [
            {
              color: 0xED4245,
              title: '🔴 Server OFFLINE',
              description: 'Il server Minecraft non è più raggiungibile.',
              fields: [
                { name: 'IP', value: SERVER_IP, inline: true },
                { name: 'Porta', value: String(SERVER_PORT), inline: true },
                { name: 'Tipo', value: SERVER_TYPE.toUpperCase(), inline: true }
              ],
              timestamp: new Date()
            }
          ]
        });
      } catch (sendErr) {
        console.error('Errore invio messaggio OFFLINE:', sendErr);
      }
    }

    lastServerOnline = false;
  }
}


client.on('messageCreate', async (message) => {
  try {
    if (message.author.bot) return;
    if (!message.content.startsWith(COMMAND)) return;

    console.log('📡 Richiesta stato server da', message.author.tag);

    let result;

    if (SERVER_TYPE === 'java') {
      result = await statusJava(SERVER_IP, SERVER_PORT, {
        timeout: 3000
      });
    } else if (SERVER_TYPE === 'bedrock') {
      result = await statusBedrock(SERVER_IP, SERVER_PORT, {
        timeout: 3000
      });
    } else {
      await message.reply('❌ Tipo server non valido (java/bedrock)');
      return;
    }

    await message.reply({
      embeds: [
        {
          color: 0x57F287,
          title: '🟢 Server ONLINE',
          fields: [
            { name: 'IP', value: SERVER_IP, inline: true },
            { name: 'Porta', value: String(SERVER_PORT), inline: true },
            { name: 'Tipo', value: SERVER_TYPE.toUpperCase(), inline: true },
            {
              name: 'Giocatori',
              value: SERVER_TYPE === 'java'
                ? `${result.players.online} / ${result.players.max}`
                : `${result.playersOnline} / ${result.playersMax}`,
              inline: false
            }
          ],
          timestamp: new Date()
        }
      ]
    });

    console.log('✅ Server ONLINE');

  } catch (err) {
    console.warn('🔴 Server OFFLINE o non raggiungibile');

    await message.reply({
      embeds: [
        {
          color: 0xED4245,
          title: '🔴 Server OFFLINE',
          description: 'Il server non è raggiungibile al momento.',
          timestamp: new Date()
        }
      ]
    });
  }
});

console.log('🟢 Server Status Plugin attivo');

// Controllo automatico ogni 60 secondi
setInterval(checkServerStatus, 60 * 1000);

console.log('⏱️ Monitor automatico stato server avviato');

