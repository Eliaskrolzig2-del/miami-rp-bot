const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    NoSubscriberBehavior,
    entersState,
    VoiceConnectionStatus
} = require("@discordjs/voice");

const path = require("path");

/* ================= SAFE LOAD (verhindert Doppel-Events auf Render) ================= */
if (global.__warteraum_loaded__) {
    console.log("⚠️ Warteraum bereits geladen");
    return;
}
global.__warteraum_loaded__ = true;

module.exports = (client) => {

    console.log("📦 Warteraum System geladen");

    const WAITING_ROOM_ID = "1489337872879321281";
    const LOG_CHANNEL_ID = "1508498102200307873";

    let connection = null;
    let musicPlayer = null;
    let connecting = false;

    client.on("voiceStateUpdate", async (oldState, newState) => {

        try {

            const joined =
                newState.channelId === WAITING_ROOM_ID &&
                oldState.channelId !== WAITING_ROOM_ID;

            const left =
                oldState.channelId === WAITING_ROOM_ID &&
                newState.channelId !== WAITING_ROOM_ID;

            /* ================= JOIN ================= */
            if (joined) {

                const member = newState.member;
                if (!member) return;

                const log = client.channels.cache.get(LOG_CHANNEL_ID);
                log?.send(`🎧 ${member} im Warteraum`);

                const supportTimes =
`🕒 Supportzeiten:
Mo–Fr: 16–20 Uhr
Sa: 12–22 Uhr
So: 12–20 Uhr`;

                try {
                    await member.send(`👋 Willkommen im Support!\n\n${supportTimes}`);
                } catch {
                    log?.send(`⚠️ <@${member.id}> keine DM möglich`);
                }

                /* ================= SAFE VOICE CONNECT ================= */
                if (!connection && !connecting) {

                    connecting = true;

                    connection = joinVoiceChannel({
                        channelId: newState.channel.id,
                        guildId: newState.guild.id,
                        adapterCreator: newState.guild.voiceAdapterCreator,
                        selfDeaf: false
                    });

                    await entersState(
                        connection,
                        VoiceConnectionStatus.Ready,
                        15000
                    ).catch(() => null);

                    connecting = false;

                    /* ================= MUSIC FIX ================= */
                    const musicPath = path.join(__dirname, "musik.mp3");

                    musicPlayer = createAudioPlayer({
                        behaviors: {
                            noSubscriber: NoSubscriberBehavior.Play
                        }
                    });

                    const music = createAudioResource(musicPath);

                    musicPlayer.play(music);
                    connection.subscribe(musicPlayer);

                    console.log("🎵 Musik läuft");
                }
            }

            /* ================= LEAVE ================= */
            if (left) {

                const channel = oldState.channel;
                if (!channel) return;

                const humans = channel.members.filter(m => !m.user.bot);

                if (humans.size === 0 && connection) {

                    console.log("👋 Warteraum leer → disconnect");

                    connection.destroy();
                    connection = null;
                    musicPlayer = null;
                }
            }

        } catch (err) {
            console.log("❌ Warteraum Fehler:", err);
        }
    });
};