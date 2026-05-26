const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionsBitField
} = require("discord.js");

// 📌 Speicher (RAM)
let urlaube = [];

module.exports = {
  name: "urlaub",

  async execute(message) {

    const image =
      "https://cdn.discordapp.com/attachments/150841948615003756";

    const reviewChannelId = "1503381915124633610";

    // ================= PANEL =================
    const embed = new EmbedBuilder()
      .setTitle("🌴 MIAMI URLAUB - BEANTRAGEN")
      .setColor(0x9b59b6)
      .setImage(image)
      .setDescription(
`📌 Hier kannst du Urlaub beantragen

👉 Klicke auf den Button unten  
👉 Fülle Zeitraum + Grund aus  
👉 Team entscheidet über deinen Antrag`
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("urlaub_create")
        .setLabel("🏖️ Urlaub beantragen")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("urlaub_list")
        .setLabel("📋 Alle Urlaube")
        .setStyle(ButtonStyle.Primary)
    );

    await message.channel.send({
      embeds: [embed],
      components: [row]
    });

    // ================= INTERACTIONS =================
    message.client.on("interactionCreate", async (interaction) => {

      // =====================================================
      // 🏖️ URLAUB BEANTRAGEN
      // =====================================================
      if (interaction.isButton() && interaction.customId === "urlaub_create") {

        const modal = new ModalBuilder()
          .setCustomId("urlaub_modal")
          .setTitle("🏖️ Urlaub beantragen");

        const von = new TextInputBuilder()
          .setCustomId("von")
          .setLabel("Von (Datum)")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const bis = new TextInputBuilder()
          .setCustomId("bis")
          .setLabel("Bis (Datum)")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const grund = new TextInputBuilder()
          .setCustomId("grund")
          .setLabel("Grund")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true);

        modal.addComponents(
          new ActionRowBuilder().addComponents(von),
          new ActionRowBuilder().addComponents(bis),
          new ActionRowBuilder().addComponents(grund)
        );

        return interaction.showModal(modal);
      }

      // =====================================================
      // 💾 URLAUB SPEICHERN + SENDEN AN REVIEW
      // =====================================================
      if (interaction.isModalSubmit() && interaction.customId === "urlaub_modal") {

        const von = interaction.fields.getTextInputValue("von");
        const bis = interaction.fields.getTextInputValue("bis");
        const grund = interaction.fields.getTextInputValue("grund");

        const id = Date.now();

        urlaube.push({
          id,
          userId: interaction.user.id,
          von,
          bis,
          grund,
          status: "pending"
        });

        const reviewChannel = interaction.guild.channels.cache.get(reviewChannelId);

        if (reviewChannel) {

          const embedReview = new EmbedBuilder()
            .setTitle("🏖️ NEUER URLAUBSANTRAG")
            .setColor(0xffcc00)
            .setDescription(
`👤 User: <@${interaction.user.id}>
📅 Von: ${von}
📅 Bis: ${bis}
📝 Grund: ${grund}
🆔 ID: ${id}`
            );

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`urlaub_accept_${id}`)
              .setLabel("✅ Annehmen")
              .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
              .setCustomId(`urlaub_decline_${id}`)
              .setLabel("❌ Ablehnen")
              .setStyle(ButtonStyle.Danger)
          );

          reviewChannel.send({
            embeds: [embedReview],
            components: [row]
          });
        }

        return interaction.reply({
          content: "✅ Urlaub wurde eingereicht!",
          ephemeral: true
        });
      }

      // =====================================================
      // 📋 LISTE
      // =====================================================
      if (interaction.isButton() && interaction.customId === "urlaub_list") {

        if (urlaube.length === 0) {
          return interaction.reply({
            content: "❌ Keine Urlaube vorhanden.",
            ephemeral: true
          });
        }

        const list = urlaube.map(u =>
`👤 <@${u.userId}>
📅 ${u.von} - ${u.bis}
📝 ${u.grund}
📌 Status: ${u.status}`
        ).join("\n\n");

        const embedList = new EmbedBuilder()
          .setTitle("📋 ALLE URLAUBE")
          .setColor(0x3498db)
          .setDescription(list);

        return interaction.reply({
          embeds: [embedList],
          ephemeral: true
        });
      }

      // =====================================================
      // ✅ ANNEHMEN
      // =====================================================
      if (interaction.isButton() && interaction.customId.startsWith("urlaub_accept_")) {

        const id = interaction.customId.split("_")[2];
        const urlaub = urlaube.find(u => u.id == id);

        if (!urlaub) return;

        urlaub.status = "approved";

        const user = await interaction.guild.members.fetch(urlaub.userId);

        if (user) {
          user.send("✅ Dein Urlaub wurde ANGENOMMEN!");
        }

        return interaction.update({
          content: "✅ Urlaub angenommen",
          components: []
        });
      }

      // =====================================================
      // ❌ ABLEHNEN
      // =====================================================
      if (interaction.isButton() && interaction.customId.startsWith("urlaub_decline_")) {

        const id = interaction.customId.split("_")[2];
        const urlaub = urlaube.find(u => u.id == id);

        if (!urlaub) return;

        const reason = prompt("Grund eingeben (nur Test - später Modal)") || "Kein Grund";

        urlaub.status = "declined";

        const user = await interaction.guild.members.fetch(urlaub.userId);

        if (user) {
          user.send(`❌ Dein Urlaub wurde ABGELEHNT.\nGrund: ${reason}`);
        }

        return interaction.update({
          content: "❌ Urlaub abgelehnt",
          components: []
        });
      }
    });
  }
};