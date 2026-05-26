const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require("discord.js");

const CHANNEL_ID = "1503380652777803838";

let events = [];
let panelSent = false;
let listenerRegistered = false;

// =========================
// EXPORT (OPTIONAL COMMAND SAFE)
// =========================
module.exports = {
  name: "kalender",
  execute: async () => {}
};

// =========================
// AUTO START PANEL (KEIN COMMAND)
// =========================
module.exports.start = (client) => {

  client.once("clientReady", async () => {

    if (panelSent) return;

    try {

      const channel = await client.channels.fetch(CHANNEL_ID);
      if (!channel) return console.log("❌ Kalender Channel nicht gefunden");

      panelSent = true;

      const embed = new EmbedBuilder()
        .setTitle("📅 MIAMI KALENDER")
        .setColor(0x8e44ad)
        .setDescription(
`📌 Community Kalender System

➕ Termin erstellen (für alle)  
📋 Termine anzeigen  

⚠️ Aktiv für ganze Community`
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("cal_add")
          .setLabel("➕ Termin erstellen")
          .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
          .setCustomId("cal_list")
          .setLabel("📋 Termine anzeigen")
          .setStyle(ButtonStyle.Primary)
      );

      await channel.send({
        embeds: [embed],
        components: [row]
      });

      console.log("📅 Kalender AUTO START aktiv");

    } catch (err) {
      console.log("Kalender Start Error:", err);
    }
  });
};

// =========================
// INTERACTIONS (NUR EINMAL)
// =========================
module.exports.interactions = (client) => {

  if (listenerRegistered) return;
  listenerRegistered = true;

  client.on("interactionCreate", async (interaction) => {

    try {

      // =========================
      // ➕ TERMIN ERSTELLEN
      // =========================
      if (interaction.isButton() && interaction.customId === "cal_add") {

        const modal = new ModalBuilder()
          .setCustomId("cal_create")
          .setTitle("📅 Termin erstellen");

        const title = new TextInputBuilder()
          .setCustomId("title")
          .setLabel("Titel")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const date = new TextInputBuilder()
          .setCustomId("date")
          .setLabel("Datum & Uhrzeit")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const desc = new TextInputBuilder()
          .setCustomId("desc")
          .setLabel("Beschreibung")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true);

        modal.addComponents(
          new ActionRowBuilder().addComponents(title),
          new ActionRowBuilder().addComponents(date),
          new ActionRowBuilder().addComponents(desc)
        );

        return interaction.showModal(modal);
      }

      // =========================
      // 💾 SPEICHERN
      // =========================
      if (interaction.isModalSubmit() && interaction.customId === "cal_create") {

        const title = interaction.fields.getTextInputValue("title");
        const date = interaction.fields.getTextInputValue("date");
        const desc = interaction.fields.getTextInputValue("desc");

        events.push({ title, date, desc });

        return interaction.reply({
          content: "✅ Termin erstellt!",
          ephemeral: true
        });
      }

      // =========================
      // 📋 LISTE
      // =========================
      if (interaction.isButton() && interaction.customId === "cal_list") {

        if (events.length === 0) {
          return interaction.reply({
            content: "❌ Keine Termine vorhanden.",
            ephemeral: true
          });
        }

        const list = events.map((e, i) =>
`📌 ${i + 1}. ${e.title}
🕒 ${e.date}
📝 ${e.desc}`).join("\n\n");

        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("📅 TERMINE")
              .setColor(0xff0000)
              .setDescription(list)
          ],
          ephemeral: true
        });
      }

    } catch (err) {
      console.log("Interaction Error:", err);
    }
  });
};