import axios from "axios";
import fs from "fs";
import { exec } from "child_process";
import { Module } from "../lib/plugins.js";

Module({
  command: "channelsong", // ✅ একটাই নাম
  package: "channel",
  description: "Owner only: post song to channel (auto m4a)",
})(async (message, match) => {
  try {
    // 🔐 OWNER CHECK
    if (!message.isOwner) {
      return message.send("❌ Ei command ta sudhu bot owner use korte parbe");
    }

    if (!match) {
      return message.send(
        "❌ Use:\n.channelsong <channel_jid> <song_url>"
      );
    }

    const args = match.split(" ");
    const channelJid = args[0];
    const songUrl = args[1];

    if (!channelJid || !songUrl) {
      return message.send(
        "❌ Use:\n.channelsong <channel_jid> <song_url>"
      );
    }

    if (!channelJid.endsWith("@newsletter")) {
      return message.send("❌ Eta valid channel JID na");
    }

    await message.react("⏬");

    const input = `./tmp/input_${Date.now()}`;
    const output = `./tmp/output_${Date.now()}.m4a`;

    // 1️⃣ Download song (any format)
    const res = await axios.get(songUrl, {
      responseType: "arraybuffer",
      timeout: 60000,
    });
    fs.writeFileSync(input, res.data);

    // 2️⃣ Convert ANY format → M4A (AAC)
    await new Promise((resolve, reject) => {
      exec(
        `ffmpeg -y -i ${input} -c:a aac -b:a 128k ${output}`,
        (err) => (err ? reject(err) : resolve())
      );
    });

    // 3️⃣ Send to channel
    await message.sock.sendMessage(channelJid, {
      audio: fs.readFileSync(output),
      mimetype: "audio/mp4",
      ptt: false,
    });

    await message.react("✅");
    await message.send("🎶 Song channel e post hoye geche");

    // cleanup
    fs.unlinkSync(input);
    fs.unlinkSync(output);

  } catch (err) {
    console.error("[CHANNEL SONG ERROR]", err);
    await message.send("❌ Song post failed");
  }
});
