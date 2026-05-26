const fs = require("fs");

const CHANNEL_ID = "1505354048826642503";
const FILE = "./counter.json";

let stats = {};
let current = 1;
let running = false;
let lastTopTime = 0;

// =========================
// LOAD DATA
// =========================
if (fs.existsSync(FILE)) {
  try {
    stats = JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    stats = {};
  }
}

function save() {
  try {
    fs.writeFileSync(FILE, JSON.stringify(stats, null, 2));
  } catch (e) {
    console.log("Save Error:", e);
  }
}

// =========================
// EXPORT (KEEP COMPATIBLE)
// =========================
module.exports = {
  name: "zähler",
  execute: async () => {}
};

// =========================
// AUTO START (KEIN COMMAND MEHR)
// =========================
module.exports.start = (client) => {

  client.once("clientReady", async () => {

    if (running) return;

    try {

      const channel = await client.channels.fetch(CHANNEL_ID);
      if (!channel) return console.log("❌ Channel nicht gefunden");

      running = true;
      current = 1;

      await channel.send("🔢 **ZÄHLER STARTET JETZT bei 1**");

      const collector = channel.createMessageCollector({
        filter: (m) =>
          !m.author.bot &&
          m.channel.id === CHANNEL_ID
      });

      collector.on("collect", async (m) => {

        try {

          const content = m.content.trim();

          if (!/^\d+$/.test(content)) return;

          const num = parseInt(content);

          // =========================
          // ❌ FALSCH
          // =========================
          if (num !== current) {

            try { await m.react("❌"); } catch {}

            current = 1;

            await channel.send(
              `❌ FALSCH! ${m.author.username} hat **${num}** geschrieben → Reset auf 1`
            );

            await showTop(channel);
            return;
          }

          // =========================
          // ✅ RICHTIG
          // =========================
          try { await m.react("✅"); } catch {}

          stats[m.author.id] = (stats[m.author.id] || 0) + 1;
          save();

          current++;

        } catch (err) {
          console.log("Collect Error:", err);
        }
      });

      collector.on("end", () => {
        console.log("⚠️ Collector gestoppt");
        running = false;
      });

      console.log("🔢 Zähler AUTO START aktiv");

    } catch (err) {
      console.log("INIT ERROR:", err);
    }
  });
};

// =========================
// 🏆 BESTENLISTE (NO PINGS + SAFE)
// =========================
async function showTop(channel) {

  try {

    const now = Date.now();
    if (now - lastTopTime < 3000) return;
    lastTopTime = now;

    const top = Object.entries(stats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    const text =
`🏆 **BESTENLISTE**
━━━━━━━━━━━━━━━━
🥇 ${top[0] ? `${top[0][0]} — ${top[0][1]} Punkte` : "-"}
🥈 ${top[1] ? `${top[1][0]} — ${top[1][1]} Punkte` : "-"}
🥉 ${top[2] ? `${top[2][0]} — ${top[2][1]} Punkte` : "-"}
━━━━━━━━━━━━━━━━`;

    await channel.send(text);

  } catch (e) {
    console.log("Top Error:", e);
  }
}