// ============================
// FULL TELEGRAM AI BOT SYSTEM
// Webhook + Subscription + Referral + OpenAI
// ============================

require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// Telegram keys
const BOT_TOKEN = process.env.BOT_TOKEN;
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Your bot username
const BOT_USERNAME = "Tele_tap_ai_bot";

// Required channels + YouTube
const CHANNEL_1 = "@TeleAIupdates";
const YOUTUBE_URL = "https://youtube.com/@SunusiCrypto";

// ------------------------------
// SEND MESSAGE FUNCTION
// ------------------------------
async function sendMessage(chatId, text, replyMarkup = null) {
  try {
    await axios.post(`${API_URL}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      reply_markup: replyMarkup,
    });
  } catch (err) {
    console.error("SendMessage Error:", err.response?.data || err);
  }
}

// ------------------------------
// CHECK SUBSCRIPTION
// ------------------------------
async function isSubscribed(userId) {
  try {
    const check = await axios.get(
      `${API_URL}/getChatMember?chat_id=${CHANNEL_1}&user_id=${userId}`
    );

    const status = check.data.result.status;

    return ["member", "creator", "administrator"].includes(status);
  } catch (error) {
    return false;
  }
}

// ------------------------------
// AI CHATGPT RESPONSE
// ------------------------------
async function askAI(prompt) {
  try {
    const res = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 250,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.data.choices[0].message.content;
  } catch (err) {
    console.error("AI Error:", err.response?.data || err);
    return "❌ <b>AI Error:</b> Ba zan iya amsawa yanzu ba.";
  }
}

// ------------------------------
// WEBHOOK HANDLER
// ------------------------------
app.post("/webhook", async (req, res) => {
  const body = req.body;

  // --------------------------
  // START WITH REFERRAL
  // --------------------------
  if (body.message && body.message.text?.startsWith("/start")) {
    const chatId = body.message.chat.id;
    const user = body.message.from;

    let refId = null;
    const parts = body.message.text.split(" ");

    if (parts.length > 1) refId = parts[1];

    let refText = refId
      ? `🎁 <b>Wanda ya gayyace ka:</b> <code>${refId}</code>\n\n`
      : "";

    return sendMessage(
      chatId,
      `👋 <b>Barka da zuwa ${user.first_name}!</b>\n\n` +
        refText +
        `⚠️ <b>Dole ka kammala waɗannan kafin amfani da bot:</b>\n\n` +
        `1️⃣ Ka subscribe YouTube:\n${YOUTUBE_URL}\n\n` +
        `2️⃣ Ka join channel:\n${CHANNEL_1}\n\n` +
        `✔️ Idan ka gama, danna maɓallin ƙasa:\n`,
      {
        inline_keyboard: [
          [{ text: "✅ Na gama Joining", callback_data: "check_sub" }],
        ],
      }
    );
  }

  // --------------------------
  // CALLBACK BUTTONS
  // --------------------------
  if (body.callback_query) {
    const cq = body.callback_query;
    const chatId = cq.from.id;
    const userId = cq.from.id;

    if (cq.data === "check_sub") {
      const ok = await isSubscribed(userId);

      if (!ok) {
        return sendMessage(
          chatId,
          `❌ <b>Ba ka gama joining ba!</b>\n\n` +
            `👉 Join channel: ${CHANNEL_1}\n\n` +
            `🔄 Sannan danna "Na gama Joining"`
        );
      }

      return sendMessage(
        chatId,
        `🎉 <b>An tabbatar ka gama Subscription!</b>\n\n` +
          `Yanzu zaka iya amfani da AI ChatGPT bot ɗinka.\n\n` +
          `🧠 Rubuta duk abin da kake so:`
      );
    }

    return res.sendStatus(200);
  }

  // --------------------------
  // NORMAL USER MESSAGE → AI
  // --------------------------
  if (body.message && body.message.text) {
    const chatId = body.message.chat.id;
    const text = body.message.text;
    const userId = body.message.from.id;

    const ok = await isSubscribed(userId);
    if (!ok) {
      return sendMessage(
        chatId,
        `⚠️ <b>Dole ka yi subscription kafin amfani da AI.</b>\n\n` +
          `👉 YouTube: ${YOUTUBE_URL}\n` +
          `👉 Channel: ${CHANNEL_1}`
      );
    }

    const reply = await askAI(text);
    return sendMessage(chatId, reply);
  }

  res.sendStatus(200);
});

// ------------------------------
// SERVER LISTEN
// ------------------------------
app.get("/", (req, res) => res.send("Telegram AI Bot Running"));
app.listen(3000, () => console.log("Bot running on port 3000"));
