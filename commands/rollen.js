const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    Events
} = require('discord.js');

require('dotenv').config();

// ================= SAFE CLIENT =================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// ================= GLOBAL ERROR PROTECTION =================
process.on("unhandledRejection", (err) => {
    console.log("⚠️ Unhandled Promise Error:", err);
});

process.on("uncaughtException", (err) => {
    console.log("⚠️ Critical Error:", err);
});

// ================= !ROLLEN =================
client.on(Events.MessageCreate, async (message) => {

    try {

        if (message.author.bot) return;
        if (message.content.toLowerCase() !== '!rollen') return;

        const embed = new EmbedBuilder()
            .setTitle('🌴 Miami-RP Team Rollen')
            .setDescription('Wähle eine Rolle aus.')
            .setColor('#8000ff');

        const menu = new StringSelectMenuBuilder()
            .setCustomId('rollen_system')
            .setPlaceholder('Rolle auswählen')
            .addOptions([
                { label: 'Supporter', value: 'supporter' },
                { label: 'Probe Admin', value: 'probe_admin' },
                { label: 'Admin', value: 'admin' },
                { label: 'Developer', value: 'developer' },
                { label: 'Teamleitung', value: 'teamleitung' },
                { label: 'Management', value: 'management' },
                { label: 'Co-Owner', value: 'co_owner' },
                { label: 'Stv. Owner', value: 'stv_owner' },
                { label: 'Owner', value: 'owner' }
            ]);

        const row = new ActionRowBuilder().addComponents(menu);

        await message.channel.send({
            embeds: [embed],
            components: [row]
        });

    } catch (err) {
        console.log("MessageCreate Error:", err);
    }
});

// ================= DROPDOWN =================
client.on(Events.InteractionCreate, async (interaction) => {

    try {

        if (!interaction.isStringSelectMenu()) return;
        if (interaction.customId !== 'rollen_system') return;

        const role = interaction.values[0];

        const roles = {
            supporter: "Hilft Spielern im Support.",
            probe_admin: "Lernt Admin Aufgaben.",
            admin: "Überwacht Regeln.",
            developer: "Baut Systeme & Bots.",
            teamleitung: "Leitet das Team.",
            management: "Organisiert Server.",
            co_owner: "Unterstützt Leitung.",
            stv_owner: "Vertretung des Owners.",
            owner: "Leitet den Server."
        };

        const embed = new EmbedBuilder()
            .setTitle(`📌 ${role}`)
            .setColor('#8000ff')
            .setDescription(roles[role] || "Keine Info gefunden.");

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });

    } catch (err) {
        console.log("Interaction Error:", err);
    }
});

// ================= AUTO RECONNECT SAFETY =================
client.once(Events.ClientReady, () => {
    console.log(`✅ Online als ${client.user.tag}`);
});

// ================= LOGIN (ONLY ONCE!) =================
client.login(process.env.TOKEN);