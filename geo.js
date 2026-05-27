module.exports = (client) => {

  console.log("📦 GeoGuessr geladen");

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

  let activeAnswer = null;
  let locked = false;

  // 🔒 PREVENT DUPLICATE LOAD (24/7 SAFE)
  if (client.geoguessrLoaded) return;
  client.geoguessrLoaded = true;

  // =========================
  // START ROUND
  // =========================
  async function startRound() {
    if (locked) return;
    locked = true;

    try {
      const channel = await client.channels.fetch(CHANNEL_ID).catch(() => null);
      if (!channel) {
        locked = false;
        return console.log("❌ Geo Channel nicht gefunden");
      }

      const loc = locations[Math.floor(Math.random() * locations.length)];
      activeAnswer = loc.name.toLowerCase().trim();

      await channel.send({
        embeds: [{
          title: "🌍 GeoGuessr",
          description: "Schreibe den richtigen Ort in den Chat!",
          image: { url: loc.image },
          color: 0x00ff00
        }]
      });

    } catch (err) {
      console.log("GEO ERROR:", err);
    }

    locked = false;
  }

  // =========================
  // MESSAGE HANDLER (SAFE ONCE)
  // =========================
  if (!client.geoguessrMsgHandler) {
    client.geoguessrMsgHandler = true;

    client.on("messageCreate", async (message) => {

      if (message.author.bot) return;
      if (message.channel.id !== CHANNEL_ID) return;
      if (!activeAnswer) return;

      const guess = message.content.toLowerCase().trim();

      if (guess !== activeAnswer) return;

      activeAnswer = null;

      try {
        await message.react("✅");
      } catch {}

      await message.channel.send(`🎉 Richtig ${message.author.username}!`);

      setTimeout(() => {
        startRound();
      }, 3000);
    });
  }

  // =========================
  // READY (SAFE ONLY ONCE)
  // =========================
  client.once("ready", () => {

    if (client.geoguessrStarted) return;
    client.geoguessrStarted = true;

    console.log("🚀 GeoGuessr startet...");

    setTimeout(() => {
      startRound();
    }, 3000);
  });

};