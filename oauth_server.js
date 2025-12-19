const { client, GUILD_ID, ROLE_NAME, isFollower, getTwitchUserId } = require('./bot');

//require('dotenv').config({ path: './info.env' });
const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = 'https://discord-twitch-bot-production-490f.up.railway.app/auth/callback';
const USER_TOKENS_FILE = './user_tokens.json';

// Carica token esistenti
let userTokens = {};
if (fs.existsSync(USER_TOKENS_FILE)) {
    userTokens = JSON.parse(fs.readFileSync(USER_TOKENS_FILE, 'utf8'));
}

// Endpoint per generare link OAuth
app.get('/auth', (req, res) => {
    const discordId = req.query.discord_id;
    if (!discordId) return res.send('Discord ID mancante');

    // Controlla se l’utente ha già un token
    if (userTokens[discordId]) {
        return res.send(`
<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<title>Account già collegato</title>
<style>
body { font-family: Arial; background:#0e0e10; color:white; display:flex; justify-content:center; align-items:center; height:100vh; margin:0; }
.card { background:#18181b; padding:30px; border-radius:12px; text-align:center; max-width:400px; box-shadow:0 0 30px rgba(0,0,0,0.5); }
h1 { color:#9146FF; margin-bottom:10px; }
p { opacity:0.9; }
img.logo { width:60px; margin-bottom:15px; }
button { padding:12px 20px; background:#9146FF; border:none; border-radius:8px; color:white; font-size:14px; cursor:pointer; margin-top:15px; }
button:hover { background:#772ce8; }
</style>
</head>
<body>
<div class="card">
<img class="logo" src="https://cdn.brandfetch.io/idIwZCwD2f/theme/dark/symbol.svg?c=1bxid64Mup7aczewSAYMX&t=1668070397594" alt="Twitch Logo">
<h1>🔗 Account già collegato</h1>
<p>Hai già collegato il tuo account Twitch.</p>
<p>Se vuoi aggiornare o sostituire l’account, contatta un admin.</p>
<button onclick="window.close()">Chiudi</button>
</div>
</body>
</html>
        `);
    }

    const url =
      `https://id.twitch.tv/oauth2/authorize` +
      `?response_type=code` +
      `&client_id=${CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&scope=user:read:follows` +
      `&force_verify=true` +
      `&state=${discordId}`;

    // Pagina di collegamento per chi non ha ancora token
    res.send(`
<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<title>Collega Twitch</title>
<style>
body { font-family: Arial, sans-serif; background: #0e0e10; color: white; display:flex; justify-content:center; align-items:center; height:100vh; margin:0; }
.card { background: #18181b; padding: 30px; border-radius: 12px; text-align:center; max-width:400px; box-shadow:0 0 30px rgba(0,0,0,0.5); }
h1 { color: #9146FF; margin-bottom: 10px; }
p { opacity: 0.9; margin-bottom: 25px; }
a.button { display:inline-block; padding:14px 24px; background:#9146FF; color:white; text-decoration:none; border-radius:8px; font-size:16px; font-weight:bold; transition:background 0.2s ease; }
a.button:hover { background:#772ce8; }
img.logo { width:60px; margin-bottom:15px; }
</style>
</head>
<body>
<div class="card">
<img class="logo" src="https://cdn.brandfetch.io/idIwZCwD2f/theme/dark/symbol.svg?c=1bxid64Mup7aczewSAYMX&t=1668070397594" alt="Twitch Logo">
<h1>🔗 Collega Twitch</h1>
<p>Per verificare se segui il canale, devi autorizzare l’accesso al tuo account Twitch.</p>
<a class="button" href="${url}">Collega il mio account Twitch</a>
</div>
</body>
</html>
    `);
});

// Callback Twitch dopo autorizzazione
app.get('/auth/callback', async (req, res) => {
    const code = req.query.code;
    const state = req.query.state; // Discord ID
    if (!code || !state) return res.send('Codice o stato mancante');

    try {
        // Scambio codice con token
        const tokenRes = await fetch(
            `https://id.twitch.tv/oauth2/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&code=${code}&grant_type=authorization_code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`,
            { method: 'POST' }
        );
        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) return res.send(`Errore ottenimento token: ${JSON.stringify(tokenData)}`);

        // Salva token utente associato al Discord ID
        userTokens[state] = tokenData.access_token;
        fs.writeFileSync(USER_TOKENS_FILE, JSON.stringify(userTokens, null, 2));

// Controllo follower automatico
try {
    const guild = await client.guilds.fetch(GUILD_ID);
    await guild.members.fetch();
    const member = await guild.members.fetch(state);

    const twitchUserId = await getTwitchUserId(tokenData.access_token);
    const follower = await isFollower(twitchUserId, tokenData.access_token);

    const role = guild.roles.cache.find(r => r.name === ROLE_NAME);

    if (follower && role && !member.roles.cache.has(role.id)) {
        await member.roles.add(role);
        await member.send(`✅ Sei follower del canale Twitch e ti è stato assegnato il ruolo **${ROLE_NAME}**!`);
    } else if (!follower) {
        await member.send(`❌ Non segui ancora il canale Twitch. Seguilo e poi usa il comando **!follower** se necessario.`);
    }
} catch (err) {
    console.error(`Errore controllo follower automatico per ${state}`, err);
}


        // Pagina di conferma
        res.send(`
<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<title>Autorizzazione completata</title>
<style>
body { font-family: Arial, sans-serif; background:#0e0e10; color:white; display:flex; justify-content:center; align-items:center; height:100vh; margin:0; }
.card { background:#18181b; padding:30px; border-radius:12px; text-align:center; max-width:400px; box-shadow:0 0 30px rgba(0,0,0,0.5); }
h1 { color:#00ff9c; margin-bottom:15px; }
p { opacity:0.9; margin-bottom:10px; }
button { padding:12px 20px; background:#9146FF; border:none; border-radius:8px; color:white; font-size:14px; cursor:pointer; margin-top:15px; }
button:hover { background:#772ce8; }
img.logo { width:60px; margin-bottom:15px; }
</style>
</head>
<body>
<div class="card">
<img class="logo" src="https://cdn.brandfetch.io/idIwZCwD2f/theme/dark/symbol.svg?c=1bxid64Mup7aczewSAYMX&t=1668070397594" alt="Twitch Logo">
<h1>✅ Autorizzazione completata!</h1>
<p>Il tuo account Twitch è stato collegato con successo.</p>
<p>Il ruolo <strong>Minecrafter</strong> ti è stato assegnato sul Discord di <strong>NotiGram</strong>.</p>
<p>Ora puoi chiudere questa finestra e leggere le istruzioni per accedere al server minecraft in <strong>Informazioni utili</strong> su Discord.</p>
<button onclick="window.close()">Chiudi</button>
</div>
</body>
</html>
        `);

        console.log(`Nuovo token salvato per Discord ID: ${state}`);
    } catch (err) {
        console.error(err);
        res.send('Errore durante la generazione del token');
    }
});

app.listen(PORT, () => {
    console.log(`Server OAuth Twitch attivo su ${REDIRECT_URI}:${PORT}`);
});