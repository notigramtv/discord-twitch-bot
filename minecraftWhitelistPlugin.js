console.log('✅ Minecraft Whitelist Plugin caricato');

const { EmbedBuilder } = require('discord.js');
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

// CONFIG
const WHITELIST_CHANNEL_ID = '1450532753115320501';
const OUTPUT_CHANNEL_ID = '1454127695192653845';

// Importiamo il client già avviato
const { client } = require('./bot');

client.on('messageCreate', async (message) => {
  try {
    // Filtri di sicurezza
    if (message.author.bot) return;
    if (message.channel.id !== WHITELIST_CHANNEL_ID) return;

    const lines = message.content.split('\n').map(l => l.trim());

    const mcLine = lines.find(l => l.toLowerCase().startsWith('minecraft:'));
    const typeLine = lines.find(l => l.toLowerCase().startsWith('tipo:'));

    if (!mcLine || !typeLine) return;

    const minecraftUsername = mcLine.split(':').slice(1).join(':').trim();
    const type = typeLine.split(':').slice(1).join(':').trim().toLowerCase();

    if (!minecraftUsername) return;
    if (type !== 'java' && type !== 'bedrock') return;

    // Endpoint corretto
    const apiUrl =
      type === 'java'
        ? `https://mcprofile.io/api/v1/java/username/${encodeURIComponent(minecraftUsername)}`
        : `https://mcprofile.io/api/v1/bedrock/gamertag/${encodeURIComponent(minecraftUsername)}`;

    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error(`mcprofile API ${res.status}`);

    const data = await res.json();
    if (!data || !data.uuid) throw new Error('UUID non trovato');

    const embed = new EmbedBuilder()
      .setTitle('🧱 Minecraft Whitelist')
      .setColor(type === 'java' ? 0x00ff9c : 0x3498db)
      .addFields(
        { name: '👤 Username', value: `\`${data.username || minecraftUsername}\``, inline: true },
        { name: '🆔 UUID', value: `\`${data.uuid}\``, inline: false },
        { name: '🧩 Tipo', value: type === 'java' ? 'Java Edition' : 'Bedrock Edition', inline: true }
      )
      .setFooter({ text: 'mcprofile.io' })
      .setTimestamp();

    const outputChannel = await client.channels.fetch(OUTPUT_CHANNEL_ID);
    await outputChannel.send({ embeds: [embed] });

  } catch (err) {
    console.error('Errore plugin whitelist Minecraft:', err.message);
  }
});
