console.log('🟢 Server Status Plugin caricato');

const { client } = require('./bot');
const { statusJava, statusBedrock } = require('minecraft-server-util');

// Configurazioni server
const SERVER_IP = process.env.MC_SERVER_IP || '185.107.192.163';
const SERVER_PORT = Number(process.env.MC_SERVER_PORT) || 25565;
const SERVER_TYPE = process.env.MC_SERVER_TYPE?.toLowerCase() || 'java'; // java o bedrock

// Comando Discord
const COMMAND = '!server';

// Stato precedente
let lastServerOnline = false;

// Canale Discord per notifiche automatiche
const STATUS_CHANNEL_ID = process.env.SERVER_STATUS_CHANNEL_ID;

// Funzione universale per ottenere lo status del server
async function fetchServerStatus() {
  console.log('🧪 [1] fetchServerStatus() chiamata');
  try {
    let result;
    if (SERVER_TYPE === 'java') {
      console.log(`🧪 [2] Ping Java ${SERVER_IP}:${SERVER_PORT}`);
      result = await statusJava(SERVER_IP, SERVER_PORT, { timeout: 3000 });
    } else {
      console.log(`🧪 [2] Ping Bedrock ${SERVER_IP}:${SERVER_PORT}`);
      result = await statusBedrock(SERVER_IP, SERVER_PORT, { timeout: 3000 });
    }
    console.log('✅ [3] Server raggiungibile:', result);

    return {
      online: true,
      players: SERVER_TYPE === 'java' 
        ? `${result.players.online} / ${result.players.max}` 
        : `${result.playersOnline} / ${result.playersMax}`,
      motd: result.motd.clean || '',
    };
  } catch (err) {
    console.warn('❌ [X] Server non raggiungibile:', err.message || err);
    return { online: false };
  }
}

// Funzione per monitor automatico
async function checkServerStatus() {
  console.log('⏱️ [A] checkServerStatus()');
  const status = await fetchServerStatus();

  try {
    const channel = await client.channels.fetch(STATUS_CHANNEL_ID);
    if (!channel) return console.error('⚠️ Canale Discord non trovato');

    // OFFLINE → ONLINE
    if (status.online && !lastServerOnline) {
      console.log('🟢 Server appena andato ONLINE');
      await channel.send({
        embeds: [{
          color: 0x57F287,
          title: '🟢 Server ONLINE',
          description: 'Il server Minecraft è ora disponibile!',
          fields: [
            { name: 'IP', value: SERVER_IP, inline: true },
            { name: 'Porta', value: String(SERVER_PORT), inline: true },
            { name: 'Giocatori', value: status.players, inline: false },
          ],
          timestamp: new Date()
        }]
      });
    }

    // ONLINE → OFFLINE
    if (!status.online && lastServerOnline) {
      console.log('🔴 Server appena andato OFFLINE');
      await channel.send({
        embeds: [{
          color: 0xED4245,
          title: '🔴 Server OFFLINE',
          description: 'Il server Minecraft non è più raggiungibile.',
          fields: [
            { name: 'IP', value: SERVER_IP, inline: true },
            { name: 'Porta', value: String(SERVER_PORT), inline: true },
          ],
          timestamp: new Date()
        }]
      });
    }

    lastServerOnline = status.online;

  } catch (err) {
    console.error('Errore invio messaggio Discord:', err);
  }
}

// Listener comando Discord
client.on('messageCreate', async (message) => {
  try {
    if (message.author.bot) return;
    if (!message.content.startsWith(COMMAND)) return;

    console.log('📡 Richiesta !server da', message.author.tag);

    const status = await fetchServerStatus();

    if (status.online) {
      await message.reply({
        embeds: [{
          color: 0x57F287,
          title: '🟢 Server ONLINE',
          fields: [
            { name: 'IP', value: SERVER_IP, inline: true },
            { name: 'Porta', value: String(SERVER_PORT), inline: true },
            { name: 'Giocatori', value: status.players, inline: false },
          ],
          timestamp: new Date()
        }]
      });
      console.log('✅ Risposta inviata: ONLINE');
    } else {
      await message.reply({
        embeds: [{
          color: 0xED4245,
          title: '🔴 Server OFFLINE',
          description: 'Il server non è raggiungibile al momento.',
          timestamp: new Date()
        }]
      });
      console.log('🔴 Risposta inviata: OFFLINE');
    }
  } catch (err) {
    console.error('Errore comando Discord !server:', err);
  }
});

console.log('🟢 Server Status Plugin attivo');

// Monitor automatico ogni 10 secondi (modifica se vuoi)
setInterval(checkServerStatus, 10 * 1000);
checkServerStatus();

console.log('⏱️ Monitor automatico avviato');
