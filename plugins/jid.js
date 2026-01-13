import { Module } from "../lib/plugins.js";

Module({
  command: ["newsletterjid", "njid"],
  package: "tools",
  description: "Get WhatsApp Newsletter JID",
})(async (message, match, sock) => {
  try {
    const start = Date.now();

    if (!match)
      return await message.reply(
        "❌ Invite link বা code দাও\n\nExample:\n.newsletterjid https://whatsapp.com/channel/AbCdEf123"
      );

    // contact-style quote (same as ping)
    let gift = {
      key: {
        fromMe: false,
        participant: `0@s.whatsapp.net`,
        remoteJid: "status@broadcast",
      },
      message: {
        contactMessage: {
          displayName: "𝑴𝒓 𝑹𝒂𝒃𝒃𝒊𝒕'ʬ 合",
          vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;a,;;;\nFN:'DEMON'\nitem1.TEL;waid=${
            message.conn.user.id.split("@")[0]
          }:${
            message.conn.user.id.split("@")[0]
          }\nitem1.X-ABLabel:Ponsel\nEND:VCARD`,
        },
      },
    };

    const emojis = [
      "📢","✨","🌸","💫","🦋","⚡","🌟","🎐","☁️","🪐"
    ];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];

    await message.react(emoji);

    // clean input
    let text = match.trim();
    let code = text.includes("/")
      ? text.split("/").filter(Boolean).pop()
      : text;

    const meta = await sock.newsletterMetadata("invite", code);

    if (!meta?.id)
      return await message.reply("❌ Invalid / Expired invite code");

    const latency = Date.now() - start;

    await message.conn.sendMessage(
      message.from,
      {
        text:
          `*${emoji} Newsletter JID Found*\n\n` +
          `📢 JID:\n\`\`\`${meta.id}\`\`\`\n\n` +
          `⏱ ${latency} ms`,
        contextInfo: {
          mentionedJid: [message.sender],
          forwardingScore: 5,
          isForwarded: false,
        },
      },
      { quoted: gift }
    );

  } catch (e) {
    await message.reply("❌ Invalid / Expired Newsletter Invite");
  }
});
