const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
  PermissionsBitField
} = require("discord.js");

let listenerRegistered = false;

module.exports = {
  name: "ticket",

  async execute(message) {

    const supportRole = "1503741695265869894";
    const logChannelId = "1508498102200307873";
    const reviewChannelId = "1504090675074044066";

    const panelChannelId = "1489337749587890338";

    // ================= PANEL =================
    const panel = new EmbedBuilder()
      .setTitle("🎫 MIAMI-SUPPORT")
      .setColor(0x8e44ad)
      .setImage("https://cdn.discordapp.com/attachments/1503380317732606073/1509467517897281566/file_00000000e89c71f48ac2f4c39c92dc73.png?ex=6a1948ac&is=6a17f72c&hm=a1f443114049db264903d957c7008a9e6d7af9a0722346013a289249542638cc&")
      .setDescription(
`📊 Auslastung: Normal

🎯 Bewerbung  
🛠️ Support  
🐛 Bugreport  
📦 Sonstiges`
      );

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("ticket_create")
        .setPlaceholder("🎫 Kategorie auswählen")
        .addOptions(
          { label: "Bewerbung", value: "bewerbung", emoji: "🎯" },
          { label: "Support", value: "support", emoji: "🛠️" },
          { label: "Bugreport", value: "bug", emoji: "🐛" },
          { label: "Sonstiges", value: "sonstiges", emoji: "📦" }
        )
    );

    // ================= SEND PANEL =================
    const panelChannel = await message.guild.channels
      .fetch(panelChannelId)
      .catch(() => null);

    if (panelChannel) {
      await panelChannel.send({
        embeds: [panel],
        components: [menu]
      });
    } else {
      console.log("❌ Panel Channel nicht gefunden oder keine Rechte!");
    }

    // ================= LISTENER =================
    if (!listenerRegistered) {

      listenerRegistered = true;

      message.client.on("interactionCreate", async (interaction) => {

        try {

          // CREATE TICKET
          if (interaction.isStringSelectMenu() && interaction.customId === "ticket_create") {

            const type = interaction.values[0];

            const channel = await interaction.guild.channels.create({
              name: `ticket-${interaction.user.id}`,
              type: ChannelType.GuildText,
              permissionOverwrites: [
                {
                  id: interaction.guild.id,
                  deny: [PermissionsBitField.Flags.ViewChannel]
                },
                {
                  id: interaction.user.id,
                  allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ReadMessageHistory
                  ]
                },
                {
                  id: supportRole,
                  allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ReadMessageHistory
                  ]
                }
              ]
            });

            const log = interaction.guild.channels.cache.get(logChannelId);
            if (log) log.send(`📩 Ticket | ${type} | <@${interaction.user.id}>`);

            await interaction.reply({
              content: `✅ Ticket erstellt: ${channel}`,
              ephemeral: true
            });

            if (type !== "bewerbung") {

              const embed = new EmbedBuilder()
                .setTitle("🎫 SUPPORT TICKET")
                .setColor(0xff0000)
                .setDescription(`Kategorie: **${type}**`);

              const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setCustomId("ticket_close")
                  .setLabel("🔒 Schließen")
                  .setStyle(ButtonStyle.Danger)
              );

              return channel.send({
                content: `<@&${supportRole}>`,
                embeds: [embed],
                components: [row]
              });
            }

            // ================= BEWERBUNG =================
            const questions = [
              "👤 Wie heißt du?",
              "🎂 Wie alt bist du?",
              "📍 Woher kommst du?",
              "🎮 Wie lange spielst du RP?",
              "💼 Hast du Erfahrung?",
              "🧠 Warum willst du auf den Server?",
              "⚖️ Stärken?",
              "📌 Warum dich?"
            ];

            let answers = [];
            let i = 0;

            await channel.send("📄 Bewerbung gestartet!");

            const ask = async () => {

              if (i >= questions.length) {

                const embed = new EmbedBuilder()
                  .setTitle("📄 NEUE BEWERBUNG")
                  .setColor(0x9b59b6)
                  .setDescription(
questions.map((q, index) =>
`**${q}**\n➡️ ${answers[index]}`
).join("\n\n")
                  );

                const review = interaction.guild.channels.cache.get(reviewChannelId);
                if (review) review.send({ embeds: [embed] });

                return channel.send("✅ Bewerbung abgeschlossen!");
              }

              await channel.send(`❓ ${questions[i]}`);

              const collector = channel.createMessageCollector({
                filter: m => m.author.id === interaction.user.id,
                max: 1,
                time: 600000
              });

              collector.on("collect", msg => {
                answers.push(msg.content);
                i++;
                ask();
              });
            };

            ask();
          }

          // CLOSE
          if (interaction.isButton() && interaction.customId === "ticket_close") {

            const modal = new ModalBuilder()
              .setCustomId("ticket_feedback")
              .setTitle("Ticket Bewertung");

            const stars = new TextInputBuilder()
              .setCustomId("stars")
              .setLabel("Sterne (0-5)")
              .setStyle(TextInputStyle.Short);

            const reason = new TextInputBuilder()
              .setCustomId("reason")
              .setLabel("Grund")
              .setStyle(TextInputStyle.Paragraph);

            modal.addComponents(
              new ActionRowBuilder().addComponents(stars),
              new ActionRowBuilder().addComponents(reason)
            );

            return interaction.showModal(modal);
          }

          // FEEDBACK
          if (interaction.isModalSubmit() && interaction.customId === "ticket_feedback") {

            const stars = interaction.fields.getTextInputValue("stars");
            const reason = interaction.fields.getTextInputValue("reason");

            const feedback = interaction.guild.channels.cache.get("1489337816004563154");

            if (feedback) {
              feedback.send({
                embeds: [
                  new EmbedBuilder()
                    .setTitle("🎫 TICKET BEWERTUNG")
                    .setColor(0x9b59b6)
                    .addFields(
                      { name: "👤 User", value: `<@${interaction.user.id}>`, inline: true },
                      { name: "⭐ Sterne", value: `${stars}/5`, inline: true },
                      { name: "📝 Grund", value: reason }
                    )
                    .setTimestamp()
                ]
              });
            }

            await interaction.reply({
              content: "✅ Ticket wird geschlossen...",
              ephemeral: true
            });

            setTimeout(() => {
              interaction.channel.delete().catch(() => {});
            }, 3000);
          }

        } catch (err) {
          console.log("Ticket Error:", err);
        }
      });
    }
  }
};