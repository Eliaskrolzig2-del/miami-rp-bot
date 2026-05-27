module.exports = {
  name: "commands",
  execute(message) {
    message.channel.send(
`📜 **Commands:**
!server
!ping
!ticket
!kalender
!regeln
!urlaub`
    );
  }
};