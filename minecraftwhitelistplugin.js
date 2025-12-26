console.log('✅ Minecraft Whitelist Plugin caricato');

const { client } = require('./bot');

// CONFIG
const WHITELIST_CHANNEL_ID = '1450532753115320501';
const OUTPUT_CHANNEL_ID = '1454127695192653845';

// Listener REGISTRATO SUBITO
client.on('messageCreate', async (message) => {
  try {
    if (message.author.bot) return;
    if (message.channel.id !== WHITELIST_CHANNEL_ID) return;

    console.log('📩 Messaggio intercettato nel canale whitelist');

    const outputChannel = await client.channels.fetch(OUTPUT_CHANNEL_ID);
    await outputChannel.send('🧪 TEST: messaggio ricevuto');

    console.log('📤 Messaggio di test inviato');

  } catch (err) {
    console.error('❌ Errore plugin whitelist:', err);
  }
});
