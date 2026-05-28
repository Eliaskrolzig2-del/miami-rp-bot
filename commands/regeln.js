const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

module.exports = {
  name: "regeln",

  async execute(message, client) {

    const image =
      "https://cdn.discordapp.com/attachments/1398233276203794432/1508424320223936553/E65801E0-03F0-47C6-8F89-47E1508D079D.png";

    // ================= MAIN MENU =================
    const menu = new EmbedBuilder()
      .setTitle("🌴 MIAMI ROLEPLAY | REGELWERK")
      .setColor(0x9b59b6)
      .setImage(image)
      .setDescription("📜 **Willkommen im Regelwerk**");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("rules_discord")
        .setLabel("💬 Discord Regeln")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("rules_ingame")
        .setLabel("🎮 Ingame Regeln")
        .setStyle(ButtonStyle.Success)
    );

    await message.channel.send({
      embeds: [menu],
      components: [row]
    });

    // ================= BUTTON HANDLER =================
    if (!client.regelnHandler) {
      client.regelnHandler = true;

      client.on("interactionCreate", async (interaction) => {
        if (!interaction.isButton()) return;

        // ================= DISCORD REGELN =================
        if (interaction.customId === "rules_discord") {

          const embed = new EmbedBuilder()
            .setTitle("💬 DISCORD REGELN")
            .setColor(0x9b59b6)
            .setThumbnail(image)
            .setDescription(
`1. Respektvoller Umgang
2. Kein Spam
3. Keine Werbung
4. NSFW verboten
5. Kein Hate
6. Team-Anweisungen beachten
7. Support nur über Tickets
8. Keine Fake Accounts
9. Kein Spam-Pingen
10. Discord TOS einhalten
11. Nur in die richtigen Channels schreiben`
            );

          return interaction.reply({
            embeds: [embed],
            ephemeral: true
          });
        }

        // ================= INGAME REGELN =================
        if (interaction.customId === "rules_ingame") {

          const embed = new EmbedBuilder()
            .setTitle("🎮 INGAME REGELN")
            .setColor(0x9b59b6)
            .setThumbnail(image)
            .setDescription(
`1. FailRP verboten
2. RDM verboten
3. VDM verboten
4. FearRP Pflicht
5. Metagaming verboten
6. PowerRP verboten
7. NLR einhalten
8. Combat Logging verboten
9. Realistisches RP Pflicht
10. Kein Fail Driving`
            );

          return interaction.reply({
            embeds: [embed],
            ephemeral: true
          });
        }
      });
    }
  }
};