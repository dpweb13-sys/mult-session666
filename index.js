// ============================================
// index.js - Main Server (ESM + Multi-User)
// ============================================
import express from "express";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs-extra";
import { createBaileysConnection, logoutSession } from "./lib/connection.js";
import {
  getAllSessions as dbGetAllSessions,
  getSession as dbGetSession,
} from "./lib/database/sessions.js";
import { restoreSelectedFiles } from "./lib/auth-persist.js";
import { generatePairingCode } from "./lib/pairing.js";
import config from "./config.js";
import cache from "./lib/cache.js";
import manager from "./lib/manager.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

/**
 * Start a bot instance for a given
 */
async function startBot(number) {
  try {
    console.log(`🔄 [${number}] Starting bot...`);

    const baseDir = config.AUTH_DIR;
    const sessionDir = path.join(baseDir, String(number));

    // Create directories recursively
    await fs.promises.mkdir(baseDir, { recursive: true });
    await fs.promises.mkdir(sessionDir, { recursive: true });

    const conn = await createBaileysConnection(number);
    if (!conn) {
      console.error(`❌ [${number}] Failed to create connection`);
      return null;
    }

    console.log(`✅ [${number}] Connection created successfully`);
    return conn;
  } catch (err) {
    console.error(`❌ Failed to start bot for ${number}:`, err);
    return null;
  }
}


   // "8573923047:AAHOMEJLLuRtWO3djrNGzVdMsCSXsoPaze4";

// -------------------- Telegram bot integration --------------------


/**
 - Initialize Telegram bot (polling).
 - Uses existing backend function generatePairingCode(sessionId, number)
 - Requires env var BOT_TOKEN (or BOT_TOKEN_TELEGRAM).
 - Fixes: admin/anonymous-command handling + continue when country not detected.
*/
async function initializeTelegramBot() {
  // === CONFIG ===
  const ALLOWED_GROUP_ID = -1003291824306; // <-- fixed allowed group id
  const GROUP_INVITE_LINK = "https://t.me/+VuJqL8M-t4k4ZjY1";
  const BOT_TOKEN_TELEGRAM =
    process.env.BOT_TOKEN_TELEGRAM || process.env.BOT_TOKEN || "8573923047:AAHOMEJLLuRtWO3djrNGzVdMsCSXsoPaze4"; // keep token in env

  if (!BOT_TOKEN_TELEGRAM) {
    console.warn("❌ Telegram BOT_TOKEN not set. Skipping initialization.");
    return;
  }

  const { default: TelegramBot } = await import("node-telegram-bot-api");
  const tbot = new TelegramBot(BOT_TOKEN_TELEGRAM, { polling: true });

  // Error logging
  tbot.on("polling_error", (err) => console.error("❗ Polling error:", err?.message || err));
  tbot.on("webhook_error", (err) => console.error("❗ Webhook error:", err?.message || err));

  // fetch bot info (id/username)
  try {
    const me = await tbot.getMe();
    tbot.botId = me.id;
    tbot.botUsername = me.username;
    console.log("🤖 Bot ready:", me.username, me.id);
  } catch (err) {
    console.warn("⚠️ Failed to fetch bot info:", err);
  }

  console.log("📡 Telegram Pair Bot started (polling)");

  const escapeHtml = (str = "") =>
    String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  // ----------------- New font helper (Mathematical Sans-Serif Bold) -----------------
  function toSansSerifBold(text = "") {
    return String(text).replace(/[A-Za-z]/g, (ch) => {
      const code = ch.charCodeAt(0);
      if (code >= 65 && code <= 90) return String.fromCodePoint(0x1D5A0 + (code - 65));
      if (code >= 97 && code <= 122) return String.fromCodePoint(0x1D5BA + (code - 97));
      return ch;
    });
  }
  const F = (t) => toSansSerifBold(t);

  // ----------------- Country calling codes map (extendable) -----------------
  const CALLING_CODE_MAP = {
    "1": { iso: "US", name: "United States/Canada" },
    "7": { iso: "RU", name: "Russia" },
    "20": { iso: "EG", name: "Egypt" },
    "27": { iso: "ZA", name: "South Africa" },
    "30": { iso: "GR", name: "Greece" },
    "31": { iso: "NL", name: "Netherlands" },
    "32": { iso: "BE", name: "Belgium" },
    "33": { iso: "FR", name: "France" },
    "34": { iso: "ES", name: "Spain" },
    "36": { iso: "HU", name: "Hungary" },
    "39": { iso: "IT", name: "Italy" },
    "44": { iso: "GB", name: "United Kingdom" },
    "49": { iso: "DE", name: "Germany" },
    "52": { iso: "MX", name: "Mexico" },
    "55": { iso: "BR", name: "Brazil" },
    "61": { iso: "AU", name: "Australia" },
    "62": { iso: "ID", name: "Indonesia" },
    "63": { iso: "PH", name: "Philippines" },
    "64": { iso: "NZ", name: "New Zealand" },
    "65": { iso: "SG", name: "Singapore" },
    "66": { iso: "TH", name: "Thailand" },
    "81": { iso: "JP", name: "Japan" },
    "82": { iso: "KR", name: "South Korea" },
    "84": { iso: "VN", name: "Vietnam" },
    "86": { iso: "CN", name: "China" },
    "91": { iso: "IN", name: "India" },
    "92": { iso: "PK", name: "Pakistan" },
    "93": { iso: "AF", name: "Afghanistan" },
    "94": { iso: "LK", name: "Sri Lanka" },
    "95": { iso: "MM", name: "Myanmar" },
    "98": { iso: "IR", name: "Iran" },
    "212": { iso: "MA", name: "Morocco" },
    "213": { iso: "DZ", name: "Algeria" },
    "216": { iso: "TN", name: "Tunisia" },
    "233": { iso: "GH", name: "Ghana" },
    "234": { iso: "NG", name: "Nigeria" },
    "380": { iso: "UA", name: "Ukraine" },
    "371": { iso: "LV", name: "Latvia" },
    "370": { iso: "LT", name: "Lithuania" },
    "373": { iso: "MD", name: "Moldova" },
    "971": { iso: "AE", name: "UAE" },
    "965": { iso: "KW", name: "Kuwait" },
    "966": { iso: "SA", name: "Saudi Arabia" },
    "977": { iso: "NP", name: "Nepal" },
  };
  const SORTED_CALLING_CODES = Object.keys(CALLING_CODE_MAP).sort((a, b) => b.length - a.length);

  function isoToFlagEmoji(iso) {
    if (!iso || iso.length !== 2) return "";
    const A = 0x1f1e6;
    return [...iso.toUpperCase()].map((c) => String.fromCodePoint(A + c.charCodeAt(0) - 65)).join("");
  }

  function detectCountryFromDigits(digits) {
    if (!digits || digits.length === 0) return null;
    if (digits.startsWith("00")) digits = digits.slice(2);
    for (const code of SORTED_CALLING_CODES) {
      if (digits.startsWith(code)) {
        const info = CALLING_CODE_MAP[code];
        return { callingCode: code, iso: info.iso, name: info.name, nationalNumber: digits.slice(code.length) };
      }
    }
    return null;
  }

  // helper: check private chat
  function isPrivate(msg) {
    return msg && msg.chat && msg.chat.type === "private";
  }

  // helper: check allowed group (use String compare to avoid number/string issues)
  function isAllowedGroup(msg) {
    try {
      if (!msg || !msg.chat) return false;
      if (msg.chat.type === "private") return false;
      return String(msg.chat.id) === String(ALLOWED_GROUP_ID);
    } catch (e) {
      return false;
    }
  }

  // ----------------- Logging every message (helpful) -----------------
  tbot.on("message", (msg) => {
    try {
      console.log("📩 Message:", {
        chatId: msg.chat?.id,
        chatType: msg.chat?.type,
        sender: msg.from ? `${msg.from.username || msg.from.id}` : `sender_chat:${msg.sender_chat?.id || "?"}`,
        text: msg.text ? msg.text.substring(0, 200) : "",
        entities: msg.entities,
      });
    } catch (e) { /* ignore logging errors */ }
  });

  // ----------------- Auto-leave if bot is added to unauthorized groups -----------------
  tbot.on("new_chat_members", async (msg) => {
    try {
      if (!msg || !msg.new_chat_members) return;
      const botId = tbot.botId;
      if (!botId) return;
      const addedBot = msg.new_chat_members.some((m) => m.id === botId);
      if (!addedBot) return;
      console.log("➕ Bot added to group:", msg.chat.id);
      if (!isAllowedGroup(msg)) {
        console.log("🚫 Unauthorized group. Leaving:", msg.chat.id);
        try {
          await tbot.sendMessage(msg.chat.id, `❌ <b>${F("This bot works only in the official group.")}</b>\n\nPlease use the official group for pairing. 🌿`, { parse_mode: "HTML" });
        } catch (e) { console.warn("⚠️ Failed to send leave notice:", e); }
        try { await tbot.leaveChat(msg.chat.id); console.log("🟢 Left group:", msg.chat.id); } catch (e) { console.error("❌ Leave failed:", e); }
      } else {
        console.log("✅ Bot added to allowed group:", msg.chat.id);
        try { await tbot.sendMessage(msg.chat.id, `🎉 <b>${F("Thank you! Bot is ready here.")}</b> 🌸`, { parse_mode: "HTML" }); } catch (e) {}
      }
    } catch (err) { console.error("new_chat_members handler error:", err); }
  });

  // ----------------- Private chat: invite helper (styled) -----------------
  async function sendInviteToPrivate(chatId, replyToMessageId) {
    try {
      const text = `🌸✨ <b>${F("Pairing is available only in the official group.")}</b>\n\n👉 ${F("Click below to join and then use /pair in the group.")}\n\n${GROUP_INVITE_LINK}\n\n✨ ${F("See you there!")} 🍃`;
      await tbot.sendMessage(chatId, text, {
        parse_mode: "HTML",
        reply_to_message_id: replyToMessageId,
        reply_markup: { inline_keyboard: [[{ text: "🌷 " + toSansSerifBold("Join Official Group"), url: GROUP_INVITE_LINK }]] },
      });
      console.log("➡️ Sent group invite to private user:", chatId);
    } catch (e) { console.error("❌ Failed to send invite to private:", e); }
  }

  // ----------------- Central command parser -----------------
  function parseCommandFromMessage(msg) {
    if (!msg || !msg.text) return null;

    // Prefer using entities (more reliable for commands, esp. when admin uses sender_chat)
    if (Array.isArray(msg.entities) && msg.entities.length > 0) {
      const first = msg.entities[0];
      if (first.type === "bot_command" && first.offset === 0) {
        const cmdWithAt = msg.text.slice(0, first.length); // e.g. "/pair@MyBot"
        const cmd = cmdWithAt.split(/\s|@/)[0].replace(/^\//, "").toLowerCase();
        const args = msg.text.slice(first.length).trim();
        return { cmd, args };
      }
    }

    // Fallback: startsWith '/'
    const trimmed = msg.text.trim();
    if (!trimmed.startsWith("/")) return null;
    const parts = trimmed.split(/\s+/);
    const cmdWithAt = parts[0];
    const cmd = cmdWithAt.split("@")[0].replace(/^\//, "").toLowerCase();
    const args = parts.slice(1).join(" ").trim();
    return { cmd, args };
  }

  // ----------------- Command handler -----------------
  async function handleCommand(msg) {
    try {
      const parsed = parseCommandFromMessage(msg);
      if (!parsed) return; // no command
      const { cmd, args } = parsed;
      console.log("🔔 Command parsed:", { cmd, args, chatId: msg.chat?.id, from: msg.from?.id || msg.sender_chat?.id });

      // START
      if (cmd === "start") {
        if (isPrivate(msg)) return sendInviteToPrivate(msg.chat.id, msg.message_id);
        if (!isAllowedGroup(msg)) { console.log("/start from unauthorized group:", msg.chat?.id); return; }
        return await tbot.sendMessage(msg.chat.id, `🌸✨ <b>${F("Welcome to x-kira mini Bot!")}</b> ✨🌸\n\n🍉 <b>${F("Quick: Generate your pair code fast & securely.")}</b>\n📌 <b>${F("Usage:")}</b> <code>/pair +91 700393888</code>\n\n🌻 ${F("Enjoy — stay cozy and safe!")} ☘️`, { parse_mode: "HTML", reply_to_message_id: msg.message_id });
      }

      // PAIR
      if (cmd === "pair") {
        if (isPrivate(msg)) return sendInviteToPrivate(msg.chat.id, msg.message_id);
        if (!isAllowedGroup(msg)) { console.log("/pair from unauthorized group:", msg.chat?.id); return; }

        const chatId = msg.chat.id;
        const rawArg = args || "";
        if (!rawArg) {
          return tbot.sendMessage(chatId, `🙂 <b>${F("Invalid usage")}</b>\n\n🍂 ${F("Please provide your phone number with the country code.")}\n\n<b>${F("Example:")}</b>\n<code>/pair +91 700393888</code>\n\n🌱 ${F("Tip: include + or 00 before the country code.")}`, { parse_mode: "HTML", reply_to_message_id: msg.message_id });
        }

        console.log("📥 Raw arg:", rawArg);

        // normalize digits only (keep leading 00 if present by checking rawArg separately)
        let digitsOnly = rawArg.replace(/[^\d]/g, "");
        if (!digitsOnly) {
          return tbot.sendMessage(chatId, `🤦 <b>${F("Invalid number format")}</b>\n\n${F("Please include digits and your country code.")} ${F("Example:")} <code>/pair +91 700393888</code>`, { parse_mode: "HTML", reply_to_message_id: msg.message_id });
        }

        const country = detectCountryFromDigits(digitsOnly);
        let countryWarn = null;
        let callingCode = null;
        let countryName = null;
        let iso = null;
        let flag = "🏳️";

        if (!country) {
          // previously we returned here; now we continue but set a warning
          console.log("⚠️ Country not detected, continuing to generate code:", digitsOnly);
          countryWarn = true;
        } else {
          callingCode = country.callingCode;
          countryName = country.name;
          iso = country.iso;
          flag = isoToFlagEmoji(iso) || flag;
        }

        // session id — keep digitsOnly (ensures consistency)
        const sessionId = digitsOnly;

        // loading message
        const loadingText = countryWarn
          ? `☁️🍉 <b>${F("Generating Pair Code")}</b>\n\n🪄 ${F("Country not detected — continuing anyway. Please include your country code next time for better results.")}`
          : `☁️🍉 <b>${F("Generating Pair Code")}</b>\n${flag} <i>${escapeHtml(countryName)} (+${callingCode})</i>\n\n🪄 ${F("Please wait — creating your secure pairing...")}`;

        const loadingMsg = await tbot.sendMessage(chatId, loadingText, { parse_mode: "HTML" });

        // generate
        let pairingCode = null;
        try {
          pairingCode = await generatePairingCode(sessionId, rawArg);
          console.log("✅ Pairing code generated for", sessionId);
        } catch (err) {
          console.error("❌ generatePairingCode error:", err);
          pairingCode = null;
        }

        // try delete loading
        try { await tbot.deleteMessage(chatId, String(loadingMsg.message_id)); } catch (e) { /* ignore */ }

        if (!pairingCode) {
          return tbot.sendMessage(chatId, `💔🥲 <b>${F("Pair code generation failed.")}</b>\n\n${F("Please try again later or contact admin.")}`, { parse_mode: "HTML", reply_to_message_id: msg.message_id });
        }

        // send success: show country if detected else indicate unknown
        const detectedLine = countryWarn
          ? `🔎 <b>${F("Detected:")}</b> ${F("Country not detected")} — please include country code next time.`
          : `🔎 <b>${F("Detected:")}</b> ${flag} ${escapeHtml(countryName)} (+${callingCode})`;

        await tbot.sendMessage(chatId, `${flag} <b>${F("Pair Code Generated Successfully")}</b> 🎉\n\n📱 <b>${F("Number:")}</b> <code>${escapeHtml(rawArg)}</code>\n${detectedLine}\n\n🔐 <i>${F("Settings → Linked Devices → Link a Device")}</i>\n\n✨ ${F("Tap the code below to copy and link your device.")}`, { parse_mode: "HTML", reply_to_message_id: msg.message_id });

        await tbot.sendMessage(chatId, `<pre>${escapeHtml(pairingCode)}</pre>\n\n🎀 ${F("Happy Linking!")}`, { parse_mode: "HTML" });

        return;
      }

      // Unknown command in allowed group
      if (msg.chat && !isPrivate(msg) && isAllowedGroup(msg)) {
        return tbot.sendMessage(msg.chat.id, `🤖 <b>${F("Invalid Command")}</b>\n\n${F("You used:")} <code>/${escapeHtml(cmd)}</code>\n\n${F("Try instead:")} <code>/pair +91 700393888</code>\n\n🌼 ${F("Need help? Ask an admin.")}`, { parse_mode: "HTML", reply_to_message_id: msg.message_id });
      }

    } catch (err) {
      console.error("handleCommand error:", err);
    }
  }

  // Register a central message listener that parses and handles commands (covers admin anonymous cases)
  tbot.on("message", async (msg) => {
    try {
      await handleCommand(msg);
    } catch (e) {
      console.error("message handler error:", e);
    }
  });

  // Return the bot instance in case caller needs it
  return tbot;
}


// ------------------------------------------------------------------

/**
 * Restore all sessions from DB + local storage
 */
async function initializeSessions() {
  const baileys = await import("baileys");
  const { delay } = baileys;

  try {
    console.log("🌱 Initializing bot sessions...");

    const baseDir = config.AUTH_DIR;
    // Create base directory with recursive flag
    await fs.promises.mkdir(baseDir, { recursive: true });

    // Ensure DB sessions are reflected on disk so multi-file auth can load
    try {
      const dbSessions = await dbGetAllSessions();
      for (const s of dbSessions) {
        const number = String(s.number);
        const authDir = path.join(baseDir, number);
        const credsPath = path.join(authDir, "creds.json");
        try {
          // Create auth directory recursively
          await fs.promises.mkdir(authDir, { recursive: true });

          // If DB has selected-files payload, restore them atomically
          if (s?.creds && s.creds._selected_files) {
            try {
              const res = await restoreSelectedFiles(
                number,
                authDir,
                async (num) => {
                  return await dbGetSession(num);
                }
              );
              if (!res.ok) {
                console.warn(
                  `⚠️ [${number}] restoreSelectedFiles failed:`,
                  res.reason
                );
                // fallback: if no creds on disk, write plain creds.json
                try {
                  await fs.promises.access(credsPath);
                } catch (e) {
                  // File doesn't exist, write it
                  if (s.creds) {
                    const credsCopy = Object.assign({}, s.creds);
                    delete credsCopy._selected_files;
                    await fs.promises.writeFile(
                      credsPath,
                      JSON.stringify(credsCopy, null, 2)
                    );
                  }
                }
              }
            } catch (e) {
              console.warn(
                `⚠️ Failed to materialize DB session ${number} to disk:`,
                e.message || e
              );
              try {
                await fs.promises.access(credsPath);
              } catch (err) {
                // File doesn't exist, write it
                if (s.creds) {
                  const credsCopy = Object.assign({}, s.creds);
                  delete credsCopy._selected_files;
                  await fs.promises.writeFile(
                    credsPath,
                    JSON.stringify(credsCopy, null, 2)
                  );
                }
              }
            }
          } else {
            // legacy fallback: write creds.json if missing
            try {
              await fs.promises.access(credsPath);
            } catch (e) {
              // File doesn't exist, write it
              if (s.creds) {
                await fs.promises.writeFile(
                  credsPath,
                  JSON.stringify(s.creds, null, 2)
                );
              }
            }
          }
        } catch (e) {
          console.warn(
            `⚠️ Failed to materialize DB session ${number} to disk:`,
            e.message
          );
        }
      }
    } catch (e) {
      // ignore DB read errors
    }

    // Get all session folders
    let folders = [];
    try {
      folders = await fs.promises.readdir(baseDir);
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
      folders = [];
    }

    const sessionNumbers = [];
    for (const f of folders) {
      const credsPath = path.join(baseDir, f, "creds.json");
      try {
        await fs.promises.access(credsPath);
        sessionNumbers.push(f);
      } catch (e) {
        // creds.json doesn't exist for this folder
      }
    }

    if (!sessionNumbers.length) {
      console.log(
        "⚠️ No existing sessions found. Use /pair endpoint to add new sessions."
      );
      return;
    }

    console.log(`♻️ Restoring ${sessionNumbers.length} sessions...`);

    // Restore sessions with controlled concurrency to improve speed and limit resource usage
    const concurrency =
      parseInt(process.env.RESTORE_CONCURRENCY || "3", 10) || 3;
    const queue = sessionNumbers.slice();
    const workers = Array.from({
      length: Math.min(concurrency, queue.length),
    }).map(async () => {
      while (queue.length) {
        const number = queue.shift();
        if (!number) break;
        try {
          console.log(`🔄 Restoring session for ${number}...`);
          await startBot(number);
          await delay(2000); // polite delay between starts per worker
        } catch (err) {
          // Do NOT delete session on temporary error
          console.error(`❌ Failed restoring session for ${number}:`, err);
          // Log to a file for admin review
          try {
            await fs.appendFile(
              path.join(__dirname, "restore-errors.log"),
              `[${new Date().toISOString()}] Session ${number} restore failed: ${
                err?.message || err
              }\n`
            );
          } catch (logErr) {
            console.error("❌ Failed to log restore error:", logErr);
          }
        }
      }
    });

    await Promise.all(workers);

    console.log(`✅ Initialization complete.  sessions active.`);
  } catch (err) {
    console.error("❌ initializeSessions() failed:", err);
  }
}

// ==================== ROUTES ====================
// ==================== LEAPCELL HEALTHCHECK ====================
app.get("/kaithheathcheck", (req, res) => {
  res.status(200).send("OK");
});

app.get("/", (req, res) => {
  res.send("Server Running");
});

/**
 * Pair new device endpoint
 */

app.get("/pair", async (req, res) => {
  try {
    const { number } = req.query;
    if (!number) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required (e.g., ?number=1234567890)",
      });
    }
    // Check connection status efficiently
    if (manager.isConnected(number)) {
      return res.status(408).json({
        status: "false",
        message: "This number is already connected",
      });
    }

    const sessionId = number.replace(/[^0-9]/g, "");
    const pairingCode = await generatePairingCode(sessionId, number);

    res.json({
      success: true,
      sessionId,
      pairingCode,
      message:
        "Enter this code in WhatsApp: Settings > Linked Devices > Link a Device",
    });
  } catch (error) {
    console.error("Pairing error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * Logout endpoint
 */
app.get("/logout", async (req, res) => {
  try {
    const { number } = req.query;

    if (!number) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const sessionId = number.replace(/[^0-9]/g, "");

    console.log(`🚪 /logout initiated for ${sessionId}`);
    const success = await logoutSession(sessionId);
    if (success) {
      console.log(`✅ /logout completed for ${sessionId}`);
      res.json({
        success: true,
        message: `Session ${sessionId} logged out successfully`,
      });
    } else {
      console.warn(
        `⚠️ /logout: Session ${sessionId} not found or already logged out`
      );
      res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * Reconnect endpoint
 */
app.get("/reconnect", async (req, res) => {
  try {
    const { number } = req.query;

    if (!number) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const sessionId = number.replace(/[^0-9]/g, "");

    // Logout first
    await logoutSession(sessionId);
    await new Promise((r) => setTimeout(r, 1000));

    // Reconnect
    const sock = await createBaileysConnection(sessionId);
    if (sock) {
      res.json({
        success: true,
        message: `Session ${sessionId} reconnected successfully`,
      });
    } else {
      throw new Error("Failed to reconnect");
    }
  } catch (error) {
    console.error("Reconnect error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.get("/sessions", (req, res) => {
  const sessions = {};
  const allConnections = manager.getAllConnections();
  allConnections.forEach(({ file_path, connection, healthy }) => {
    sessions[file_path] = {
      connected: healthy,
      user: connection?.user?.name || "unknown",
      jid: connection?.user?.id || null,
      healthy: healthy,
    };
  });
  res.json({
    total: Object.keys(sessions).length,
    healthy: allConnections.filter((c) => c.healthy).length,
    sessions,
  });
});

// ==================== STARTUP ====================

app.listen(PORT, async () => {
  console.log(`\n${"=".repeat(50)}`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`${"=".repeat(50)}`);
  console.log(
    `📱 Pair new device: http://localhost:${PORT}/pair?number=YOUR_NUMBER`
  );
  console.log(`📊 Check status: http://localhost:${PORT}/status`);
  console.log(`🚪 Logout: http://localhost:${PORT}/logout?number=YOUR_NUMBER`);
  console.log(
    `🔄 Reconnect: http://localhost:${PORT}/reconnect?number=YOUR_NUMBER`
  );
  console.log(`${"=".repeat(50)}\n`);

  // Initialize existing sessions
  try {
    // Initialize cache (Redis or in-memory fallback)
    try {
      await cache.init();
    } catch (e) {
      console.warn("⚠️ Cache init failed:", e.message);
    }

    // Ensure database tables are created
    if (config?.DATABASE && typeof config.DATABASE.sync === "function") {
      await config.DATABASE.sync();
      console.log("✅ Database synced");
    }
  } catch (dbErr) {
    console.error("❌ Failed to sync database:", dbErr.message);
  }

  await initializeSessions();

  // Initialize Telegram bot (if token provided)
  try {
    await initializeTelegramBot();
  } catch (e) {
    console.error("❌ Failed to init Telegram bot:", e?.message || e);
  }
});
