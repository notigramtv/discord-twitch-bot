console.log('✅ Minecraft Whitelist Plugin caricato');
const { EmbedBuilder } = require('discord.js');

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { client } = require('./bot');

// CONFIG
const WHITELIST_CHANNEL_ID = '1450532753115320501';
const OUTPUT_CHANNEL_ID = '1454127695192653845';

// Funzione per ottenere UUID da mcprofile.io
async function getMinecraftUUID(username, type) {
  try {
    const lowerType = type.toLowerCase();
    let url;

    if (lowerType === 'java') {
      url = `https://mcprofile.io/api/v1/java/username/${encodeURIComponent(username)}`;
    } else if (lowerType === 'bedrock') {
      url = `https://mcprofile.io/api/v1/bedrock/gamertag/${encodeURIComponent(username)}`;
    } else {
      console.warn(`Tipo sconosciuto: ${type}`);
      return null;
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Errore API: ${res.status}`);
    const data = await res.json();

    if (lowerType === 'java') return data?.uuid || null;
    if (lowerType === 'bedrock') return data?.floodgateuid || null;

    return null;
  } catch (err) {
    console.error('⚠️ Errore fetch UUID:', err);
    return null;
  }
}

// Listener sul canale whitelist
client.on('messageCreate', async (message) => {
  try {
    // Ignora bot
    if (message.author.bot) return;

    // Solo messaggi nel canale whitelist
    if (message.channel.id !== WHITELIST_CHANNEL_ID) return;

    console.log('📩 Messaggio intercettato:', message.content);

    const content = message.content;

    // Estrazione case-insensitive dei dati
    const minecraftMatch = content.match(/minecraft\s*:\s*(.+)/i);
    const tipoMatch = content.match(/tipo\s*:\s*(.+)/i);

    if (!minecraftMatch || !tipoMatch) {
      console.log(`⚠️ Messaggio non valido da ${message.author.tag}`);
      return;
    }

    const minecraftName = minecraftMatch[1].trim();
    const tipo = tipoMatch[1].trim();

    console.log(`✅ Username Minecraft: ${minecraftName}, Tipo: ${tipo}`);

    // Ottieni UUID
    const uuid = await getMinecraftUUID(minecraftName, tipo);

    if (!uuid) {
      await message.reply(`❌ Impossibile ottenere UUID per ${minecraftName} (Tipo: ${tipo})`);
      console.log(`⚠️ UUID non disponibile per ${minecraftName}`);
      return;
    }

    // Scrive nel canale output
    const outputChannel = await client.channels.fetch(OUTPUT_CHANNEL_ID);
    const embed = new EmbedBuilder()
  .setTitle('🎮 Nuovo Utente Server Minecraft')
  .setColor(tipo.toLowerCase() === 'java' ? 0x3BA55D : 0x5865F2)
  .addFields(
    { name: '🧱 Minecraft', value: minecraftName, inline: true },
    { name: '🆔 UUID', value: `\`${uuid}\``, inline: false },
    { name: '📦 Tipo', value: tipo, inline: true }
  )
  .setTimestamp();

await outputChannel.send({ embeds: [embed] });
    /*await outputChannel.send(
      `Minecraft: ${minecraftName}\nUUID: ${uuid}\nTipo: ${tipo}`
    );*/

    console.log(`📤 UUID inviato per ${minecraftName}: ${uuid}`);
  } catch (err) {
    console.error('Errore nel plugin Minecraft Whitelist:', err);
  }
});

console.log('✅ Minecraft Whitelist Plugin attivo e in ascolto sul canale whitelist');
