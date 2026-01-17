import yts from "yt-search";
import ytdl from "ytdl-core";
import fs from "fs";
import path from "path";
import { Module } from "../lib/plugins.js";

const __dirname = process.cwd();
const tempDir = path.join(__dirname, "temp");

if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

Module({
  command: "play",
  package: "youtube",
  description: "Search YouTube and play audio",
})(async (message, match) => {
  try {
    if (!match) {
      return message.send(
        "❌ *Song name dao*\n\nExample:\n.play kesariya"
      );
    }

    await message.react("🔍");

    // 🔍 Search
    const res = await yts(match);
    if (!res.videos || res.videos.length === 0) {
      return message.send("❌ Kono result paoa jay nai");
    }

    const v = res.videos[0];

    // 📄 Info message
    await message.send({
      image: { url: v.thumbnail },
      caption: `
🎵 *Now Playing*

📌 *Title:* ${v.title}
👤 *Channel:* ${v.author.name}
⏱️ *Duration:* ${v.timestamp}
👁️ *Views:* ${v.views.toLocaleString()}

⬇️ Downloading audio...
      `.trim(),
    });

    // 🎧 Download audio
    const audioPath = path.join(tempDir, `${Date.now()}.mp3`);

    const stream = ytdl(v.url, {
      filter: "audioonly",
      quality: "highestaudio",
      highWaterMark: 1 << 25,
    });

    const write = fs.createWriteStream(audioPath);
    stream.pipe(write);

    write.on("finish", async () => {
      const size = fs.statSync(audioPath).size;

      // WhatsApp audio limit (~16MB)
      if (size > 16 * 1024 * 1024) {
        fs.unlinkSync(audioPath);
        return message.send("❌ Audio size WhatsApp limit cross korse");
      }

      await message.send({
        audio: fs.readFileSync(audioPath),
        mimetype: "audio/mpeg",
        fileName: `${v.title}.mp3`,
      });

      fs.unlinkSync(audioPath);
      await message.react("🎧");
    });

    stream.on("error", (err) => {
      console.error("Stream error:", err);
      message.send("⚠️ Audio download error");
    });

  } catch (err) {
    console.error("[PLAY PLUGIN ERROR]", err);
    await message.send("⚠️ Error hoise, abar try koro");
  }
});
