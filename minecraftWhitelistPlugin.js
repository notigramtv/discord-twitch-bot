console.log('✅ Minecraft Whitelist Plugin caricato');

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { client } = require('./bot');

// CONFIG
const WHITELIST_CHANNEL_ID = '1450532753115320501';
const OUTPUT_CHANNEL_ID = '1454127695192653845';

// Funzione per ottenere UUID da mcprofile.io
async function getMinecraftUUID(username, type) {
  try {
    let url;
    if (type.toLowerCase() === 'java') {
      url = `https://api.mcprofile.io/api/v1/java/username/${encodeURIComponent(username)}`;
    } else if (type.toLowerCase() === 'bedrock') {
      url = `https://api.mcprofile.io/api/v1/bedrock/gamertag/${encodeURIComponent(username)}`;
    } else {
      throw new Error(`Tipo non valido: ${type}`);
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Errore API: ${res.status}`);
    const data = await res.json();

    // Java e Bedrock restituiscono UUID in data.uuid
    return data?.uuid || null;
  } catch (err) {
    console.error('⚠️ Errore fetch UUID:', err);
    return null;
  }
}

// Registrazione listener messaggi
client.on('messageCreate', async (message) => {
  try {
    // Ignora bot
    if (message.author.bot) return;

    // Solo messaggi nel canale whitelist
    if (message.channel.id !== WHITELIST_CHANNEL_ID) return;

    console.log('📩 Messaggio intercettato:', message.content);

    // Estrazione case-insensitive dei dati
    const twitchMatch = message.content.match(/twitch:\s*(.+)/i);
    const minecraftMatch = message.content.match(/minecraft:\s*(.+)/i);
    const tipoMatch = message.content.match(/tipo\s*:\s*(.+)/i);

    if (!minecraftMatch || !tipoMatch) {
      console.warn(`⚠️ Messaggio non valido da ${message.author.tag}`);
      const outputChannel = await client.channels.fetch(OUTPUT_CHANNEL_ID);
      await outputChannel.send(
        `⚠️ Messaggio non valido da **${message.author.tag}**\n` +
        `Messaggio ricevuto:\n\`\`\`\n${message.content}\n\`\`\`\n` +
        `Assicurati di scrivere:\nTwitch: <nome>\nMinecraft: <nome>\nTipo: Java|Bedrock`
      );
      return;
    }

    const minecraftName = minecraftMatch[1].trim();
    const tipo = tipoMatch[1].trim();

    console.log(`✅ Username Minecraft: ${minecraftName}, Tipo: ${tipo}`);

    // Ottieni UUID
    const uuid = await getMinecraftUUID(minecraftName, tipo);

    const outputChannel = await client.channels.fetch(OUTPUT_CHANNEL_ID);

    if (!uuid) {
      console.warn(`⚠️ Impossibile ottenere UUID per ${minecraftName} (Tipo: ${tipo})`);
      await outputChannel.send(
        `❌ Impossibile ottenere UUID per **${minecraftName}** (Tipo: ${tipo})\n` +
        `Verifica che lo username sia corretto e che il tipo sia Java o Bedrock.`
      );
      return;
    }

    // Messaggio dettagliato nel canale output
    await outputChannel.send(
      `📥 Nuova whitelist Minecraft ricevuta!\n` +
      `👤 Discord: **${message.author.tag}**\n` +
      `🎮 Twitch: **${twitchMatch ? twitchMatch[1].trim() : 'NON SPECIFICATO'}**\n` +
      `🪄 Minecraft: **${minecraftName}**\n` +
      `🆔 UUID: **${uuid}**\n` +
      `📱 Tipo: **${tipo}**`
    );

    console.log(`📤 UUID inviato per ${minecraftName}: ${uuid}`);

  } catch (err) {
    console.error('❌ Errore nel plugin Minecraft Whitelist:', err);

    try {
      const outputChannel = await client.channels.fetch(OUTPUT_CHANNEL_ID);
      await outputChannel.send(
        `❌ Errore interno durante l'elaborazione del messaggio di **${message.author.tag}**\n` +
        `Messaggio originale:\n\`\`\`\n${message.content}\n\`\`\`\n` +
        `Errore: ${err.message}`
      );
    } catch (e) {
      console.error('❌ Impossibile inviare messaggio di errore al canale output:', e);
    }
  }
});

console.log('✅ Minecraft Whitelist Plugin attivo e in ascolto sul canale whitelist');
