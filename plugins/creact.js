import os from "os";
import { Module } from "../lib/plugins.js";

Module({
  command: ["creact", "react"],  // Multiple aliases
  package: "channel",
  description: "React on channel post (reply / link)"
})(async (message, { text }) => {  // Fixed: { text } instead of match
  
  let targetKey, targetJid;

  // 🔹 1) Reply method - Channel post check
  if (message.quoted?.key?.remoteJid?.endsWith("@newsletter")) {
    targetKey = message.quoted.key;
    targetJid = message.quoted.key.remoteJid;
  }

  // 🔹 2) Link method
  else {
    const input = (text || "").trim();
    if (!input) {
      return message.send(
        `❌ Reply করো Channel post এ অথবা link দাও!

` +
        `📋 Examples:
` +
        `• Reply: `.creact 🔥`
` +
        `• Link: `.creact https://whatsapp.com/channel/0029VaXXX/123 ❤️`

` +
        `✨ 🔥 ❤️ 👍 👎 😍 😂`
      );
    }

    if (input.includes("whatsapp.com/channel/")) {
      const parts = input.split("/");
      if (parts.length < 4) {
        return message.send("❌ Invalid link!
✅ `.creact https://whatsapp.com/channel/0029VaXXX/123 🔥`");
      }

      const channelId = parts[parts.length - 2];
      const msgId = parts[parts.length - 1];

      if (!channelId.startsWith("0029Va")) {
        return message.send("❌ Invalid channel ID! 0029Va দিয়ে শুরু হবে");
      }

      targetJid = `${channelId}@newsletter`;
      targetKey = {
        remoteJid: targetJid,
        id: msgId,
        fromMe: false
      };
    } else {
      return message.send("❌ Valid Channel link দাও!
.ex: `.creact https://whatsapp.com/channel/0029VaXXX/123`");
    }
  }

  // 🔸 Get emoji (link থেকে extract or default)
  const emoji = text?.replace(/https?://S+/g, "").trim() || "❤️";

  try {
    await message.conn.sendMessage(targetJid, {  // Fixed: message.conn
      react: {
        text: emoji,
        key: targetKey
      }
    });
    
    await message.send(`✅ ${emoji} reacted successfully! ✨`);
    
  } catch (error) {
    console.error("❌ React error:", error);
    await message.send("❌ Reaction failed! Reply method try করো বা console check করো।");
  }
});
