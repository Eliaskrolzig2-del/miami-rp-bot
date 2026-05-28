const { EmbedBuilder } = require("discord.js");

module.exports = (client) => {

  console.log("📦 GeoGuessr 24/7 geladen");

  const CHANNEL_ID = "1507851827004178583";

  const locations = [
    { name: "polizeiwache", image: "https://cdn.discordapp.com/attachments/1503481883798016154/1508525975741268048/image.png" },
    { name: "bank", image: "https://cdn.discordapp.com/attachments/1503481883798016154/1508526145279102976/image.png" },
    { name: "gefängnis", image: "https://cdn.discordapp.com/attachments/1503481883798016154/1508526268037988522/image.png" },
    { name: "ares-tankstelle", image: "https://cdn.discordapp.com/attachments/1503481883798016154/1508526487106617405/image.png" },
    { name: "krankenhaus", image: "https://cdn.discordapp.com/attachments/1503481883798016154/1508526590030647346/image.png" },
    { name: "tuningwerkstatt", image: "https://cdn.discordapp.com/attachments/1503481883798016154/1508526690895134940/image.png" },
    { name: "busfirma", image: "https://cdn.discordapp.com/attachments/1503481883798016154/1508526771342151761/image.png" },
    { name: "kleiderladen", image: "https://cdn.discordapp.com/attachments/1503481883798016154/1508528142933954632/image.png" },
    { name: "osso-tankstelle", image: "https://cdn.discordapp.com/attachments/1503481883798016154/1508528208243462211/image.png" },
    { name: "grenze", image: "https://cdn.discordapp.com/attachments/1503481883798016154/1508528296651128962/image.png" }
  ];

  if (!client.geo) {
    client.geo = {
      activeAnswer: null,
      running: false
    };
  }

  async function startRound() {

    if (client.geo.running) return;

    client.geo.running = true;

    try {

      const channel = await client.channels.fetch(CHANNEL_ID).catch(() => null);

      if (!channel) {
        console.log("❌ Geo Channel nicht gefunden");
        client.geo.running = false;
        return;
      }

      const loc = locations[Math.floor(Math.random() * locations.length)];

      client.geo.activeAnswer = loc.name.toLowerCase();

      console.log("🎯 Lösung:", client.geo.activeAnswer);

      const safeImage = `${loc.image}?v=${Date.now()}`;

      const embed = new EmbedBuilder()
        .setTitle("🌍 GeoGuessr")
        .setDescription("Schreibe den richtigen Ort in den Chat!")
        .setImage(safeImage)
        .setColor(0x00ff00);

      await channel.send({ embeds: [embed] });

      console.log("✅ Runde gestartet");

    } catch (err) {
      console.log("❌ Round Error:", err);
    }

    client.geo.running = false;
  }

  if (!client.geoHandler) {

    client.geoHandler = true;

    client.on("messageCreate", async (message) => {

      try {

        if (message.author.bot) return;
        if (message.channel.id !== CHANNEL_ID) return;

        if (!client.geo.activeAnswer) return;

        const guess = message.content.toLowerCase().trim();

        if (!guess.includes(client.geo.activeAnswer)) return;

        client.geo.activeAnswer = null;

        try {
          await message.react("✅");
        } catch {}

        await message.channel.send(`🎉 Richtig ${message.author.username}!`);

        setTimeout(() => startRound(), 4000);

      } catch (err) {
        console.log("❌ Message Error:", err);
      }

    });
  }

  client.once("ready", async () => {

    console.log("🚀 GeoGuessr 24/7 startet...");

    setTimeout(() => {
      startRound();
    }, 5000);

    setInterval(() => {

      if (!client.geo.activeAnswer && !client.geo.running) {
        console.log("♻️ Auto-Recovery Trigger");
        startRound();
      }

    }, 1000 * 60 * 5);

  });

};