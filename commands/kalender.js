const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  Events
} = require("discord.js");

require("dotenv").config();

const fs = require("fs");

// ================= CONFIG =================
const TOKEN = process.env.TOKEN;
const CHANNEL_ID = "1503380652777803838";
const DB_FILE = "./kalender.json";

// ================= CLIENT =================
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ================= STORAGE =================
function loadEvents() {

  try {

    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, "[]");
    }

    return JSON.parse(
      fs.readFileSync(DB_FILE, "utf8")
    );

  } catch (err) {

    console.log("JSON Fehler:", err);
    return [];
  }
}

function saveEvents(data) {

  fs.writeFileSync(
    DB_FILE,
    JSON.stringify(data, null, 2),
    "utf8"
  );
}

// ================= REMOVE EXPIRED =================
function removeExpiredEvents() {

  let events = loadEvents();

  const now = Date.now();

  events = events.filter(e => {

    return Number(e.endTimestamp) > now;
  });

  saveEvents(events);
}

// ================= FORMAT =================
function formatEvents(events) {

  if (!events.length) {
    return "❌ Keine Termine vorhanden.";
  }

  let text = "";

  events.forEach((e, i) => {

    text +=
`╔══════════════════╗
📌 Termin #${i + 1}

📝 Titel:
${e.title}

🕒 Beginn:
${e.start}

⌛ Ende:
${e.end}

📄 Beschreibung:
${e.desc}
╚══════════════════╝

`;
  });

  return text;
}

// ================= PANEL MESSAGE =================
let panelMessage = null;

// ================= UPDATE PANEL =================
async function updatePanel() {

  removeExpiredEvents();

  const events = loadEvents();

  const embed = new EmbedBuilder()
    .setTitle("📅 MIAMI KALENDER")
    .setColor(0x8e44ad)
    .setDescription(formatEvents(events))
    .setFooter({
      text: `Termine insgesamt: ${events.length}`
    });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("cal_add")
      .setLabel("➕ Termin erstellen")
      .setStyle(ButtonStyle.Success)
  );

  if (!panelMessage) return;

  await panelMessage.edit({
    embeds: [embed],
    components: [row]
  });
}

// ================= READY =================
client.once(Events.ClientReady, async () => {

  console.log(`✅ Eingeloggt als ${client.user.tag}`);

  try {

    const channel = await client.channels.fetch(CHANNEL_ID);

    if (!channel) {
      return console.log("❌ Channel nicht gefunden");
    }

    removeExpiredEvents();

    const embed = new EmbedBuilder()
      .setTitle("📅 MIAMI KALENDER")
      .setColor(0x8e44ad)
      .setDescription(formatEvents(loadEvents()))
      .setFooter({
        text: `Termine insgesamt: ${loadEvents().length}`
      });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("cal_add")
        .setLabel("➕ Termin erstellen")
        .setStyle(ButtonStyle.Success)
    );

    panelMessage = await channel.send({
      embeds: [embed],
      components: [row]
    });

    console.log("📅 Kalender erfolgreich gestartet");

    // ================= AUTO UPDATE =================
    setInterval(async () => {

      try {

        await updatePanel();

      } catch (err) {

        console.log("Update Fehler:", err);
      }

    }, 60000);

  } catch (err) {

    console.log("Ready Fehler:", err);
  }
});

// ================= INTERACTIONS =================
client.on(Events.InteractionCreate, async (interaction) => {

  try {

    // ================= BUTTON =================
    if (
      interaction.isButton() &&
      interaction.customId === "cal_add"
    ) {

      const modal = new ModalBuilder()
        .setCustomId("cal_create")
        .setTitle("📅 Termin erstellen");

      const title = new TextInputBuilder()
        .setCustomId("title")
        .setLabel("Titel")
        .setStyle(TextInputStyle.Short);

      const start = new TextInputBuilder()
        .setCustomId("start")
        .setLabel("Start (YYYY-MM-DD HH:MM)")
        .setStyle(TextInputStyle.Short);

      const end = new TextInputBuilder()
        .setCustomId("end")
        .setLabel("Ende (YYYY-MM-DD HH:MM)")
        .setStyle(TextInputStyle.Short);

      const desc = new TextInputBuilder()
        .setCustomId("desc")
        .setLabel("Beschreibung")
        .setStyle(TextInputStyle.Paragraph);

      modal.addComponents(
        new ActionRowBuilder().addComponents(title),
        new ActionRowBuilder().addComponents(start),
        new ActionRowBuilder().addComponents(end),
        new ActionRowBuilder().addComponents(desc)
      );

      return interaction.showModal(modal);
    }

    // ================= SAVE EVENT =================
    if (
      interaction.isModalSubmit() &&
      interaction.customId === "cal_create"
    ) {

      const events = loadEvents();

      const title =
        interaction.fields.getTextInputValue("title");

      const start =
        interaction.fields.getTextInputValue("start");

      const end =
        interaction.fields.getTextInputValue("end");

      const desc =
        interaction.fields.getTextInputValue("desc");

      const endTimestamp = new Date(end).getTime();

      if (isNaN(endTimestamp)) {

        return interaction.reply({
          content:
            "❌ Falsches Datum Format!\nBeispiel:\n2026-05-27 18:30",
          ephemeral: true
        });
      }

      events.push({
        title,
        start,
        end,
        endTimestamp,
        desc
      });

      saveEvents(events);

      await updatePanel();

      return interaction.reply({
        content: "✅ Termin erstellt!",
        ephemeral: true
      });
    }

  } catch (err) {

    console.log("Interaction Fehler:", err);
  }
});

// ================= ERROR HANDLER =================
process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

// ================= LOGIN =================
client.login(TOKEN);