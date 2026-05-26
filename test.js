require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  Events,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ChannelType,
  PermissionsBitField,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require("discord.js");

/* ================= CLIENT ================= */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMembers
  ],
  partials: ["CHANNEL"]
});

/* ================= CONFIG ================= */

const SUPPORT_ROLE = "1503741695265869894";
const FEEDBACK_CHANNEL = "1489337816004563154";

const VAC_PANEL_CHANNEL = "1508120084022038568";
const VAC_ADMIN_CHANNEL = "1503381915124633610";

const tickets = new Map();

/* ================= READY ================= */

client.once(Events.ClientReady, () => {
  console.log(`🤖 Online als ${client.user.tag}`);
});

/* ================= COMMANDS ================= */

client.on(Events.MessageCreate, async (msg) => {
  if (msg.author.bot) return;

  const prefix = "!";
  if (!msg.content.startsWith(prefix)) return;

  const args = msg.content.slice(prefix.length).trim().split(/ +/);
  const cmd = args.shift()?.toLowerCase();

  if (cmd === "ticketpanel") ticketPanel(msg.channel);
  if (cmd === "urlaubpanel") vacationPanel(msg.channel);

  /* ================= REGELWERK ================= */

  if (msg.content === "!regeln") {

    const embed = new EmbedBuilder()
      .setTitle("📜 Regelwerk Übersicht")
      .setDescription("Wähle eine Kategorie aus dem Menü unten.")
      .setColor(0x3498db)
      .setImage("https://cdn.discordapp.com/attachments/1398233276203794432/1508424320223936553/E65801E0-03F0-47C6-8F89-47E1508D079D.png");

    const menu = new StringSelectMenuBuilder()
      .setCustomId("rules_menu")
      .setPlaceholder("📂 Kategorie auswählen")
      .addOptions([
        {
          label: "💬 Discord Regeln",
          value: "discord",
        },
        {
          label: "🎮 Ingame Regeln",
          value: "ingame",
        }
      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    return msg.channel.send({ embeds: [embed], components: [row] });
  }

  /* ================= TEAMLISTE (NUR HIER ERWEITERT) ================= */

  if (msg.content === "!teamliste") {

    const embed = new EmbedBuilder()
      .setTitle("🌴 MIAMI ROLEPLAY | TEAMLISTE")
      .setColor(0x9b59b6)
      .setThumbnail(msg.guild.iconURL({ dynamic: true }))
      .setImage("https://cdn.discordapp.com/attachments/1398233276203794432/1508424320223936553/E65801E0-03F0-47C6-8F89-47E1508D079D.png")
      .setDescription("```🌴 MIAMI ROLEPLAY TEAMÜBERSICHT```")
      .addFields(
        {
          name: "👑 OWNER",
          value: `<@&1503362766847737866>`,
          inline: false
        },
        {
          name: "💼 STV OWNER",
          value: `<@&1503363088580349973>`,
          inline: false
        },
        {
          name: "🤝 CO-OWNER",
          value: `<@&1503363370802221107>`,
          inline: false
        },
        {
          name: "📊 MANAGEMENT",
          value: `<@&1503375497021755533>`,
          inline: false
        },
        {
          name: "🧑‍💼 TEAMLEITER",
          value: `<@&1503375185074585741>`,
          inline: false
        },
        {
          name: "🛠️ ADMIN",
          value: `<@&1503375239801737297>`,
          inline: false
        },
        {
          name: "🧑‍💻 SUPPORTER",
          value: `<@&1503375299864428545>`,
          inline: false
        }
      )
      .setFooter({ text: "Miami Roleplay • Team System" });

    return msg.channel.send({ embeds: [embed] });
  }
});

/* ================= TICKET PANEL ================= */

async function ticketPanel(channel) {

  const embed = new EmbedBuilder()
    .setTitle("💜 MIAMI SUPPORT")
    .setDescription("📊 Ticket System")
    .setColor(0x9b59b6);

  const menu = new StringSelectMenuBuilder()
    .setCustomId("ticket_select")
    .setPlaceholder("Ticket auswählen")
    .addOptions([
      { label: "Support", value: "Support" },
      { label: "Bewerbung", value: "Bewerbung" },
      { label: "Bug Report", value: "Bug Report" },
      { label: "Sonstiges", value: "Sonstiges" }
    ]);

  channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)] });
}

/* ================= URLAUB PANEL ================= */

async function vacationPanel(channel) {

  const embed = new EmbedBuilder()
    .setTitle("🌴 MIAMI URLAUBSSYSTEM")
    .setDescription("👉 Urlaub beantragen klicken")
    .setColor(0x9b59b6);

  const btn = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("vac_open")
      .setLabel("Urlaub beantragen")
      .setStyle(ButtonStyle.Primary)
  );

  channel.send({ embeds: [embed], components: [btn] });
}

/* ================= INTERACTIONS ================= */

client.on(Events.InteractionCreate, async (i) => {
  try {

    if (i.isStringSelectMenu() && i.customId === "rules_menu") {

      const v = i.values[0];

      if (v === "discord") {
        return i.reply({
          embeds: [new EmbedBuilder().setTitle("Discord Regeln").setDescription("1. Respekt\n2. Kein Spam")],
          ephemeral: true
        });
      }

      if (v === "ingame") {
        return i.reply({
          embeds: [new EmbedBuilder().setTitle("Ingame Regeln").setDescription("1. Kein RDM\n2. Kein VDM")],
          ephemeral: true
        });
      }
    }

    if (i.isStringSelectMenu() && i.customId === "ticket_select") {

      const ch = await i.guild.channels.create({
        name: `ticket-${i.user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: i.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          { id: i.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
          { id: SUPPORT_ROLE, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
        ]
      });

      tickets.set(ch.id, i.user.id);

      const close = new ButtonBuilder()
        .setCustomId("close_ticket")
        .setLabel("Close")
        .setStyle(ButtonStyle.Danger);

      await ch.send({
        content: `<@${i.user.id}>`,
        components: [new ActionRowBuilder().addComponents(close)]
      });

      return i.reply({ content: "Ticket erstellt", ephemeral: true });
    }

    if (i.isButton() && i.customId === "close_ticket") {
      tickets.delete(i.channel.id);
      await i.reply({ content: "geschlossen", ephemeral: true });
      setTimeout(() => i.channel.delete().catch(() => {}), 2000);
    }

    if (i.isButton() && i.customId === "vac_open") {

      const modal = new ModalBuilder()
        .setCustomId("vac_form")
        .setTitle("Urlaub");

      const from = new TextInputBuilder().setCustomId("from").setLabel("Von").setStyle(TextInputStyle.Short);
      const to = new TextInputBuilder().setCustomId("to").setLabel("Bis").setStyle(TextInputStyle.Short);
      const reason = new TextInputBuilder().setCustomId("reason").setLabel("Grund").setStyle(TextInputStyle.Paragraph);

      modal.addComponents(
        new ActionRowBuilder().addComponents(from),
        new ActionRowBuilder().addComponents(to),
        new ActionRowBuilder().addComponents(reason)
      );

      return i.showModal(modal);
    }

    if (i.isModalSubmit() && i.customId === "vac_form") {

      const ch = await client.channels.fetch(VAC_ADMIN_CHANNEL);

      const embed = new EmbedBuilder()
        .setTitle("Urlaub Antrag")
        .addFields(
          { name: "User", value: i.user.tag },
          { name: "Von", value: i.fields.getTextInputValue("from") },
          { name: "Bis", value: i.fields.getTextInputValue("to") },
          { name: "Grund", value: i.fields.getTextInputValue("reason") }
        );

      await ch.send({ embeds: [embed] });

      return i.reply({ content: "gesendet", ephemeral: true });
    }

  } catch (err) {
    console.error(err);
  }
});

/* ================= LOGIN ================= */

client.login(process.env.DISCORD_TOKEN);