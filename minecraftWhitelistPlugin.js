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
    console.log('✅ 1');
    // Ignora bot
    if (message.author.bot) return;

    console.log('✅ 2');
    // Solo messaggi nel canale whitelist
    if (message.channel.id !== WHITELIST_CHANNEL_ID) return;

    console.log('✅ 3');
    const content = message.content;

    console.log('✅ 4');
    // Estrazione case-insensitive dei dati
    const twitchMatch = content.match(/twitch:\s*(.+)/i);
    const minecraftMatch = content.match(/minecraft:\s*(.+)/i);
    const tipoMatch = content.match(/tipo:\s*(.+)/i);

    console.log('✅ 5');
    if (!minecraftMatch || !tipoMatch) {
        console.log('✅ 6');
      console.log(`⚠️ Messaggio non valido da ${message.author.tag}`);
      return; // Non c'è abbastanza info
    }
    console.log('✅ 7');

    const minecraftName = minecraftMatch[1].trim();
    const tipo = tipoMatch[1].trim();

    console.log('✅ 8');
    // Ottieni UUID
    const uuid = await getMinecraftUUID(minecraftName, tipo);

    console.log('✅ 9');
    if (!uuid) {
        console.log('✅ 10');
      message.reply(`❌ Impossibile ottenere UUID per ${minecraftName} (Tipo: ${tipo})`);
      return;
    }

    console.log('✅ 11');
    // Scrive nel canale output
    const outputChannel = await client.channels.fetch(OUTPUT_CHANNEL_ID);
    console.log('✅ 12');
    await outputChannel.send(
      `Minecraft: ${minecraftName}\nUUID: ${uuid}\nTipo: ${tipo}`
    );
console.log('✅ 13');
    console.log(`📤 UUID inviato per ${minecraftName}: ${uuid}`);
    console.log('✅ 14');

  } catch (err) {
    console.log('✅ 15');
    console.error('Errore nel plugin Minecraft Whitelist:', err);
  }
});

console.log('✅ Minecraft Whitelist Plugin attivo');
