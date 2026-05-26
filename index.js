require("dotenv").config();
const fs = require("fs");

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  Partials,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events,
  PermissionsBitField
} = require("discord.js");

// =========================
// CLIENT
// =========================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.GuildMember]
});

// =========================
// IDS
// =========================
const JOIN_ROLE_ID = "1503365832842023005";
const VERIFIED_ROLE_ID = "1503365888793907372";

const VERIFY_CHANNEL_ID = "1489332015349235883";
const WELCOME_CHANNEL_ID = "1489331791159496795";
const LEAVE_CHANNEL_ID = "1489331930112462869";

// =========================
// COMMAND LOADER
// =========================
client.commands = new Map();

const commandFiles = fs
  .readdirSync("./commands")
  .filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);

  if (command.name && command.execute) {
    client.commands.set(command.name, command);
    console.log(`✔ geladen: ${command.name}`);
  }
}

// =========================
// READY
// =========================
client.once("ready", async () => {
  console.log(`🤖 Online als ${client.user.tag}`);

  try {
    const channel = await client.channels.fetch(VERIFY_CHANNEL_ID);
    if (!channel) return;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("verify_button")
        .setLabel("🔐 Verifizieren")
        .setStyle(ButtonStyle.Success)
    );

    const embed = new EmbedBuilder()
      .setTitle("🔐 Verifizierung")
      .setDescription("Klicke auf den Button um dich zu verifizieren.")
      .setColor(0x00ff00);

    await channel.send({
      embeds: [embed],
      components: [row]
    });

    console.log("✅ Verify Message gesendet");
  } catch (err) {
    console.log("READY ERROR:", err);
  }
});

// =========================
// JOIN SYSTEM
// =========================
client.on("guildMemberAdd", async (member) => {
  try {
    const role = member.guild.roles.cache.get(JOIN_ROLE_ID);
    if (role) await member.roles.add(role);

    const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setTitle("🟢 EINREISE")
      .setColor(0x00ff00)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setDescription(
        `👋 Willkommen ${member}\n\n👤 ${member.user.tag}\n👥 Member: ${member.guild.memberCount}`
      )
      .setTimestamp();

    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.log("JOIN ERROR:", err);
  }
});

// =========================
// LEAVE SYSTEM
// =========================
client.on("guildMemberRemove", async (member) => {
  try {
    const channel = member.guild.channels.cache.get(LEAVE_CHANNEL_ID);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setTitle("🔴 AUSREISE")
      .setColor(0xff0000)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setDescription(
        `👋 ${member.user.tag} hat den Server verlassen\n\n👥 Member jetzt: ${member.guild.memberCount}`
      )
      .setTimestamp();

    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.log("LEAVE ERROR:", err);
  }
});

// =========================
// VERIFY BUTTON
// =========================
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;
  if (interaction.customId !== "verify_button") return;

  try {
    await interaction.deferReply({ ephemeral: true });

    const role = interaction.guild.roles.cache.get(VERIFIED_ROLE_ID);

    if (!role) {
      return interaction.editReply({ content: "❌ Rolle nicht gefunden" });
    }

    if (interaction.member.roles.cache.has(VERIFIED_ROLE_ID)) {
      return interaction.editReply({ content: "✅ Bereits verifiziert." });
    }

    await interaction.member.roles.add(role);

    return interaction.editReply({ content: "✅ Erfolgreich verifiziert!" });
  } catch (err) {
    console.log("VERIFY ERROR:", err);
  }
});

// =========================
// ANTI SPAM SYSTEM (STABIL)
// =========================
const userMessages = new Map();
const punishments = new Map();

// Memory cleanup (WICHTIG für Hosting)
setInterval(() => {
  userMessages.clear();
}, 60 * 60 * 1000);

setInterval(() => {
  punishments.clear();
}, 24 * 60 * 60 * 1000);

client.on("messageCreate", async (message) => {
  try {
    if (!message.guild) return;
    if (message.author.bot) return;

    // FIX: Permission check sicher
    if (
      message.member.permissions.has(
        PermissionsBitField.Flags.Administrator
      )
    )
      return;

    const userId = message.author.id;
    const now = Date.now();

    if (!userMessages.has(userId)) {
      userMessages.set(userId, []);
    }

    let messages = userMessages.get(userId);

    messages.push(now);

    messages = messages.filter((t) => now - t < 10000);

    userMessages.set(userId, messages);

    if (messages.length < 3) return;

    userMessages.set(userId, []);

    let level = punishments.get(userId) || 0;
    level++;
    punishments.set(userId, level);

    // WARNUNG
    if (level === 1) {
      return message.channel.send(
        `⚠️ ${message.author} hör auf zu spammen!`
      );
    }

    // SAFE TIMEOUT CHECK
    if (!message.member.moderatable) return;

    if (level === 2) {
      await message.member.timeout(60 * 1000, "Spam");
      return message.channel.send(
        `⏰ ${message.author} hat 60 Sekunden Timeout bekommen`
      );
    }

    if (level === 3) {
      await message.member.timeout(5 * 60 * 1000, "Spam");
      return message.channel.send(
        `🔇 ${message.author} hat 5 Minuten Timeout bekommen`
      );
    }

    await message.member.timeout(10 * 60 * 1000, "Spam");

    return message.channel.send(
      `🚨 ${message.author} hat 10 Minuten Timeout bekommen`
    );
  } catch (err) {
    console.log("SPAM ERROR:", err);
  }
});

// =========================
// COMMAND SYSTEM
// =========================
client.on("messageCreate", async (message) => {
  try {
    if (!message.guild) return;
    if (message.author.bot) return;
    if (!message.content.startsWith("!")) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const cmdName = args.shift().toLowerCase();

    const command = client.commands.get(cmdName);
    if (!command) return;

    await command.execute(message, args, client);
  } catch (err) {
    console.log("COMMAND ERROR:", err);
  }
});

// =========================
// SYSTEMS
// =========================
require("./geo.js")(client);
require("./notruf.js")(client);

// =========================
// CRASH PROTECTION
// =========================
process.on("unhandledRejection", console.log);
process.on("uncaughtException", console.log);

client.on("error", console.error);

// =========================
// LOGIN
// =========================
client.login(process.env.DISCORD_TOKEN);