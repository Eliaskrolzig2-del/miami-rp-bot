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
} = require('discord.js');

require('dotenv').config();

// ================= CONFIG =================
const TOKEN = process.env.TOKEN;

const PANEL_CHANNEL_ID = "1509113978528333844";
const LOG_CHANNEL_ID = "1508498102200307873";
const SUPPORTER_ROLE_ID = "1503405887312760942";

// OPTIONAL: Ticket Kategorie ganz oben im Server
const TICKET_CATEGORY_ID = null; // z.B. "1234567890"

// ================= CLIENT =================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// ================= READY =================
client.once(Events.ClientReady, async () => {

    console.log(`✅ Online als ${client.user.tag}`);

    const channel = await client.channels.fetch(PANEL_CHANNEL_ID);

    const embed = new EmbedBuilder()
        .setTitle("💜 Fraktions Ticket System")
        .setDescription("Klicke unten um ein Ticket zu erstellen.")
        .setColor("#8000ff");

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("open_ticket")
            .setLabel("🎫 Ticket öffnen")
            .setStyle(ButtonStyle.Success)
    );

    await channel.send({ embeds: [embed], components: [row] });
});

// ================= EVENTS =================
client.on(Events.InteractionCreate, async (interaction) => {

    try {

        // ================= OPEN TICKET =================
        if (interaction.isButton() && interaction.customId === "open_ticket") {

            // Ticket Channel erstellen
            const ticketChannel = await interaction.guild.channels.create({
                name: `ticket-${interaction.user.username}`,
                type: ChannelType.GuildText,
                parent: TICKET_CATEGORY_ID,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
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
                        id: SUPPORTER_ROLE_ID,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages,
                            PermissionsBitField.Flags.ReadMessageHistory
                        ]
                    }
                ]
            });

            // Ticket Embed im Channel
            const embed = new EmbedBuilder()
                .setTitle("💜 Support Ticket")
                .setColor("#8000ff")
                .setDescription(
`👤 User: ${interaction.user}

━━━━━━━━━━━━━━
📌 Beschreibe dein Anliegen:
• Fraktion Bewerbung
• Support
• Fragen
━━━━━━━━━━━━━━`
                );

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`close_${interaction.user.id}`)
                    .setLabel("❌ Ticket schließen")
                    .setStyle(ButtonStyle.Danger)
            );

            await ticketChannel.send({
                content: `<@${interaction.user.id}> <@&${SUPPORTER_ROLE_ID}>`,
                embeds: [embed],
                components: [row]
            });

            // LOG MESSAGE
            const logChannel = await client.channels.fetch(LOG_CHANNEL_ID);

            const logEmbed = new EmbedBuilder()
                .setTitle("📩 Ticket erstellt")
                .setColor("#8000ff")
                .setDescription(
`👤 User: ${interaction.user}
📁 Channel: ${ticketChannel}
⏰ Zeit: <t:${Math.floor(Date.now()/1000)}:F>`
                );

            await logChannel.send({ embeds: [logEmbed] });

            return interaction.reply({
                content: `✅ Ticket erstellt: ${ticketChannel}`,
                ephemeral: true
            });
        }

        // ================= CLOSE TICKET =================
        if (interaction.isButton() && interaction.customId.startsWith("close_")) {

            await interaction.reply({
                content: "💜 Ticket wird geschlossen...",
                ephemeral: true
            });

            setTimeout(() => {
                interaction.channel.delete().catch(() => {});
            }, 2000);
        }

    } catch (err) {
        console.log("Error:", err);
    }
});

// ================= LOGIN =================
client.login(TOKEN);