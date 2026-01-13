import { Module } from "../lib/plugins.js";

Module({
  command: "creact",
  package: "channel",
  description: "React on channel post (reply / post link + emoji)"
})(async (message, match) => {
  let targetKey, targetJid;

  // 🔹 Helper: Extract emoji from match (after removing URL)
  const getEmoji = (input) => {
    if (!input || typeof input !== "string") return "❤️";
    return input.replace(/https?://S+/g, "").trim() || "❤️";
  };

  // 🔹 1) Reply method - Channel post check
  if (message.quoted?.key) {
    if (!message.quoted.key.remoteJid?.endsWith("@newsletter")) {
      return message.send("❌ Reply message টি Channel post নয়!

📝 Reply করো Channel post এ অথবা full link দাও");
    }
    targetKey = message.quoted.key;
    targetJid = message.quoted.key.remoteJid;
  }

  // 🔹 2) Link + Emoji method
  else if (match && typeof match === "string" && match.trim()) {
    const cleanMatch = match.trim();

    // Channel post link: https://whatsapp.com/channel/0029VaXXX/123
    if (cleanMatch.includes("whatsapp.com/channel/")) {
      const parts = cleanMatch.split("/");
      if (parts.length < 4) {
        return message.send("❌ Invalid channel post link format!

✅ Example: .creact https://whatsapp.com/channel/0029VaXXX/123 🔥");
      }

      const channelId = parts[parts.length - 2];
      const msgId = parts[parts.length - 1];

      // Validate channel ID format (starts with 0029Va)
      if (!channelId.startsWith("0029Va")) {
        return message.send("❌ Invalid channel ID! Channel ID শুরু হবে 0029Va দিয়ে");
      }

      targetJid = `${channelId}@newsletter`;
      targetKey = {
        remoteJid: targetJid,
        id: msgId,
        fromMe: false,
        participant: targetJid  // Channel reactions এ কখনও কখনও দরকার হয়
      };
    } else {
      return message.send("❌ Valid channel post link দাও!

✅ Example:
.creact https://whatsapp.com/channel/0029VaXXX/123 🔥");
    }
  }

  // 🔹 No input
  else {
    return message.send(
      `❌ Reply করো অথবা Channel post link + emoji দাও!

` +
      `📋 Examples:
` +
      `• Reply করে: .creact 🔥
` +
      `• Link দিয়ে: .creact https://whatsapp.com/channel/0029VaXXX/123 ❤️

` +
      `✨ Supported: 🔥 ❤️ 👍 👎 😍 😂`
    );
  }

  // 🔸 Send reaction
  const emoji = getEmoji(match);
  
  try {
    await message.client.sendMessage(targetJid, {
      react: {
        text: emoji,
        key: targetKey
      }
    });
    await message.send(`✅ ${emoji} reacted successfully on channel post!`);
  } catch (error) {
    console.error("React error:", error);
    await message.send("❌ Reaction failed! Check link or try replying directly.");
  }
});
