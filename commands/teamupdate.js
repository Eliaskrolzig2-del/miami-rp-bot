const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  Events
} = require("discord.js");

require("dotenv").config();

// ================= CONFIG =================
const TOKEN = process.env.TOKEN;

const PANEL_CHANNEL_ID = "1503480495453901032";

// ================= CLIENT =================
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ================= READY =================
client.once(Events.ClientReady, async () => {

  console.log(`✅ Online als ${client.user.tag}`);

  try {
    const channel = await client.channels.fetch(PANEL_CHANNEL_ID);

    if (!channel) return console.log("❌ Channel nicht gefunden");

    const embed = new EmbedBuilder()
      .setTitle("📢 TEAM UPDATE SYSTEM")
      .setColor(0x00ff00)
      .setDescription("Klicke unten um ein Team Update zu erstellen.");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("teamupdate_open")
        .setLabel("📢 Team Update erstellen")
        .setStyle(ButtonStyle.Primary)
    );

    await channel.send({
      embeds: [embed],
      components: [row]
    });

    console.log("📢 Panel gesendet");

  } catch (err) {
    console.log("READY ERROR:", err);
  }
});

// ================= INTERACTIONS =================
client.on(Events.InteractionCreate, async (interaction) => {

  try {

    // ================= BUTTON =================
    if (interaction.isButton() && interaction.customId === "teamupdate_open") {

      const modal = new ModalBuilder()
        .setCustomId("teamupdate_modal")
        .setTitle("📢 Team Update");

      const wer = new TextInputBuilder()
        .setCustomId("wer")
        .setLabel("Wer?")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const vonzu = new TextInputBuilder()
        .setCustomId("vonzu")
        .setLabel("Von → Zu")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const vonwem = new TextInputBuilder()
        .setCustomId("vonwem")
        .setLabel("Von wem?")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(wer),
        new ActionRowBuilder().addComponents(vonzu),
        new ActionRowBuilder().addComponents(vonwem)
      );

      return interaction.showModal(modal);
    }

    // ================= MODAL =================
    if (interaction.isModalSubmit() && interaction.customId === "teamupdate_modal") {

      const wer = interaction.fields.getTextInputValue("wer");
      const vonzu = interaction.fields.getTextInputValue("vonzu");
      const vonwem = interaction.fields.getTextInputValue("vonwem");

      const embed = new EmbedBuilder()
        .setTitle("📢 TEAM UPDATE")
        .setColor(0x00ff00)
        .addFields(
          { name: "👤 Wer", value: wer, inline: true },
          { name: "🔁 Von → Zu", value: vonzu, inline: true },
          { name: "👮 Von wem", value: vonwem, inline: true }
        )
        .setTimestamp();

      return interaction.reply({
        embeds: [embed]
      });
    }

  } catch (err) {
    console.log("Interaction Error:", err);
  }
});

// ================= LOGIN =================
client.login(TOKEN);