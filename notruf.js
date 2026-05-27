const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require("discord.js");

module.exports = (client) => {

  console.log("🚨 Notruf Quiz geladen");

  const CHANNEL_ID = "1508808087312797866";

  const questions = [
    {
      q: "🚨 Du siehst einen Unfall mit Verletzten – was ist korrekt?",
      options: [
        { text: "Absichern + Notruf wählen", correct: true },
        { text: "Weiterfahren", correct: false },
        { text: "Nur filmen", correct: false },
        { text: "Warten bis jemand kommt", correct: false }
      ]
    },
    {
      q: "🔥 In einem Gebäude entsteht Rauch – was ist die beste erste Reaktion?",
      options: [
        { text: "Gebäude verlassen & Feuerwehr rufen", correct: true },
        { text: "Fenster öffnen und bleiben", correct: false },
        { text: "Abwarten", correct: false },
        { text: "Strom einschalten", correct: false }
      ]
    },
    {
      q: "🧍 Person bewusstlos, aber atmet – was machst du?",
      options: [
        { text: "Stabile Seitenlage + Notruf", correct: true },
        { text: "Ignorieren", correct: false },
        { text: "Aufsetzen lassen", correct: false },
        { text: "Weggehen", correct: false }
      ]
    },
    {
      q: "🚓 Ein bewaffneter Streit passiert – was ist richtig?",
      options: [
        { text: "Sofort Polizei rufen & Abstand halten", correct: true },
        { text: "Dazwischen gehen", correct: false },
        { text: "Filmen und näher gehen", correct: false },
        { text: "Ignorieren", correct: false }
      ]
    },
    {
      q: "⚡ Stromausfall + Funken in Steckdose – was zuerst?",
      options: [
        { text: "Sicherung ausschalten & Feuerwehr informieren", correct: true },
        { text: "Weiter benutzen", correct: false },
        { text: "Wasser drüber", correct: false },
        { text: "Nicht reagieren", correct: false }
      ]
    }
  ];

  let active = false;
  let current = null;
  let messageRef = null;

  // 🔒 SAFE GUARD (verhindert doppelte Listener bei Reload)
  if (client.notrufQuizLoaded) return;
  client.notrufQuizLoaded = true;

  async function sendQuestion() {
    const channel = await client.channels.fetch(CHANNEL_ID).catch(() => null);
    if (!channel) return;

    const q = questions[Math.floor(Math.random() * questions.length)];
    current = q;

    const row = new ActionRowBuilder();

    q.options.forEach((opt, i) => {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`notruf_${i}`)
          .setLabel(opt.text)
          .setStyle(ButtonStyle.Primary)
      );
    });

    const embed = new EmbedBuilder()
      .setTitle("🚨 Notruf Quiz")
      .setDescription(q.q)
      .setColor(0xff0000);

    messageRef = await channel.send({
      embeds: [embed],
      components: [row]
    });

    active = true;
  }

  client.on("interactionCreate", async (interaction) => {

    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith("notruf_")) return;
    if (!active || !current) return;

    const index = Number(interaction.customId.split("_")[1]);
    const opt = current.options[index];

    if (!opt) return;

    if (opt.correct) {

      active = false;

      await interaction.reply({
        content: `✅ Richtig ${interaction.user.username}!`,
        ephemeral: false
      });

      setTimeout(() => sendQuestion(), 3000);

    } else {
      await interaction.reply({
        content: `❌ Falsch ${interaction.user.username}`,
        ephemeral: true
      });
    }
  });

  // 🔒 READY SAFE (kein doppelter Start)
  client.once("ready", () => {

    if (client.notrufQuizStarted) return;
    client.notrufQuizStarted = true;

    console.log("🚀 Notruf Quiz startet...");

    setTimeout(sendQuestion, 3000);
  });

};