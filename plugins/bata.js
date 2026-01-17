import yts from "yt-search";
import { createStream } from "yt-streamer";
import fs from "fs";
import path from "path";
import { Module } from "../lib/plugins.js";

const tempDir = "./temp";
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

Module({
  command: "play",
  package: "youtube",
  description: "Play song from YouTube (search + audio)",
})(async (message, match) => {
  try {
    if (!match) {
      return message.send(
        "❌ *Song name dao*\n\nExample:\n.play kesariya"
      );
    }

    await message.react("🔍");

    // 1️⃣ YouTube Search
    const res = await yts(match);
    if (!res.videos || !res.videos.length) {
      return message.send("❌ Kono result paoa jay nai");
    }

    const v = res.videos[0];

    // 2️⃣ Send info first
    const caption = `
🎵 *Now Playing*

📌 *Title:* ${v.title}
👤 *Channel:* ${v.author.name}
⏱️ *Duration:* ${v.timestamp}
👁️ *Views:* ${v.views.toLocaleString()}
📅 *Uploaded:* ${v.ago}

⬇️ *Downloading audio...*
    `.trim();

    await message.send({
      image: { url: v.thumbnail },
      caption,
    });

    // 3️⃣ Audio Download (stream)
    await message.react("⬇️");

    const audioPath = path.join(tempDir, `${Date.now()}.mp3`);
    const stream = await createStream(v.url, { type: "audio" });

    const write = fs.createWriteStream(audioPath);
    stream.pipe(write);

    write.on("finish", async () => {
      const size = fs.statSync(audioPath).size;

      // WhatsApp audio limit ~16MB
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
  } catch (err) {
    console.error("[PLAY PLUGIN ERROR]", err);
    await message.send("⚠️ Error hoise, abar try koro");
  }
});
