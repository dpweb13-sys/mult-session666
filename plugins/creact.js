import { Module } from "../lib/plugins.js";

Module({
  command: "creact",
  package: "channel"
})(async (message) => {
  
  // Check if replied to channel post
  if (!message.quoted?.key?.remoteJid?.endsWith("@newsletter")) {
    return message.send("❌ Reply to a Channel post first!
✅ Reply → `.creact`");
  }

  try {
    await message.conn.sendMessage(message.quoted.key.remoteJid, {
      react: { 
        text: "❤️", 
        key: message.quoted.key 
      }
    });
    await message.send("✅ ❤️ Successfully reacted to channel post!");
  } catch (error) {
    console.error("React error:", error);
    await message.send("❌ Reaction failed! Bot needs to be channel admin");
  }
});
