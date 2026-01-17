import yts from "yt-search";
import { Module } from "../lib/plugins.js";

Module({
  command: "bata",
  package: "search",
  description: "Search YouTube and show video information",
})(async (message, match) => {
  try {
    if (!match) {
      return await message.send("❌ *Search text dao*\n\nExample:\n.yts kesariya");
    }

    await message.react("🔍");

    // YouTube search
    const res = await yts(match);
    if (!res.videos || res.videos.length === 0) {
      return await message.send("❌ Kono video paoa jay nai");
    }

    // First video
    const v = res.videos[0];

    // Message text
    const caption = `
🎬 *YouTube Video Found*

📌 *Title:* ${v.title}
👤 *Channel:* ${v.author.name}
⏱️ *Duration:* ${v.timestamp}
👁️ *Views:* ${v.views.toLocaleString()}
📅 *Uploaded:* ${v.ago}

🔗 *Link:* ${v.url}
    `.trim();

    // Send with thumbnail
    await message.send({
      image: { url: v.thumbnail },
      caption,
    });

    await message.react("✅");
  } catch (err) {
    console.error("[YTS PLUGIN ERROR]", err);
    await message.send("⚠️ Error hoise, abar try koro");
  }
});
