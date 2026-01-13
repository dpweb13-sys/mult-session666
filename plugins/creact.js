import { Module } from "../lib/plugins.js";

Module({
  command: "creact",
  package: "channel",
  description: "React on channel post"
})(async (message) => {
  
  // Reply check করো
  if (!message.quoted?.key?.remoteJid?.endsWith("@newsletter")) {
    return message.send(
      "❌ Channel post এ reply করো!

" +
      "✅ [Channel Post এ Reply] → `.creact`"
    );
  }

  try {
    await message.conn.sendMessage(message.quoted.key.remoteJid, {
      react: { 
        text: "❤️", 
        key: message.quoted.key 
      }
    });
    await message.send("✅ ❤️ reacted successfully!");
  } catch (error) {
    console.error("React error:", error);
    await message.send("❌ Reaction failed!");
  }
});
