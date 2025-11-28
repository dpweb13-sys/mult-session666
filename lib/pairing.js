// ============================================
// lib/pairing.js - Pairing Code Generation (ESM)
// ============================================
import { createBaileysConnection } from "./connection.js";

async function waitForOpen(sock, timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      sock.ev.off("connection.update", handler);
      reject(new Error("Timed out waiting for connection to open"));
    }, timeoutMs);

    const handler = (update) => {
      const { connection, lastDisconnect, qr } = update || {};
  
      if (connection === "open") {
        clearTimeout(timeout);
        sock.ev.off("connection.update", handler);
        resolve();
        return;
      } else if (connection === "close") {
        clearTimeout(timeout);
        sock.ev.off("connection.update", handler);
        const err = lastDisconnect?.error || new Error("Connection closed before open");
        reject(err);
      }
    };

    sock.ev.on("connection.update", handler);
  });
}

export async function generatePairingCode(sessionId, phoneNumber) {
  const cleanNumber = phoneNumber.replace(/[^0-9]/g, "");

    try {
      const sock = await createBaileysConnection(sessionId);
      await waitForOpen(sock, 15000);
      if (!sock.requestPairingCode) throw new Error("Pairing not supported");
      return await sock.requestPairingCode(cleanNumber);
    } catch (err2) {
      console.error(`❌ [${sessionId}] Pairing error:`, err2);
      throw err2;
    }
}
