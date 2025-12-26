console.log('✅ Minecraft Whitelist Plugin caricato');

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { client } = require('./bot');

// CONFIG
const WHITELIST_CHANNEL_ID = '1450532753115320501';
const OUTPUT_CHANNEL_ID = '1454127695192653845';

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

// **Listener registrato subito**
client.on('messageCreate', async (message) => {
  try {
    // Ignora bot
    if (message.author.bot) return;

    // Solo canale whitelist
    if (message.channel.id !== WHITELIST_CHANNEL_ID) return;

    console.log(`📩 Messaggio intercettato: ${message.content}`);

    // Estrazione case-insensitive
    const minecraftMatch = message.content.match(/minecraft:\s*(.+)/i);
    const tipoMatch = message.content.match(/tipo:\s*(.+)/i);

    if (!minecraftMatch || !tipoMatch) {
      console.log(`⚠️ Messaggio non valido da ${message.author.tag}`);
      return;
    }

    const minecraftName = minecraftMatch[1].trim();
    const tipo = tipoMatch[1].trim();

    const uuid = await getMinecraftUUID(minecraftName, tipo);
    if (!uuid) {
      await message.reply(`❌ Impossibile ottenere UUID per ${minecraftName} (Tipo: ${tipo})`);
      return;
    }

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
