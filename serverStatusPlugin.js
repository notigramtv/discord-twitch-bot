console.log('🟢 Server Status Plugin caricato');

const { client } = require('./bot');
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

const SERVER_HOST = process.env.MC_SERVER_IP;
const SERVER_PORT = Number(process.env.MC_SERVER_PORT);
const STATUS_CHANNEL_ID = process.env.SERVER_STATUS_CHANNEL_ID;

const COMMAND = '!server';

let lastServerOnline = false;

/* ============================
   FUNZIONE STATUS (DEBUG)
============================ */

async function fetchServerStatus() {
  console.log('🧪 [1] fetchServerStatus() chiamata');
  console.log('🧪 [2] HOST:', SERVER_HOST);
  console.log('🧪 [3] PORT:', SERVER_PORT);

  const url = `https://api.mcstatus.io/v2/status/${SERVER_HOST}`;
  console.log('🧪 [4] URL:', url);

  let res;
  try {
    console.log('🧪 [5] Invio richiesta HTTP...');
    res = await fetch(url, { timeout: 5000 });
    console.log('🧪 [6] Risposta ricevuta:', res.status);
  } catch (err) {
    console.error('❌ [X] Errore FETCH:', err);
    throw err;
  }

  let data;
  try {
    console.log('🧪 [7] Parsing JSON...');
    data = await res.json();
    console.log('🧪 [8] JSON ricevuto:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('❌ [X] Errore JSON:', err);
    throw err;
  }

  console.log('🧪 [9] data.online =', data.online);

  if (!data.online) {
    console.warn('⚠️ [10] Server risulta OFFLINE secondo API');
    throw new Error('Server offline');
  }

  console.log('🧪 [11] Server ONLINE confermato');

  return {
    online: true,
    playersOnline: data.players?.online ?? 0,
    playersMax: data.players?.max ?? 0,
    version: data.version?.name_clean ?? 'N/D',
    motd: data.motd?.clean ?? 'N/D',
    ip: data.host,
    port: data.port
  };
}

/* ============================
   MONITOR AUTOMATICO
============================ */

async function checkServerStatus() {
  console.log('⏱️ [A] checkServerStatus()');

  try {
    const result = await fetchServerStatus();

    if (!lastServerOnline) {
      console.log('🟢 [B] OFFLINE → ONLINE');

      const channel = await client.channels.fetch(STATUS_CHANNEL_ID);

      await channel.send({
        embeds: [{
          color: 0x57F287,
          title: '🟢 Server ONLINE',
          fields: [
            { name: 'IP', value: result.ip, inline: true },
            { name: 'Porta', value: String(result.port), inline: true },
            {
              name: 'Giocatori',
              value: `${result.playersOnline} / ${result.playersMax}`,
              inline: false
            }
          ],
          timestamp: new Date()
        }]
      });
    }

    lastServerOnline = true;

  } catch (err) {
    console.warn('🔴 [C] Errore status:', err.message);

    if (lastServerOnline) {
      console.log('🔴 [D] ONLINE → OFFLINE');

      const channel = await client.channels.fetch(STATUS_CHANNEL_ID);

      await channel.send({
        embeds: [{
          color: 0xED4245,
          title: '🔴 Server OFFLINE',
          description: 'Il server non è raggiungibile.',
          timestamp: new Date()
        }]
      });
    }

    lastServerOnline = false;
  }
}

/* ============================
   COMANDO !server
============================ */

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(COMMAND)) return;

  console.log('📡 [CMD] Richiesta !server da', message.author.tag);

  try {
    const result = await fetchServerStatus();

    await message.reply({
      embeds: [{
        color: 0x57F287,
        title: '🟢 Server ONLINE',
        fields: [
          { name: 'IP', value: result.ip, inline: true },
          { name: 'Porta', value: String(result.port), inline: true },
          {
            name: 'Giocatori',
            value: `${result.playersOnline} / ${result.playersMax}`,
            inline: false
          }
        ],
        timestamp: new Date()
      }]
    });

  } catch (err) {
    console.warn('🔴 [CMD] Server OFFLINE');

    await message.reply({
      embeds: [{
        color: 0xED4245,
        title: '🔴 Server OFFLINE',
        description: 'Il server non è raggiungibile.',
        timestamp: new Date()
      }]
    });
  }
});

/* ============================
   AVVIO
============================ */

console.log('🟢 Server Status Plugin attivo');
setInterval(checkServerStatus, 10 * 1000);
checkServerStatus();
console.log('⏱️ Monitor automatico avviato');
