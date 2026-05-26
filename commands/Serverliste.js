const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "server",

  async execute(message) {

    const embed = new EmbedBuilder()
      .setTitle("🚨 NOTRUF HAMBURG ROLEPLAY")
      .setColor(0x0099ff)
      .setImage("https://media.discordapp.net/attachments/1489339032243667024/1503389694677745734/image.png")
      .setDescription(`
# 🌆 OFFIZIELLER SERVER

## 🎮 ROBLOX SERVERCODE
\`\`\`
720upmfy
\`\`\`

## 📌 SERVER INFOS

🚓 Deutsches Polizei RP  
🚑 Feuerwehr & Rettungsdienst  
🚕 Realistische Fahrzeuge  
🏙️ Hamburg City Map  
👮 Aktives Team  
🎤 Professionelles Roleplay

## 📥 SO JOINT IHR

1️⃣ Roblox öffnen  
2️⃣ Server suchen  
3️⃣ Code eingeben  
4️⃣ Roleplay starten

🚨 Willkommen bei Notruf Hamburg RP
`)
      .setFooter({
        text: "Notruf Hamburg RP • Offizieller Server"
      });

    message.channel.send({
      embeds: [embed]
    });
  }
};