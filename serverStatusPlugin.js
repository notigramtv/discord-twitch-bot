console.log('🟢 Server Status Plugin caricato');

const { client } = require('./bot');
const { status } = require('minecraft-server-util'); // endpoint universale

// CONFIG
const SERVER_IP = process.env.MC_SERVER_IP;
const SERVER_PORT = Number(process.env.MC_SERVER_PORT);
const STATUS_CHANNEL_ID = process.env.SERVER_STATUS_CHANNEL_ID;
const COMMAND = '!server';

let lastServerOnline = false;

// Funzione per ping del server
async function fetchServerStatus() {
  console.log('🧪 [1] fetchServerStatus() chiamata');
  console.log('🧪 [2] HOST:', SERVER_IP);
  console.log('🧪 [3] PORT:', SERVER_PORT);

  try {
    const result = await status(SERVER_IP, SERVER_PORT, {timeout: 3000 });
    console.log('🟢 [4] Server raggiungibile:', result);

    return {
      online: true,
      players: result.players ? `${result.players.online} / ${result.players.max}` : 'N/A'
    };
  } catch (err) {
    console.warn('❌ [X] Server non raggiungibile:', err.message || err);
    return { online: false };
  }
}

// Controllo automatico
async function checkServerStatus() {
  console.log('⏱️ [A] checkServerStatus()');
  const statusData = await fetchServerStatus();

  // Fetch canale
  if (!STATUS_CHANNEL_ID) {
    console.error('⚠️ STATUS_CHANNEL_ID non definito nelle variabili d’ambiente');
    return;
  }

  let channel;
  try {
    channel = await client.channels.fetch(STATUS_CHANNEL_ID);
    if (!channel) {
      console.error('⚠️ Canale Discord non trovato');
      return;
    }
  } catch (err) {
    console.error('⚠️ Errore fetch canale Discord:', err);
    return;
  }

  // ONLINE → OFFLINE o viceversa
  if (statusData.online && !lastServerOnline) {
    console.log('🟢 Server appena andato ONLINE');
    await channel.send({
      embeds: [{
        color: 0x57F287,
        title: '🟢 Server ONLINE',
        description: 'Il server Minecraft è ora disponibile!',
        fields: [
          { name: 'Giocatori', value: statusData.players, inline: false }
        ],
        timestamp: new Date()
      }]
    });
  } else if (!statusData.online && lastServerOnline) {
    console.log('🔴 Server appena andato OFFLINE');
    await channel.send({
      embeds: [{
        color: 0xED4245,
        title: '🔴 Server OFFLINE',
        description: 'Il server Minecraft non è più raggiungibile.',
        timestamp: new Date()
      }]
    });
  }

  lastServerOnline = statusData.online;
}

// Comando !server
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(COMMAND)) return;

  console.log('📡 [CMD] Richiesta stato server da', message.author.tag);

  const statusData = await fetchServerStatus();

  const embed = statusData.online
    ? {
        color: 0x57F287,
        title: '🟢 Server ONLINE',
        fields: [
          { name: 'Giocatori', value: statusData.players, inline: false }
        ],
        timestamp: new Date()
      }
    : {
        color: 0xED4245,
        title: '🔴 Server OFFLINE',
        description: 'Il server non è raggiungibile al momento.',
        timestamp: new Date()
      };

  try {
    await message.reply({ embeds: [embed] });
  } catch (err) {
    console.error('⚠️ Errore invio messaggio Discord:', err);
  }
});

console.log('🟢 Server Status Plugin attivo');

// Monitor automatico ogni 60 secondi
setInterval(checkServerStatus, 60 * 1000);
checkServerStatus(); // prima esecuzione immediata
console.log('⏱️ Monitor automatico stato server avviato');
