console.log('✅ Minecraft Whitelist Plugin caricato');

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { client } = require('./bot');

// CONFIG
const WHITELIST_CHANNEL_ID = '1450532753115320501';
const OUTPUT_CHANNEL_ID = '1454127695192653845';

// Funzione per ottenere UUID da mcprofile.io
async function getMinecraftUUID(username, type) {
  try {
    const res = await fetch(`https://api.mcprofile.io/${encodeURIComponent(username)}/${encodeURIComponent(type.toLowerCase())}/json`);
    if (!res.ok) throw new Error(`Errore API: ${res.status}`);
    const data = await res.json();
    return data?.uuid || null;
  } catch (err) {
    console.error('Errore fetch UUID:', err);
    return null;
  }
}

client.on('messageCreate', async (message) => {
  try {
    // Ignora bot
    if (message.author.bot) return;

    // Solo messaggi nel canale whitelist
    if (message.channel.id !== WHITELIST_CHANNEL_ID) return;

    const content = message.content;

    // Estrazione case-insensitive dei dati
    const twitchMatch = content.match(/twitch:\s*(.+)/i);
    const minecraftMatch = content.match(/minecraft:\s*(.+)/i);
    const tipoMatch = content.match(/tipo:\s*(.+)/i);

    if (!minecraftMatch || !tipoMatch) {
      console.log(`⚠️ Messaggio non valido da ${message.author.tag}`);
      return; // Non c'è abbastanza info
    }

    const minecraftName = minecraftMatch[1].trim();
    const tipo = tipoMatch[1].trim();

    // Ottieni UUID
    const uuid = await getMinecraftUUID(minecraftName, tipo);

    if (!uuid) {
      message.reply(`❌ Impossibile ottenere UUID per ${minecraftName} (Tipo: ${tipo})`);
      return;
    }

    // Scrive nel canale output
    const outputChannel = await client.channels.fetch(OUTPUT_CHANNEL_ID);
    await outputChannel.send(
      `Minecraft: ${minecraftName}\nUUID: ${uuid}\nTipo: ${tipo}`
    );

    console.log(`📤 UUID inviato per ${minecraftName}: ${uuid}`);

  } catch (err) {
    console.error('Errore nel plugin Minecraft Whitelist:', err);
  }
});

console.log('✅ Minecraft Whitelist Plugin attivo');
