import axios from "axios";
import yts from "yt-search";
import { Module } from "../lib/plugins.js";

Module({
  command: "play",
  package: "youtube",
  description: "Play song from YouTube (API based)",
})(async (message, match) => {
  try {
    if (!match) {
      return message.send(
        "❌ *Song name dao*\n\nExample:\n.play love nwantiti"
      );
    }

    // 🔍 Search reaction
    await message.react("🔍");

    // 1️⃣ YouTube search
    const res = await yts(match);
    if (!res.videos || res.videos.length === 0) {
      return message.send("❌ Kono video paoa jay nai");
    }

    const video = res.videos[0];

    // 2️⃣ Send info message
    await message.send({
      image: { url: video.thumbnail },
      caption: `
🎵 *Now Playing*

📌 *Title:* ${video.title}
👤 *Channel:* ${video.author.name}
⏱️ *Duration:* ${video.timestamp}

⬇️ *Downloading audio...*
      `.trim(),
    });

    // 3️⃣ Call your API with YouTube link
    const apiUrl =
      "https://api-aswin-sparky.koyeb.app/api/downloader/song?search=" +
      encodeURIComponent(video.url);

    const { data } = await axios.get(apiUrl, { timeout: 30000 });

    if (!data || !data.status || !data.data?.url) {
      return message.send("❌ Audio download failed");
    }

    // 4️⃣ Send audio using direct URL (RAM safe)
    await message.send({
      audio: { url: data.data.url },
      mimetype: "audio/mpeg",
      fileName: `${data.data.title || video.title}.mp3`,
      contextInfo: {
        externalAdReply: {
          title: data.data.title || video.title,
          body: "YouTube Audio",
          mediaType: 2,
          sourceUrl: video.url,
          thumbnailUrl: video.thumbnail
        }
      }
    });

    await message.react("🎧");

  } catch (err) {
    console.error("[PLAY API ERROR]", err);
    await message.send("⚠️ Play failed, abar try koro");
  }
});
