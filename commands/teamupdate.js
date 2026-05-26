const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder
} = require("discord.js");

const CHANNEL_ID = "1503480495453901032";

let registered = false;

module.exports = {
  name: "teamupdate",

  async execute(message, args, client) {

    const channel = client.channels.cache.get(CHANNEL_ID);
    if (!channel) return message.reply("❌ Channel nicht gefunden.");

    // =========================
    // PANEL SENDEN (IMMER FIXER CHANNEL)
    // =========================
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("teamupdate_open")
        .setLabel("📢 Team Update erstellen")
        .setStyle(ButtonStyle.Primary)
    );

    await channel.send({
      content: "📢 Team Update System:",
      components: [row]
    });

    message.reply("✅ Panel wurde im Team-Channel gesendet.");

    // =========================
    // EVENT NUR 1X
    // =========================
    if (registered) return;
    registered = true;

    client.on("interactionCreate", async (interaction) => {

      try {

        // BUTTON
        if (interaction.isButton()) {

          if (interaction.customId === "teamupdate_open") {

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
              .setLabel("Von → Zu Rank")
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

            await interaction.showModal(modal);
          }
        }

        // MODAL
        if (interaction.isModalSubmit()) {

          if (interaction.customId === "teamupdate_modal") {

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
              .setDescription("```┌───────────────┐\n│ TEAM UPDATE │\n└───────────────┘```")
              .setTimestamp();

            await interaction.reply({
              embeds: [embed]
            });
          }
        }

      } catch (err) {
        console.log(err);
      }
    });
  }
};