/* ----------------- PLAY (MP3 | API BASED | FIXED) ----------------- */
Module({
  command: "bay",
  package: "downloader",
  description: "Play song using Search API + Download API (MP3)",
})(async (message, match) => {
  const q = (match || "").trim();
  if (!q)
    return message.send(
      "🎵 Please provide a song name or YouTube link!\n\nExample: .play tomake chai"
    );

  try {
    await message.react("⏳");

    let ytLink = q;
    let title = q;
    let thumbnail;

    const urlRegex = /(?:youtube\.com\/.*v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

    // 🔍 NAME → SEARCH API
    if (!urlRegex.test(q)) {
      await message.react("🔍");

      const search = await axios.get(
        "https://api.zaynix.biz.id/search/youtube",
        { params: { q } }
      );

      if (!search.data?.status || !search.data.result?.length) {
        await message.react("❌");
        return message.send("❌ Song not found.");
      }

      const first = search.data.result[0];
      ytLink = first.link;
      title = first.title;
      thumbnail = first.imageUrl;
    }

    // 🎧 DOWNLOAD API
    await message.react("⬇️");

    const down = await axios.get(
      "https://api-aswin-sparky.koyeb.app/api/downloader/song",
      { params: { search: ytLink } }
    );

    if (!down.data?.status || !down.data.data?.url) {
      await message.react("❌");
      return message.send("❌ Download failed.");
    }

    const audioUrl = down.data.data.url;
    const songTitle = down.data.data.title || title;

    // ⬇️ TEMP DOWNLOAD (same as your old working method)
    const tempPath = await downloadToTemp(audioUrl, ".mp3");
    const buffer = fs.readFileSync(tempPath);

    // 🖼️ externalAdReply (same style)
    const contextInfo = {};
    if (thumbnail) {
      contextInfo.externalAdReply = {
        title: songTitle,
        body: "YouTube MP3",
        thumbnail: await axios
          .get(thumbnail, { responseType: "arraybuffer" })
          .then((r) => Buffer.from(r.data))
          .catch(() => undefined),
        sourceUrl: ytLink,
        mediaType: 2,
      };
    }

    // 🎵 SEND MP3 (NOT DOCUMENT)
    await message.conn.sendMessage(
      message.from,
      {
        audio: buffer,
        mimetype: "audio/mpeg",
        fileName: `${songTitle.replace(/[^\w\s]/gi, "")}.mp3`,
        contextInfo,
      },
      {
        quoted: makeGiftQuote("𝐒uɱꪸ๏η 𝐃ɛ̚𝐯'ʬ 合", message.bot),
      }
    );

    await message.react("✅");
    safeUnlink(tempPath);
  } catch (err) {
    console.error("PLAY ERROR:", err);
    await message.react("❌");
    return message.send("❌ Something went wrong while playing the song.");
  }
});
