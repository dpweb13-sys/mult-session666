import { Module } from "../lib/plugins.js";
import axios from "axios";

const SEARCH_API = "https://api.zaynix.biz.id/search/youtube";
const DOWNLOAD_API = "https://api-aswin-sparky.koyeb.app/api/downloader/song";

Module({
  command: "bal",
  package: "media",
  description: "Play song (Search API + Download API)",
})(async (message, match) => {
  const input = match?.trim();
  if (!input) return message.reply("❌ Song name বা YouTube link দাও");

  let ytLink;
  let title = "Playing song";

  try {
    // 🔗 URL directly
    if (input.startsWith("http")) {
      ytLink = input;
    } 
    // 🔍 Name → Search API
    else {
      const searchRes = await axios.get(SEARCH_API, {
        params: { q: input },
      });

      if (
        !searchRes.data.status ||
        !searchRes.data.result ||
        !searchRes.data.result.length
      ) {
        return message.reply("❌ Song পাওয়া যায়নি");
      }

      const first = searchRes.data.result[0];
      ytLink = first.link;
      title = first.title;
    }

    // 🎧 Downloader API
    const downRes = await axios.get(DOWNLOAD_API, {
      params: { search: ytLink },
    });

    if (!downRes.data.status || !downRes.data.data?.url) {
      return message.reply("❌ Download failed");
    }

    const audioUrl = downRes.data.data.url;
    const songTitle = downRes.data.data.title || title;

    // ⬇️ Stream audio
    const audioStream = await axios.get(audioUrl, {
      responseType: "stream",
    });

    await message.reply(
      { stream: audioStream.data },
      "audio",
      {
        mimetype: "audio/mpeg",
        caption: `🎵 *${songTitle}*`,
      }
    );
  } catch (err) {
    console.error("PLAY ERROR:", err);
    message.reply("❌ Error while playing song");
  }
});
