import { Module } from "../lib/plugins.js";
import { db } from "../lib/client.js";

Module({
  command: "mode",
  package: "owner",
  description: "Set bot mode private / public (bot number only)",
})(async (message, match) => {

  // 🔐 ONLY BOT NUMBER CAN CHANGE MODE
  if (!message.isFromMe) return;

  const input = (match || "").trim().toLowerCase();
  const key = "bot_mode";

  // CHANGE MODE
  if (input === "private" || input === "public") {
    db.setHot(message.sessionId, key, input);
    return message.send(
      `✅ Bot mode set to *${input.toUpperCase()}*`
    );
  }

  // SHOW CURRENT MODE
  const mode = db.get(message.sessionId, key, "public");
  return message.send(
    `⚙️ Bot Mode\nCurrent: ${
      mode === "private" ? "🔒 PRIVATE" : "🌍 PUBLIC"
    }\n\nUse:\n• mode private\n• mode public`
  );
});
