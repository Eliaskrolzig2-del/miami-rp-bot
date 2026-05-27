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
} = require('discord.js');

require('dotenv').config();

// ================= CONFIG =================
const TOKEN = process.env.TOKEN;

const GIVEAWAY_CHANNEL_ID = "1489339245775687830";
const SUPPORTER_ROLE_ID = "1503405887312760942";

// ================= STORAGE =================
const giveaways = new Map();

// ================= CLIENT =================
const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// ================= READY =================
client.once(Events.ClientReady, async () => {

    console.log(`✅ Online als ${client.user.tag}`);

    try {
        const channel = await client.channels.fetch(GIVEAWAY_CHANNEL_ID);

        const embed = new EmbedBuilder()
            .setTitle("🎉 GIVEAWAY SYSTEM")
            .setColor("#8000ff")
            .setDescription("Supporter können hier Giveaways erstellen.");

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("create_giveaway")
                .setLabel("🎉 Giveaway erstellen")
                .setStyle(ButtonStyle.Primary)
        );

        await channel.send({
            embeds: [embed],
            components: [row]
        });

        console.log("✅ Giveaway Panel gepostet");

    } catch (err) {
        console.log("❌ Panel Error:", err);
    }
});

// ================= INTERACTIONS =================
client.on(Events.InteractionCreate, async (interaction) => {

    try {

        // ================= OPEN MODAL =================
        if (interaction.isButton() && interaction.customId === "create_giveaway") {

            if (!interaction.member.roles.cache.has(SUPPORTER_ROLE_ID)) {
                return interaction.reply({
                    content: "❌ Nur Supporter!",
                    ephemeral: true
                });
            }

            const modal = new ModalBuilder()
                .setCustomId("giveaway_modal")
                .setTitle("🎉 Giveaway erstellen");

            const title = new TextInputBuilder()
                .setCustomId("title")
                .setLabel("Was wird verlost?")
                .setStyle(TextInputStyle.Short);

            const duration = new TextInputBuilder()
                .setCustomId("duration")
                .setLabel("Dauer (Minuten)")
                .setStyle(TextInputStyle.Short);

            modal.addComponents(
                new ActionRowBuilder().addComponents(title),
                new ActionRowBuilder().addComponents(duration)
            );

            return interaction.showModal(modal);
        }

        // ================= CREATE GIVEAWAY =================
        if (interaction.isModalSubmit() && interaction.customId === "giveaway_modal") {

            const title = interaction.fields.getTextInputValue("title");
            const duration = parseInt(interaction.fields.getTextInputValue("duration"));

            if (isNaN(duration)) {
                return interaction.reply({
                    content: "❌ Ungültige Zeit!",
                    ephemeral: true
                });
            }

            const channel = await client.channels.fetch(GIVEAWAY_CHANNEL_ID);

            const embed = new EmbedBuilder()
                .setTitle("🎉 GIVEAWAY")
                .setColor("#8000ff")
                .setDescription(
`🏆 Preis: **${title}**
⏱️ Dauer: **${duration} Minuten**

🎁 Klicke Teilnehmen!`
                );

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("join_giveaway")
                    .setLabel("🎁 Teilnehmen")
                    .setStyle(ButtonStyle.Success),

                new ButtonBuilder()
                    .setCustomId("end_giveaway")
                    .setLabel("🏁 Beenden")
                    .setStyle(ButtonStyle.Danger)
            );

            const msg = await channel.send({
                embeds: [embed],
                components: [row]
            });

            giveaways.set(msg.id, {
                participants: [],
                title,
                duration
            });

            return interaction.reply({
                content: "✅ Giveaway erstellt!",
                ephemeral: true
            });
        }

        // ================= JOIN =================
        if (interaction.isButton() && interaction.customId === "join_giveaway") {

            const gw = giveaways.get(interaction.message.id);

            if (!gw) {
                return interaction.reply({
                    content: "❌ Kein Giveaway aktiv",
                    ephemeral: true
                });
            }

            if (gw.participants.includes(interaction.user.id)) {
                return interaction.reply({
                    content: "❌ Schon dabei!",
                    ephemeral: true
                });
            }

            gw.participants.push(interaction.user.id);

            return interaction.reply({
                content: "🎉 Du bist dabei!",
                ephemeral: true
            });
        }

        // ================= END =================
        if (interaction.isButton() && interaction.customId === "end_giveaway") {

            if (!interaction.member.roles.cache.has(SUPPORTER_ROLE_ID)) {
                return interaction.reply({
                    content: "❌ Nur Supporter!",
                    ephemeral: true
                });
            }

            const gw = giveaways.get(interaction.message.id);

            if (!gw || gw.participants.length === 0) {
                return interaction.reply({
                    content: "❌ Keine Teilnehmer",
                    ephemeral: true
                });
            }

            const winner = gw.participants[Math.floor(Math.random() * gw.participants.length)];

            giveaways.delete(interaction.message.id);

            return interaction.reply({
                content: `🏆 Gewinner: <@${winner}> 🎉`,
                allowedMentions: { users: [winner] }
            });
        }

    } catch (err) {
        console.log("Error:", err);
    }
});

// ================= LOGIN =================
client.login(TOKEN);