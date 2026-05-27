require("dotenv").config();
const fs = require("fs");
const express = require("express");

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Partials,
  Events
} = require("discord.js");

const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  NoSubscriberBehavior
} = require("@discordjs/voice");

const gtts = require("gtts");
const path = require("path");

// ================= CHECK TOKEN =================
if (!process.env.DISCORD_TOKEN) {
  console.error("❌ DISCORD_TOKEN fehlt in .env");
  process.exit(1);
}

// ================= EXPRESS =================
const app = express();

app.get("/", (_, res) => {
  res.send("Bot läuft");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("🌐 Webserver läuft");
});

// ================= CLIENT =================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.GuildMember]
});

// ================= GLOBAL ERROR =================
process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

// ================= IDS =================
const VERIFY_CHANNEL = "1489332015349235883";
const JOIN_ROLE = "1503365832842023005";
const VERIFIED_ROLE = "1503365888793907372";

const WAITING_ROOM = "1489337872879321281";
const LOG_CHANNEL = "1508498102200307873";

const EINREISE_CHANNEL = "1489331791159496795";
const AUSREISE_CHANNEL = "1489331930112462869";

// ================= COMMANDS =================
client.commands = new Map();

try {
  fs.readdirSync("./commands")
    .filter(f => f.endsWith(".js"))
    .forEach(file => {
      const cmd = require(`./commands/${file}`);
      if (cmd.name && cmd.execute) {
        client.commands.set(cmd.name.toLowerCase(), cmd);
        console.log(`✅ Command geladen: ${cmd.name}`);
      }
    });
} catch (err) {
  console.log("❌ Fehler beim Laden der Commands:", err);
}

// ================= READY =================
client.once(Events.ClientReady, async () => {

  console.log(`🤖 Online als ${client.user.tag}`);

  const ch = await client.channels.fetch(VERIFY_CHANNEL).catch(() => null);

  if (ch) {

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("verify")
        .setLabel("🔐 Verifizieren")
        .setStyle(ButtonStyle.Success)
    );

    const embed = new EmbedBuilder()
      .setTitle("🔐 Verifizierung")
      .setDescription("Klicke auf den Button um dich zu verifizieren")
      .setColor(0x00ff00);

    ch.send({ embeds: [embed], components: [row] });
  }
});

// ================= VERIFY =================
client.on("interactionCreate", async (i) => {
  if (!i.isButton()) return;

  if (i.customId === "verify") {

    const role = i.guild.roles.cache.get(VERIFIED_ROLE);

    if (!role) {
      return i.reply({
        content: "❌ Rolle nicht gefunden",
        ephemeral: true
      });
    }

    await i.member.roles.add(role);

    return i.reply({
      content: "✅ Du wurdest verifiziert",
      ephemeral: true
    });
  }
});

// ================= JOIN ROLE =================
client.on("guildMemberAdd", async (member) => {
  member.roles.add(JOIN_ROLE).catch(() => {});
});

// ================= 🔧 ONLY FIX: EIN-/AUSREISE DUPLICATE PROTECTION =================
const joinCache = new Set();
const leaveCache = new Set();

client.on("guildMemberAdd", async (member) => {

  if (joinCache.has(member.id)) return;
  joinCache.add(member.id);
  setTimeout(() => joinCache.delete(member.id), 10000);

  const channel = client.channels.cache.get(EINREISE_CHANNEL);
  if (!channel) return;

  channel.send({
    embeds: [
      new EmbedBuilder()
        .setTitle("🛬 Einreise")
        .setDescription(`${member.user.tag} ist eingereist`)
        .setColor(0x00ff00)
        .setTimestamp()
    ]
  }).catch(() => {});
});

client.on("guildMemberRemove", async (member) => {

  if (leaveCache.has(member.id)) return;
  leaveCache.add(member.id);
  setTimeout(() => leaveCache.delete(member.id), 10000);

  const channel = client.channels.cache.get(AUSREISE_CHANNEL);
  if (!channel) return;

  channel.send({
    embeds: [
      new EmbedBuilder()
        .setTitle("🛫 Ausreise")
        .setDescription(`${member.user.tag} hat verlassen`)
        .setColor(0xff0000)
        .setTimestamp()
    ]
  }).catch(() => {});
});

// ================= SPAM SYSTEM =================
const spamMap = new Map();
const punish = new Map();

client.on("messageCreate", async (msg) => {

  if (!msg.guild || msg.author.bot) return;

  const id = msg.author.id;
  const now = Date.now();

  if (!spamMap.has(id)) spamMap.set(id, []);

  spamMap.get(id).push(now);

  const recent = spamMap.get(id).filter(t => now - t < 10000);
  spamMap.set(id, recent);

  if (recent.length < 3) return;

  spamMap.set(id, []);

  let level = punish.get(id) || 0;
  level++;
  punish.set(id, level);

  if (level === 1) {
    return msg.channel.send(`⚠️ ${msg.author} Bitte nicht spammen`);
  }

  if (!msg.member.moderatable) return;

  if (level >= 2) {
    await msg.member.timeout(5 * 60_000, "Spam");
    return msg.channel.send(`⏰ ${msg.author} hat 5 Minuten Timeout wegen Spam bekommen`);
  }
});

// ================= VOICE SYSTEM =================
client.on("voiceStateUpdate", async (oldState, newState) => {

  try {

    if (newState.channelId !== WAITING_ROOM) return;
    if (oldState.channelId === WAITING_ROOM) return;

    const member = newState.member;

    const log = client.channels.cache.get(LOG_CHANNEL);
    log?.send(`🎧 ${member} ist im Warteraum`);

    const connection = joinVoiceChannel({
      channelId: newState.channel.id,
      guildId: newState.guild.id,
      adapterCreator: newState.guild.voiceAdapterCreator,
      selfDeaf: false
    });

    const music = createAudioResource(
      path.join(__dirname, "musik.mp3"),
      { inlineVolume: true }
    );

    music.volume.setVolume(0.15);

    const player = createAudioPlayer({
      behaviors: { noSubscriber: NoSubscriberBehavior.Play }
    });

    player.play(music);
    connection.subscribe(player);

    const file = path.join(__dirname, "tts.mp3");

    const tts = new gtts(
      "Willkommen im Miami Roleplay Support. Bitte warten.",
      "de"
    );

    tts.save(file, () => {

      setTimeout(() => {

        const speech = createAudioResource(file);
        const speechPlayer = createAudioPlayer();

        speechPlayer.play(speech);
        connection.subscribe(speechPlayer);

      }, 2000);

    });

  } catch (err) {
    console.log("VOICE ERROR:", err);
  }
});

// ================= COMMAND HANDLER =================
client.on("messageCreate", async (msg) => {

  if (!msg.guild || msg.author.bot) return;
  if (!msg.content.startsWith("!")) return;

  const args = msg.content.slice(1).trim().split(/ +/);
  const cmdName = args.shift().toLowerCase();

  if (cmdName === "commands") {

    const list = [...client.commands.keys()]
      .map(c => `\`${c}\``)
      .join(", ");

    const embed = new EmbedBuilder()
      .setTitle("📜 Commands")
      .setDescription(list || "Keine Commands gefunden")
      .setColor(0x00ff00);

    return msg.channel.send({ embeds: [embed] });
  }

  const command = client.commands.get(cmdName);
  if (!command) return;

  try {
    await command.execute(msg, args, client);
  } catch (err) {
    console.log(`❌ Fehler bei Command ${cmdName}:`, err);
    msg.channel.send("❌ Fehler beim Ausführen des Commands");
  }
});

// ================= LOG SYSTEM =================
client.on("guildMemberAdd", async (member) => {

  const channel = client.channels.cache.get(LOG_CHANNEL);
  if (!channel) return;

  channel.send({
    embeds: [
      new EmbedBuilder()
        .setTitle("🟢 Mitglied gejoint")
        .setColor(0x00ff00)
        .setDescription(`${member.user.tag} ist dem Server beigetreten`)
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp()
    ]
  });
});

client.on("guildMemberRemove", async (member) => {

  const channel = client.channels.cache.get(LOG_CHANNEL);
  if (!channel) return;

  channel.send({
    embeds: [
      new EmbedBuilder()
        .setTitle("🔴 Mitglied verlassen")
        .setColor(0xff0000)
        .setDescription(`${member.user.tag} hat den Server verlassen`)
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp()
    ]
  });
});

// ================= EXTERNAL SYSTEMS =================
require("./geo.js")(client);
require("./notruf.js")(client);

// ================= LOGIN =================
client.login(process.env.DISCORD_TOKEN);