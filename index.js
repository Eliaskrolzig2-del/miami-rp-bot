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
  NoSubscriberBehavior,
  entersState,
  VoiceConnectionStatus
} = require("@discordjs/voice");

const gtts = require("gtts");
const path = require("path");

/* ================= RENDER SAFETY ================= */
if (global.__MIAMI_BOT__) {
  console.log("⚠️ Bot already running (duplicate prevented)");
} else {
  global.__MIAMI_BOT__ = true;
}

/* ================= CHECK TOKEN ================= */
if (!process.env.DISCORD_TOKEN) {
  console.error("❌ DISCORD_TOKEN fehlt in .env");
  process.exit(1);
}

/* ================= EXPRESS ================= */
const app = express();

app.get("/", (_, res) => res.send("Bot läuft"));

app.listen(process.env.PORT || 3000, () => {
  console.log("🌐 Webserver läuft");
});

/* ================= CLIENT ================= */
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

/* ================= ERROR HANDLING ================= */
process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

/* ================= IDS ================= */
const VERIFY_CHANNEL = "1489332015349235883";
const JOIN_ROLE = "1503365832842023005";
const VERIFIED_ROLE = "1503365888793907372";

const WAITING_ROOM = "1489337872879321281";
const LOG_CHANNEL = "1508498102200307873";

const EINREISE_CHANNEL = "1489331791159496795";
const AUSREISE_CHANNEL = "1489331930112462869";

/* ================= COMMANDS ================= */
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
  console.log("❌ Command Fehler:", err);
}

/* ================= READY ================= */
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

/* ================= VERIFY ================= */
client.on("interactionCreate", async (i) => {
  if (!i.isButton()) return;

  if (i.customId === "verify") {
    const role = i.guild.roles.cache.get(VERIFIED_ROLE);

    if (!role) return i.reply({ content: "❌ Rolle nicht gefunden", ephemeral: true });

    await i.member.roles.add(role);
    return i.reply({ content: "✅ Du wurdest verifiziert", ephemeral: true });
  }
});

/* ================= CACHE FIX ================= */
const joinCache = new Map();
const leaveCache = new Map();

/* ================= JOIN / LEAVE / EIN-AUSREISE ================= */
client.on("guildMemberAdd", async (member) => {

  if (joinCache.has(member.id)) return;
  joinCache.set(member.id, Date.now());
  setTimeout(() => joinCache.delete(member.id), 10000);

  member.roles.add(JOIN_ROLE).catch(() => {});

  client.channels.cache.get(EINREISE_CHANNEL)?.send({
    embeds: [
      new EmbedBuilder()
        .setTitle("🛬 Einreise")
        .setDescription(`${member.user.tag} ist eingereist`)
        .setColor(0x00ff00)
        .setTimestamp()
    ]
  });

  client.channels.cache.get(LOG_CHANNEL)?.send(`🟢 ${member.user.tag} gejoint`);
});

client.on("guildMemberRemove", async (member) => {

  if (leaveCache.has(member.id)) return;
  leaveCache.set(member.id, Date.now());
  setTimeout(() => leaveCache.delete(member.id), 10000);

  client.channels.cache.get(AUSREISE_CHANNEL)?.send({
    embeds: [
      new EmbedBuilder()
        .setTitle("🛫 Ausreise")
        .setDescription(`${member.user.tag} hat verlassen`)
        .setColor(0xff0000)
        .setTimestamp()
    ]
  });

  client.channels.cache.get(LOG_CHANNEL)?.send(`🔴 ${member.user.tag} left`);
});

/* ================= SPAM SYSTEM ================= */
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
    return msg.channel.send(`⏰ ${msg.author} Timeout wegen Spam`);
  }
});

/* ================= VOICE SYSTEM (SAFE) ================= */
let connection = null;
let musicPlayer = null;
let connecting = false;

client.on("voiceStateUpdate", async (oldState, newState) => {

  try {

    const joined =
      newState.channelId === WAITING_ROOM &&
      oldState.channelId !== WAITING_ROOM;

    const left =
      oldState.channelId === WAITING_ROOM &&
      newState.channelId !== WAITING_ROOM;

    if (joined) {

      const member = newState.member;
      if (!member) return;

      const log = client.channels.cache.get(LOG_CHANNEL);
      log?.send(`🎧 ${member} im Warteraum`);

      if (!connection && !connecting) {

        connecting = true;

        connection = joinVoiceChannel({
          channelId: newState.channel.id,
          guildId: newState.guild.id,
          adapterCreator: newState.guild.voiceAdapterCreator,
          selfDeaf: false
        });

        await entersState(connection, VoiceConnectionStatus.Ready, 15000)
          .catch(() => null);

        connecting = false;

        const music = createAudioResource(
          path.join(__dirname, "musik.mp3"),
          { inlineVolume: true }
        );

        music.volume.setVolume(0.15);

        musicPlayer = createAudioPlayer({
          behaviors: { noSubscriber: NoSubscriberBehavior.Play }
        });

        musicPlayer.play(music);
        connection.subscribe(musicPlayer);
      }
    }

    if (left) {

      const channel = oldState.channel;
      if (!channel) return;

      const humans = channel.members.filter(m => !m.user.bot);

      if (humans.size === 0 && connection) {
        connection.destroy();
        connection = null;
        musicPlayer = null;
      }
    }

  } catch (err) {
    console.log("VOICE ERROR:", err);
  }
});

/* ================= COMMAND HANDLER ================= */
client.on("messageCreate", async (msg) => {

  if (!msg.guild || msg.author.bot) return;
  if (!msg.content.startsWith("!")) return;

  const args = msg.content.slice(1).trim().split(/ +/);
  const cmdName = args.shift().toLowerCase();

  if (cmdName === "commands") {
    const list = [...client.commands.keys()].map(c => `\`${c}\``).join(", ");

    return msg.channel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("📜 Commands")
          .setDescription(list || "Keine Commands")
          .setColor(0x00ff00)
      ]
    });
  }

  const command = client.commands.get(cmdName);
  if (!command) return;

  try {
    await command.execute(msg, args, client);
  } catch (err) {
    console.log(err);
    msg.channel.send("❌ Fehler beim Command");
  }
});

/* ================= EXTERNAL SYSTEMS ================= */
require("./geo.js")(client);
require("./notruf.js")(client);

/* ================= LOGIN ================= */
client.login(process.env.DISCORD_TOKEN);