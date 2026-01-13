import { Module } from "../lib/plugins.js";

Module({
  command: "creact",
  package: "channel"
})(async (message) => {
  console.log("CREACT triggered");
  
  if (!message.quoted?.key?.remoteJid?.endsWith("@newsletter")) {
    return message.send("❌ Reply to Channel post first!");
  }

  try {
    await message.conn.sendMessage(message.quoted.key.remoteJid, {
      react: { text: "❤️", key: message.quoted.key }
    });
    await message.send("✅ ❤️ Reacted successfully!");
  } catch (error) {
    console.error("React error:", error);
    await message.send("❌ Reaction failed!");
  }
});
