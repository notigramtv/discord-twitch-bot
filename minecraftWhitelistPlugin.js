console.log('✅ Minecraft Whitelist Plugin caricato');

const { EmbedBuilder } = require('discord.js');
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

// CONFIG
const { client } = require('./bot');

const WHITELIST_CHANNEL_ID = '1450532753115320501';
const OUTPUT_CHANNEL_ID = '1454127695192653845';

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== WHITELIST_CHANNEL_ID) return;

  console.log('📩 Messaggio intercettato nel canale whitelist');
  console.log(message.content);

  const outputChannel = await client.channels.fetch(OUTPUT_CHANNEL_ID);
  if (!outputChannel) {
    console.log('❌ Canale output non trovato');
    return;
  }

  await outputChannel.send(
    `🧪 TEST OK\nMessaggio ricevuto:\n\n${message.content}`
  );

  console.log('📤 Messaggio di test inviato');
});
