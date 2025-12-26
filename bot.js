//require('dotenv').config({ path: './info.env' });

//NUOVA VARIABILE
const cron = require('node-cron');
//--------

const fs = require('fs');
const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    Partials 
} = require('discord.js');

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const BROADCASTER_TOKEN = process.env.BROADCASTER_TOKEN; // usato solo per info canale
const TWITCH_CHANNEL_NAME = process.env.TWITCH_CHANNEL_NAME;
const ROLE_NAME = process.env.ROLE_NAME || "Minecrafter";
const USER_TOKENS_FILE = './user_tokens.json';

//NUOVE VARIABILI
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const MINECRAFTER_ROLE_NAME = 'Minecrafter';
const LOG_CHANNEL_ID = '1451568585129328691';
//--------

//NUOVE FUNZIONI
let appAccessToken = null;
let appTokenExpiresAt = 0;

async function getAppAccessToken() {
  const now = Date.now();

  // Se il token è ancora valido, riusalo
  if (appAccessToken && now < appTokenExpiresAt) {
    return appAccessToken;
  }

  const res = await fetch(
    `https://id.twitch.tv/oauth2/token` +
    `?client_id=${CLIENT_ID}` +
    `&client_secret=${CLIENT_SECRET}` +
    `&grant_type=client_credentials`,
    { method: 'POST' }
  );

  const data = await res.json();

  if (!data.access_token) {
    throw new Error('Impossibile ottenere App Access Token Twitch');
  }

  appAccessToken = data.access_token;
  appTokenExpiresAt = now + (data.expires_in * 1000) - 60_000; // margine 1 min

  return appAccessToken;
}
//--------

if (!DISCORD_TOKEN) {
    throw new Error("DISCORD_TOKEN non presente nelle env!");
}

// Carica token utenti salvati
let userTokens = {};
if (fs.existsSync(USER_TOKENS_FILE)) {
    userTokens = JSON.parse(fs.readFileSync(USER_TOKENS_FILE, 'utf8'));
}

// Inizializza bot Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel]
});

let broadcasterId = null;

// Funzione per chiamare Twitch API
async function twitchGET(url, token) {
    const res = await fetch(url, {
        headers: {
            'Client-ID': CLIENT_ID,
            'Authorization': `Bearer ${token}`
        }
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Twitch API ${res.status}: ${text}`);
    }
    return res.json();
}

// Inizializza l'ID Twitch del tuo canale
async function initBroadcasterId() {
    const res = await twitchGET(`https://api.twitch.tv/helix/users?login=${TWITCH_CHANNEL_NAME}`, BROADCASTER_TOKEN);
    if (!res.data || res.data.length === 0) throw new Error(`Canale Twitch "${TWITCH_CHANNEL_NAME}" non trovato.`);
    broadcasterId = res.data[0].id;
    console.log(`Broadcaster ID Twitch: ${broadcasterId}`);
}

// Ottieni ID Twitch dell’utente a partire dal token OAuth
async function getTwitchUserId(userToken) {
    const res = await twitchGET('https://api.twitch.tv/helix/users', userToken);
    if (!res.data || res.data.length === 0) return null;
    return res.data[0].id;
}

// Controlla se un utente segue il canale
async function isFollower(twitchUserId, userToken) {
    if (!broadcasterId) throw new Error("Broadcaster ID non inizializzato");

    const url = `https://api.twitch.tv/helix/channels/followed?user_id=${twitchUserId}&broadcaster_id=${broadcasterId}`;
    const res = await fetch(url, {
        headers: {
            'Client-ID': CLIENT_ID,
            'Authorization': `Bearer ${userToken}` // token OAuth dell'utente
        }
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Twitch API ${res.status}: ${text}`);
    }

    const data = await res.json();
    return data.data && data.data.length > 0; // true se segue
}

async function monthlyFollowerCheck() {
  console.log('🔁 Avvio controllo mensile follower Twitch...');

  const guild = await client.guilds.fetch(GUILD_ID);
  await guild.members.fetch();

  const role = guild.roles.cache.find(r => r.name === MINECRAFTER_ROLE_NAME);
  if (!role) {
    console.error('❌ Ruolo Minecrafter non trovato');
    return;
  }

  const logChannel = await guild.channels.fetch(LOG_CHANNEL_ID).catch(() => null);

if (!logChannel) {
  console.error('❌ Canale log non trovato');
}


  const userTokens = fs.existsSync(USER_TOKENS_FILE)
    ? JSON.parse(fs.readFileSync(USER_TOKENS_FILE, 'utf8'))
    : {};

  for (const member of role.members.values()) {
    const discordId = member.id;
    const token = userTokens[discordId];

    try {
      if (!token) {
        await member.roles.remove(role);
        console.log(`❌ Token mancante → ruolo rimosso a ${member.user.tag}`);

        if (logChannel) {
  await logChannel.send(
    `❌ **Ruolo Minecrafter rimosso**\n` +
    `👤 Utente: **${member.user.tag}**\n` +
    `📺 Motivo: non segue più il canale Twitch **notigram**\n` +
    `-------------------------`
  );
}

        continue;
      }

      const twitchUserId = await getTwitchUserId(token);
      //NUOVE VARIABILI
      const appToken = await getAppAccessToken();
      const follower = await isFollower(twitchUserId, broadcasterId, appToken);
      //------

    //VARIABILE FUNZIONANTE
      //const follower = await isFollower(twitchUserId);
    //-----

      if (!follower) {
        await member.roles.remove(role);
        console.log(`❌ Non più follower → ruolo rimosso a ${member.user.tag}`);

        // DM opzionale
        try {
          await member.send(
            '⚠️ Non segui più il canale Twitch **notigram**.\n' +
            'Il ruolo **Minecrafter** ti è stato rimosso.\n' +
            'Segui di nuovo il canale e usa **!follower**.'
          );
        } catch {}
      } else {
        console.log(`✅ ${member.user.tag} è ancora follower`);
      }
    } catch (err) {
      console.error(`Errore controllo ${member.user.tag}`, err);
    }
  }

  console.log('✅ Controllo mensile completato');
}

cron.schedule('0 3 1 * *', () => {
  monthlyFollowerCheck();
});


// Comandi Discord
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const args = message.content.trim().split(/\s+/);
    const command = args[0].toLowerCase();

    // Comando !link
// Comando !link
if (command === '!link') {
    const oauthUrl = `https://discord-twitch-bot-production-490f.up.railway.app/auth?discord_id=${message.author.id}`;

    const embed = new EmbedBuilder()
        .setTitle('🎮 Collega il tuo account Twitch')
        .setDescription(
            'Clicca il pulsante qui sotto per collegare il tuo account Twitch.\n\n' +
            `Se segui il canale, riceverai automaticamente il ruolo **${ROLE_NAME}**.`
        )
        .setColor(0x9146FF) // Viola Twitch
        .setFooter({ text: 'Twitch Follower Bot' });

    const button = new ButtonBuilder()
        .setLabel('🔗 Collega Twitch')
        .setStyle(ButtonStyle.Link)
        .setURL(oauthUrl);

    const row = new ActionRowBuilder().addComponents(button);

    try {
        // DM all'utente
        await message.author.send({
            embeds: [embed],
            components: [row]
        });

        // Conferma nel canale
        await message.reply(
            `📩 ${message.author}, ti ho inviato un messaggio privato per collegare Twitch!`
        );

    } catch (err) {
        console.error(err);
        await message.reply(
            `❌ ${message.author}, non posso inviarti messaggi privati.\n` +
            `Prova ad abilitare i DM dal server e riprova.`
        );
    }
}

    // Comando !follower
    if (command === '!follower') {
        const freshTokens = fs.existsSync(USER_TOKENS_FILE)
    ? JSON.parse(fs.readFileSync(USER_TOKENS_FILE, 'utf8'))
    : {};

const token = freshTokens[message.author.id];

        if (!token) return message.reply('Non hai collegato il tuo account Twitch. Usa !link');

        try {
            const twitchUserId = await getTwitchUserId(token);
            if (!twitchUserId) return message.reply('Utente Twitch non trovato.');

            const follower = await isFollower(twitchUserId, token); // PASSIAMO IL TOKEN DELL’UTENTE

            if (follower) {
                const member = await message.guild.members.fetch(message.author.id);
                const role = message.guild.roles.cache.find(r => r.name === ROLE_NAME);
                if (role && !member.roles.cache.has(role.id)) {
                    await member.roles.add(role);
                }
                message.reply(`✅ ${message.author}, sei follower del canale e ti è stato assegnato il ruolo "${ROLE_NAME}"!`);
            } else {
                message.reply(`❌ ${message.author}, non segui il canale.`);
            }
        } catch (err) {
            console.error(err);
            message.reply(`Errore durante il controllo follower: ${err.message}`);
        }
    }
});

// Avvio bot
client.once('ready', async () => {
    console.log(`Bot pronto: ${client.user.tag}`);
    try {
        await initBroadcasterId();
        // 🔧 TEST MANUALE (rimuovi dopo)
        //await monthlyFollowerCheck();
    } catch (err) {
        console.error(`Errore inizializzazione Twitch: ${err.message}`);
    }
});

module.exports = { client, GUILD_ID, ROLE_NAME, isFollower, getTwitchUserId };

client.login(DISCORD_TOKEN);
