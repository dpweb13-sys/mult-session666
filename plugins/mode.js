import { Module } from "../lib/plugins.js";
import { getTheme } from "../Themes/themes.js";
import { db } from "../lib/client.js";

const theme = getTheme();

Module({
  command: ["mode", "botmode"],
  package: "owner",
  description: "Set bot mode private / public",
})(async (message, match) => {
  // 🔐 only owner
  if (!message.isFromMe) return message.send(theme.isfromMe);

  const input = (match || "").trim().toLowerCase();
  const key = "bot_mode";

  // ✅ SET MODE
  if (input === "private" || input === "public") {
    await message.react("⏳");
    try {
      db.setHot(message.sessionId, key, input);
      await message.react("✅");
      return message.send(
        `🤖 *Bot mode changed to* ➜ *${input.toUpperCase()}*`
      );
    } catch (e) {
      await message.react("❌");
      return message.send("❌ Failed to update bot mode");
    }
  }

  // 📊 SHOW CURRENT MODE
  const mode = db.get(message.sessionId, key, "public");
  return message.send(
    `⚙️ *Bot Mode*\n` +
    `• Current: ${mode === "private" ? "🔒 PRIVATE" : "🌍 PUBLIC"}\n\n` +
    `Use:\n` +
    `• mode private\n` +
    `• mode public`
  );
});
