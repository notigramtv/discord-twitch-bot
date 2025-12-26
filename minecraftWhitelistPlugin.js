console.log('✅ Minecraft Whitelist Plugin caricato');

const { EmbedBuilder } = require('discord.js');
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

// CONFIG
const WHITELIST_CHANNEL_ID = '1450532753115320501';
const OUTPUT_CHANNEL_ID = '1454127695192653845';

const { client } = require('./bot');

client.once('ready', () => {
  console.log('✅ Minecraft Whitelist Plugin attivo');

  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.channel.id !== '1450532753115320501') return;

    console.log('📩 Messaggio intercettato nel canale whitelist');

    const outputChannel = await client.channels.fetch('1454127695192653845');
    await outputChannel.send('🧪 TEST: messaggio ricevuto');
  });
});

