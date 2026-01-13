import { Module } from "../lib/plugins.js";
import axios from "axios";

Module({
  command: "gud",
  package: "media",
  description: "YouTube song download"
})(async (message, { text }) => {
  
  if (!text) {
    return message.send(
      `🎵 **YouTube Song Downloader**

` +
      `🔗 **Link:** `.song https://youtu.be/xxx`
` +
      `🔍 **Query:** `.song song name`

` +
      `✅ **Examples:**
` +
      `• `.song https://youtu.be/xg_6wiN-GNE`
` +
      `• `.song tomake chai`
` +
      `• `.song tumi je amar``
    );
  }

  await message.send("🔎 Processing...");

  try {
    let downloadUrl;
    
    // 🔹 1) YouTube LINK
    if (text.includes("youtube.com") || text.includes("youtu.be")) {
      const cleanUrl = text.split('&')[0]; // Remove ?si= params
      const apiUrl = `https://api-aswin-sparky.koyeb.app/api/downloader/song?search=${encodeURIComponent(cleanUrl)}`;
      
      const { data } = await axios.get(apiUrl);
      
      if (!data.status) {
        return message.send("❌ API error!");
      }
      
      downloadUrl = data.data.url;
    } 
    // 🔹 2) SEARCH QUERY (convert to YouTube search)
    else {
      // YouTube search URL তৈরি করো
      const searchQuery = encodeURIComponent(`${text} full song audio`);
      const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;
      
      // প্রথম result এর link নিয়ে download
      const apiUrl = `https://api-aswin-sparky.koyeb.app/api/downloader/song?search=${encodeURIComponent(youtubeSearchUrl)}`;
      
      const { data } = await axios.get(apiUrl);
      
      if (!data.status) {
        return message.send("❌ No song found!");
      }
      
      downloadUrl = data.data.url;
    }

    // 🔸 Send Audio
    await message.conn.sendMessage(message.from, {
      audio: { url: downloadUrl },
      mimetype: "audio/mpeg",
      fileName: "song.mp3"
    }, { quoted: message });

    await message.send("✅ Song downloaded successfully! 🎵");

  } catch (error) {
    console.error("Song error:", error.message);
    await message.send("❌ Download failed! Try valid YouTube link.");
  }
});
