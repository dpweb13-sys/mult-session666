import { Module } from "../lib/plugins.js";
import { getTheme } from "../Themes/themes.js";
import { db } from "../lib/client.js";


Module({
  command: "mode", // only .mode
  package: "owner",
  description: "Set bot mode private / public (bot number only)",
})(async (message, match) => {

  // 🔐 ONLY BOT NUMBER CAN USE
  if (!message.isFromMe) {
    return; // silently ignore
  }

  const input = (match || "").trim().toLowerCase();
  const key = "bot_mode";

  // ✅ CHANGE MODE
  if (input === "private" || input === "public") {
    try {
      db.setHot(message.sessionId, key, input);
      return message.send(
        `✅ Bot mode changed to *${input.toUpperCase()}*`
      );
    } catch (e) {
      return message.send("❌ Failed to change bot mode");
    }
  }

  // 📊 SHOW CURRENT MODE
  const mode = db.get(message.sessionId, key, "public");
  return message.send(
    `⚙️ *Bot Mode*\n` +
    `Current: ${mode === "private" ? "🔒 PRIVATE" : "🌍 PUBLIC"}\n\n` +
    `Use:\n` +
    `• mode private\n` +
    `• mode public`
  );
});
