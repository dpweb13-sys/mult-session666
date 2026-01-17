import yts from "yt-search";
import ytdl from "@distube/ytdl-core";
import fs from "fs";
import path from "path";
import { Module } from "../lib/plugins.js";

const tempDir = "./temp";
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

Module({
  command: "bat",
  package: "youtube",
  description: "Play song from YouTube",
})(async (message, match) => {
  try {
    if (!match) {
      return message.send("❌ Song name dao\n\n.play kesariya");
    }

    await message.react("🔍");

    const res = await yts(match);
    if (!res.videos.length) {
      return message.send("❌ Kono result paoa jay nai");
    }

    const v = res.videos[0];

    await message.send({
      image: { url: v.thumbnail },
      caption: `
🎵 *Now Playing*

📌 ${v.title}
👤 ${v.author.name}
⏱️ ${v.timestamp}

⬇️ Downloading audio...
      `.trim(),
    });

    const audioPath = path.join(tempDir, `${Date.now()}.mp3`);

    const stream = ytdl(v.url, {
      filter: "audioonly",
      quality: "highestaudio",
      highWaterMark: 1 << 25
    });

    const write = fs.createWriteStream(audioPath);
    stream.pipe(write);

    write.on("finish", async () => {
      const size = fs.statSync(audioPath).size;

      if (size > 16 * 1024 * 1024) {
        fs.unlinkSync(audioPath);
        return message.send("❌ Audio WhatsApp limit cross korse");
      }

      await message.send({
        audio: fs.readFileSync(audioPath),
        mimetype: "audio/mpeg",
        fileName: `${v.title}.mp3`
      });

      fs.unlinkSync(audioPath);
      await message.react("🎧");
    });

    stream.on("error", e => {
      console.error("Stream error:", e);
      message.send("⚠️ Stream error");
    });

  } catch (e) {
    console.error("[PLAY ERROR]", e);
    message.send("⚠️ Play failed");
  }
});
