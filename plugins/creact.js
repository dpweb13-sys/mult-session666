import os from "os";
import { Module } from "../lib/plugins.js";

Module({
  command: ["creact", "react"],
  package: "channel",
  description: "React on channel post"
})(async (message, { text }) => {
  let targetKey, targetJid;

  // Reply check
  if (message.quoted?.key?.remoteJid?.endsWith("@newsletter")) {
    targetKey = message.quoted.key;
    targetJid = message.quoted.key.remoteJid;
  }
  // Link check
  else {
    const input = (text || "").trim();
    if (!input) {
      return message.send(
        "❌ Reply করো অথবা link দাও!

" +
        "✅ `.creact https://whatsapp.com/channel/0029VaXXX/123 🔥`"
      );
    }

    if (input.includes("whatsapp.com/channel/")) {
      const parts = input.split("/");
      const channelId = parts[parts.length - 2];
      const msgId = parts[parts.length - 1];
      
      targetJid = `${channelId}@newsletter`;
      targetKey = { remoteJid: targetJid, id: msgId, fromMe: false };
    } else {
      return message.send("❌ Valid link দাও!");
    }
  }

  const emoji = text?.replace(/https?://[^\\s]+/g, "").trim() || "❤️";

  try {
    await message.conn.sendMessage(targetJid, {
      react: { text: emoji, key: targetKey }
    });
    await message.send(`✅ ${emoji} reacted!`);
  } catch (error) {
    console.error("React error:", error);
    await message.send("❌ Failed!");
  }
});
