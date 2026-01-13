import { Module } from "../lib/plugins.js";

Module({
  command: ["newsletterjid", "njid"],
  desc: "Get WhatsApp Newsletter JID",
  category: "tools",
  usage: ".newsletterjid <invite link | code>"
}, async (message, match, sock) => {
  try {
    if (!match) {
      return await message.reply(
        "❌ *Invite link বা code দাও*\n\nExample:\n.newsletterjid https://whatsapp.com/channel/AbCdEf123"
      );
    }

    // clean input
    let text = match.trim();

    // link হলে code extract
    let code = text.includes("/")
      ? text.split("/").filter(Boolean).pop()
      : text;

    if (!code || code.length < 5)
      return await message.reply("❌ *Invalid invite code*");

    const meta = await sock.newsletterMetadata("invite", code);

    if (!meta || !meta.id)
      return await message.reply("❌ *Newsletter JID পাওয়া যায়নি*");

    await message.reply(
      `✅ *Newsletter JID Found*\n\n📢 JID:\n\`\`\`${meta.id}\`\`\``
    );

  } catch (err) {
    await message.reply("❌ *Invalid / Expired Newsletter Invite*");
  }
});
