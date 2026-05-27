const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require("discord.js");

const fs = require("fs");

// ================= CONFIG =================
const reviewChannelId = "1503381915124633610";
const DB_FILE = "./urlaube.json";

// ================= DB =================
function load() {
  if (!fs.existsSync(DB_FILE)) return [];
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function save(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ================= ACTIVE GUARD =================
// verhindert doppelte Listener
if (!global.urlaubSystemLoaded) {
  global.urlaubSystemLoaded = true;
}

// ================= COMMAND =================
module.exports = {
  name: "urlaub",

  async execute(message, args, client) {

    const embed = new EmbedBuilder()
      .setTitle("🌴 URLAUB SYSTEM")
      .setColor(0x9b59b6)
      .setDescription("Beantrage deinen Urlaub hier");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("urlaub_create")
        .setLabel("🏖️ Beantragen")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("urlaub_list")
        .setLabel("📋 Liste")
        .setStyle(ButtonStyle.Primary)
    );

    message.channel.send({ embeds: [embed], components: [row] });

    // ================= GLOBAL INTERACTIONS (nur 1x!) =================
    if (!client.urlaubListenerAdded) {
      client.urlaubListenerAdded = true;

      client.on("interactionCreate", async (interaction) => {

        let urlaube = load();

        try {

          // ================= CREATE BUTTON =================
          if (interaction.isButton() && interaction.customId === "urlaub_create") {

            const modal = new ModalBuilder()
              .setCustomId("urlaub_modal")
              .setTitle("🏖️ Urlaub beantragen");

            const von = new TextInputBuilder()
              .setCustomId("von")
              .setLabel("Von Datum")
              .setStyle(TextInputStyle.Short)
              .setRequired(true);

            const bis = new TextInputBuilder()
              .setCustomId("bis")
              .setLabel("Bis Datum")
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

          // ================= SAVE MODAL =================
          if (interaction.isModalSubmit() && interaction.customId === "urlaub_modal") {

            const id = `${Date.now()}_${interaction.user.id}`;

            const entry = {
              id,
              userId: interaction.user.id,
              von: interaction.fields.getTextInputValue("von"),
              bis: interaction.fields.getTextInputValue("bis"),
              grund: interaction.fields.getTextInputValue("grund"),
              status: "pending"
            };

            urlaube.push(entry);
            save(urlaube);

            const channel = interaction.guild.channels.cache.get(reviewChannelId);

            if (channel) {
              const embed = new EmbedBuilder()
                .setTitle("🏖️ NEUER URLAUBSANTRAG")
                .setColor(0xffcc00)
                .setDescription(
`👤 <@${interaction.user.id}>
📅 ${entry.von} - ${entry.bis}
📝 ${entry.grund}
🆔 ${entry.id}`
                );

              const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setCustomId(`urlaub_accept_${entry.id}`)
                  .setLabel("✅ Annehmen")
                  .setStyle(ButtonStyle.Success),

                new ButtonBuilder()
                  .setCustomId(`urlaub_decline_${entry.id}`)
                  .setLabel("❌ Ablehnen")
                  .setStyle(ButtonStyle.Danger)
              );

              channel.send({ embeds: [embed], components: [row] });
            }

            return interaction.reply({
              content: "✅ Urlaub eingereicht!",
              ephemeral: true
            });
          }

          // ================= LIST =================
          if (interaction.isButton() && interaction.customId === "urlaub_list") {

            if (!urlaube.length) {
              return interaction.reply({
                content: "❌ Keine Urlaube vorhanden",
                ephemeral: true
              });
            }

            const text = urlaube.map(u =>
`👤 <@${u.userId}>
📅 ${u.von} - ${u.bis}
📝 ${u.grund}
📌 ${u.status}`
            ).join("\n\n");

            const embed = new EmbedBuilder()
              .setTitle("📋 ALLE URLAUBE")
              .setColor(0x3498db)
              .setDescription(text);

            return interaction.reply({ embeds: [embed], ephemeral: true });
          }

          // ================= ACCEPT =================
          if (interaction.isButton() && interaction.customId.startsWith("urlaub_accept_")) {

            const id = interaction.customId.replace("urlaub_accept_", "");

            const u = urlaube.find(x => x.id === id);
            if (!u) return;

            u.status = "approved";
            save(urlaube);

            const member = await interaction.guild.members.fetch(u.userId).catch(() => null);
            member?.send("✅ Dein Urlaub wurde ANGENOMMEN!");

            return interaction.update({
              content: "✅ Genehmigt",
              components: []
            });
          }

          // ================= DECLINE =================
          if (interaction.isButton() && interaction.customId.startsWith("urlaub_decline_")) {

            const id = interaction.customId.replace("urlaub_decline_", "");

            const u = urlaube.find(x => x.id === id);
            if (!u) return;

            u.status = "declined";
            save(urlaube);

            const member = await interaction.guild.members.fetch(u.userId).catch(() => null);
            member?.send("❌ Dein Urlaub wurde ABGELEHNT.");

            return interaction.update({
              content: "❌ Abgelehnt",
              components: []
            });
          }

        } catch (err) {
          console.log("Urlaub Error:", err);
        }
      });
    }
  }
};