import axios from "axios";
import fs from "fs";
import path from "path";
import { downloadContentFromMessage } from "@whiskeysockets/baileys";
import { Module } from "../lib/plugins.js";
import { uploadImage } from "../lib/uploader.js"; // telegra.ph function

Module({
  command: "edit",
  description: "Edit replied image with prompt",
  category: "tools"
})(async (m, { conn, text }) => {
  if (!m.quoted) return m.reply("❌ Reply to an image");
  if (!m.quoted.mimetype.startsWith("image/"))
    return m.reply("❌ Reply to an image only");
  if (!text) return m.reply("❌ Write edit prompt");

  m.reply("⏳ Uploading and editing...");

  const stream = await downloadContentFromMessage(
    m.quoted.message.imageMessage,
    "image"
  );

  let buffer = Buffer.from([]);
  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk]);
  }

  const tmpPath = path.join("./temp", `${Date.now()}.jpg`);
  fs.writeFileSync(tmpPath, buffer);

  try {
    const publicUrl = await uploadImage(tmpPath);

    const { data } = await axios.post(
      "https://api.danzy.web.id/api/tools/nanobanana",
      { img: publicUrl, prompt: text }
    );

    if (!data.status) throw "Edit failed";

    await conn.sendMessage(
      m.chat,
      { image: { url: data.result }, caption: "✅ Done!" },
      { quoted: m }
    );
  } catch {
    m.reply("❌ Failed to edit");
  } finally {
    fs.unlinkSync(tmpPath);
  }
});
