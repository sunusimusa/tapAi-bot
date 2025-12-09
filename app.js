// Telegram TapAI Bot - Full Working Code (With Referral + Mandatory Subscribe)
// Developed for Sunusi Musa (SunusiCrypto)
// Replace 'BOT_TOKEN' with your real bot token

import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

// ==============================
// 🔐 BOT CONFIG
// ==============================
const BOT_TOKEN = "YOUR_BOT_TOKEN_HERE";
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

// ==============================
// 🔗 MANDATORY SUBSCRIPTION LINKS
// ==============================
const CHANNEL_1 = "tele_tap_ai";            // First Telegram channel
const CHANNEL_2 = "TeleAIupdates";         // Second Telegram channel
const YOUTUBE_URL = "https://www.youtube.com/@Sunusicrypto";

// ==============================
// 📌 REFERRAL SYSTEM STORE
// (In real project use MongoDB or MySQL)
// ==============================
let users = {}; // { userId: { referredBy: id, balance: 0 } }

// ==============================
// ▶️ CHECK IF USER IS SUBSCRIBED
// ==============================
async function isSubscribed(userId) {
  try {
    const check1 = await axios.get(`${API_URL}/getChatMember?chat_id=@${CHANNEL_1}&user_id=${userId}`);
    const check2 = await axios.get(`${API_URL}/getChatMember?chat_id=@${CHANNEL_2}&user_id=${userId}`);

    const ok1 = ["member", "administrator", "creator"].includes(check1.data.result.status);
    const ok2 = ["member", "administrator", "creator"].includes(check2.data.result.status);

    return ok1 && ok2;
  } catch (err) {
    return false;
  }
}

// ==============================
// ▶️ SEND MESSAGE FUNCTION
// ==============================
async function sendMessage(chatId, text, buttons = null) {
  const body = {
    chat_id: chatId,
    text,
    parse_mode: "HTML"
  };
  if (buttons) body.reply_markup = buttons;

  await axios.post(`${API_URL}/sendMessage`, body);
}

// ==============================
// ▶️ WEBHOOK HANDLER
// ==============================
app.post("/webhook", async (req, res) => {
  const update = req.body;

  if (!update.message) return res.sendStatus(200);

  const chatId = update.message.chat.id;
  const userId = update.message.from.id;
  const text = update.message.text;

  // CREATE USER IF NOT EXIST
  if (!users[userId]) users[userId] = { balance: 0, referredBy: null };

  // ==============================
  // 1️⃣ /start + referral
  // ==============================
  if (text.startsWith("/start")) {
    const parts = text.split(" ");

    if (parts.length > 1) {
      const refId = parts[1];

      if (refId !== userId.toString() && !users[userId].referredBy) {
        users[userId].referredBy = refId;

        // Give reward to referrer
        if (!users[refId]) users[refId] = { balance: 0, referredBy: null };
        users[refId].balance += 50; // reward
      }
    }

    // Check if subscribed
    const sub = await isSubscribed(userId);

    if (!sub) {
      return sendMessage(chatId,
        "<b>⚠️ Dole ne ka yi SUBSCRIBE kafin ka cigaba!</b>\n\n➡️ YouTube: " + YOUTUBE_URL +
        "\n➡️ Telegram Channel 1: @" + CHANNEL_1 +
        "\n➡️ Telegram Channel 2: @" + CHANNEL_2 +
        "\n\nIdan ka gama, danna *Check Subscription*",
        {
          inline_keyboard: [
            [{ text: "Check Subscription", callback_data: "check_sub" }]
          ]
        }
      );
    }

    return sendMessage(chatId,
      "🎉 <b>Barka da zuwa TeleAI Bot!</b>\n\nYour referral link:\nhttps://t.me/TeleAITapBot?start=" + userId
    );
  }

  res.sendStatus(200);
});

// ==============================
// ▶️ CALLBACK QUERY (Check Subscription)
// ==============================
app.post("/webhook", async (req, res) => {
  if (!req.body.callback_query) return;

  const cq = req.body.callback_query;
  const userId = cq.from.id;
  const chatId = cq.from.id;

  if (cq.data === "check_sub") {
    const ok = await isSubscribed(userId);

    if (!ok) {
      return sendMessage(chatId,
        "❌ <b>Ba ka gama subscribe ba!</b>\nSai kayi Sub zuwa YouTube + Channels dina."
      );
    }

    return sendMessage(chatId,
      "✅ <b>An tabbatar! Ka gama subscription.</b>\nYanzu zaka iya amfani da bot."
    );
  }

  res.sendStatus(200);
});

// ==============================
// ▶️ SERVER LISTENER
// ==============================
app.get("/", (req, res) => res.send("Bot is running"));

app.listen(3000, () => console.log("Bot running on port 3000"));
