const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
  name: "regeln",

  async execute(message) {

    const image =
      "https://cdn.discordapp.com/attachments/1398233276203794432/1508424320223936553/E65801E0-03F0-47C6-8F89-47E1508D079D.png";

    // ================= MAIN MENU =================
    const menu = new EmbedBuilder()
      .setTitle("🌴 MIAMI ROLEPLAY | REGELWERK")
      .setColor(0x9b59b6)
      .setImage(image)
      .setDescription(
`📜 **Willkommen im Regelwerk**

Bitte wähle eine Kategorie aus:

⚠️ Dieses Menü ist nur für dich sichtbar.`
      );

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

    const msg = await message.channel.send({
      embeds: [menu],
      components: [row]
    });

    // ================= BUTTON HANDLER =================
    const collector = msg.createMessageComponentCollector({ time: 600000 });

    collector.on("collect", async (interaction) => {

      if (!interaction.isButton()) return;

      const image =
        "https://cdn.discordapp.com/attachments/1398233276203794432/1508424320223936553/E65801E0-03F0-47C6-8F89-47E1508D079D.png";

      // ================= DISCORD =================
      if (interaction.customId === "rules_discord") {

        const embed = new EmbedBuilder()
          .setTitle("💬 DISCORD REGELN")
          .setColor(0x9b59b6)
          .setThumbnail(image)
          .setDescription(
`1. Respektvoller Umgang ist Pflicht  
2. Kein Spam oder Flooding  
3. Keine Werbung  
4. Keine NSFW Inhalte  
5. Kein Hate / Beleidigungen  
6. Team Anweisungen beachten  
7. Support nur über Tickets  
8. Keine Fake Accounts  
9. Keine Provokationen  
10. Kein unnötiges Pingen  
11. Kein Server-Hating  
12. Angemessene Sprache  
13. Kein Mobbing  
14. Keine Politik/Extremismus  
15. Discord TOS einhalten`
          );

        return interaction.reply({
          embeds: [embed],
          ephemeral: true   // 🔥 NUR DIE PERSON SIEHT ES
        });
      }

      // ================= INGAME =================
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
10. Kein Cop Baiting  
11. Kein Car Ramming ohne RP  
12. Keine unrealistischen Aktionen  
13. Crime RP muss geplant sein  
14. Keine Third Party  
15. Voice RP korrekt  
16. Kein Troll  
17. Kein Fail Driving  
18. Keine unrealistischen Waffen  
19. Kein Bug Abuse  
20. Admin Entscheidungen final`
          );

        return interaction.reply({
          embeds: [embed],
          ephemeral: true   // 🔥 nur der User sieht es
        });
      }
    });
  }
};