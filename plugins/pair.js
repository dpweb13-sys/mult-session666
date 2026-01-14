import { Module } from '../lib/plugins.js';

Module({
  command: "pair",
  package: "main",
  description: "Instruct user to pair via Telegram Bot with fixed image",
})(async (message, match) => {
  try {
    const _cmd_st = `
╭━━━「 💜🦋💗 𝐏𝐀𝐈𝐑 𝐒𝐄𝐓𝐓𝐈𝐍𝐆𝐒 💗🦋💜 」━━━┈⊷
┃
┃ 𝐇ᴇʟʟᴏ 𝐋ᴏᴠᴇʟʏ 𝐔sᴇʀ! 🦋💖
┃
┃ 🌸 𝐏ᴀɪʀ ʏᴏᴜʀ ɴᴜᴍʙᴇʀ ᴠɪᴀ 𝐓ᴇʟᴇɢʀᴀᴍ 𝐁ᴏᴛ 🌸
┃ 🔗 https://t.me/+2DnKv2IrP5s5ZjI1
┃ 🎀 𝐄ɴᴊᴏʏ ʏᴏᴜʀ ʙᴏᴛ 𝐄xᴘᴇʀɪᴇɴᴄᴇ! 🌷🦋💜
╰━━━━━━━━━━━━━━━━━━━━┈⊷
    `.trim();

    const opts = {
      image: { url: "https://files.catbox.moe/56fmfy.jpg" },
      caption: _cmd_st,
      mimetype: "image/jpeg",
      contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: "",
          newsletterName: "𝐄𝐈𝐌𝐋𝐈 ✘𝐌𝐃",
          serverMessageId: 6,
        },
      },
    };

    await message.conn.sendMessage(message.from, opts);
  } catch (err) {
    console.error("❌ Pair command error:", err);
    await message.conn.sendMessage(message.from, {
      text: `❌ Error: ${err?.message || err}`,
    });
  }
});
