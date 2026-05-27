require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    PermissionsBitField,
    Events
} = require("discord.js");

// ================= CONFIG =================
const TOKEN = process.env.DISCORD_TOKEN;

const PANEL_CHANNEL_ID = "1504430909158326353";
const LOG_CHANNEL_ID = "1508498102200307873";
const SUPPORT_ROLE_ID = "1503405887312760942";

const PARTNER_IMAGE =
"https://cdn.discordapp.com/attachments/1503481883798016154/1509124292493967410/image.png";

// ================= CLIENT =================
const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// ================= ANTI DOUBLE PANEL =================
let panelSent = false;

// ================= READY =================
client.once(Events.ClientReady, async () => {

    console.log(`💜 Partner Bot online als ${client.user.tag}`);

    if (panelSent) return;
    panelSent = true;

    const channel = await client.channels.fetch(PANEL_CHANNEL_ID).catch(() => null);
    if (!channel) return console.log("❌ Panel Channel nicht gefunden");

    const embed = new EmbedBuilder()
        .setTitle("💜 PARTNERSCHAFT SYSTEM")
        .setColor("#8000ff")
        .setDescription(
`📌 Hier kannst du eine Partnerschaft beantragen.

👉 Klicke unten auf den Button
👉 Support wird sich melden

━━━━━━━━━━━━━━`
        )
        .setImage(PARTNER_IMAGE);

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("open_partner")
            .setLabel("🤝 Partnerschaft beantragen")
            .setStyle(ButtonStyle.Primary)
    );

    await channel.send({
        embeds: [embed],
        components: [row]
    });

    console.log("💜 Partner Panel gesendet");
});

// ================= INTERACTION =================
client.on(Events.InteractionCreate, async (interaction) => {

    try {

        // ================= OPEN TICKET =================
        if (interaction.isButton() && interaction.customId === "open_partner") {

            const guild = interaction.guild;

            const channel = await guild.channels.create({
                name: `partner-${interaction.user.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: [PermissionsBitField.Flags.ViewChannel]
                    },
                    {
                        id: interaction.user.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages,
                            PermissionsBitField.Flags.ReadMessageHistory
                        ]
                    },
                    {
                        id: SUPPORT_ROLE_ID,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages,
                            PermissionsBitField.Flags.ReadMessageHistory
                        ]
                    }
                ]
            });

            const embed = new EmbedBuilder()
                .setTitle("💜 PARTNERSCHAFT TICKET")
                .setColor("#8000ff")
                .setImage(PARTNER_IMAGE)
                .setDescription(
`👤 User: ${interaction.user}

━━━━━━━━━━━━━━
📌 Bitte schreibe deine Anfrage:
• Server Name
• Aktivität
• Konzept
• Angebot
━━━━━━━━━━━━━━`
                );

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`close_partner`)
                    .setLabel("❌ Schließen")
                    .setStyle(ButtonStyle.Danger)
            );

            await channel.send({
                content: `<@${interaction.user.id}> <@&${SUPPORT_ROLE_ID}>`,
                embeds: [embed],
                components: [row]
            });

            // LOG
            const log = await interaction.guild.channels.fetch(LOG_CHANNEL_ID).catch(() => null);

            log?.send({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("💜 Partner Ticket erstellt")
                        .setColor("#8000ff")
                        .setDescription(
`👤 User: ${interaction.user}
📁 Channel: ${channel}`
                        )
                ]
            });

            return interaction.reply({
                content: `💜 Ticket erstellt: ${channel}`,
                ephemeral: true
            });
        }

        // ================= CLOSE =================
        if (interaction.isButton() && interaction.customId === "close_partner") {

            await interaction.reply({
                content: "💜 Ticket wird geschlossen...",
                ephemeral: true
            });

            setTimeout(() => {
                interaction.channel.delete().catch(() => {});
            }, 2000);
        }

    } catch (err) {
        console.log("Partner System Error:", err);
    }
});

// ================= LOGIN =================
client.login(TOKEN);