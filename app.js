import express from "express";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());

// =====================================
// CONFIG
// =====================================
const BOT_TOKEN = process.env.8535312579:AAEaMIHnkTN0BxDpVqo1mHatbrXIfxX5uc4;
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

const CHANNEL_ID = "-1002456619721"; 
const BOT_USERNAME = "Tele_tap_ai_bot";
const YOUTUBE_LINK = "https://youtube.com/@SunusiCrypto";

// =====================================
// SEND MESSAGE
// =====================================
async function sendMessage(chatId, text, reply_markup = null) {
  try {
    await axios.post(`${API_URL}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      reply_markup,
    });
  } catch (err) {
    console.log("SendMessage Error:", err.response?.data || err.message);
  }
}

// =====================================
// CHECK SUBSCRIPTION
// =====================================
async function isSubscribed(userId) {
  try {
    const res = await axios.get(
      `${API_URL}/getChatMember?chat_id=${CHANNEL_ID}&user_id=${userId}`
    );
    const status = res.data.result.status;
    return ["member", "administrator", "creator"].includes(status);
  } catch (error) {
    return false;
  }
}

// =====================================
// AI RESPONSE
// =====================================
async function generateAIResponse(prompt) {
  try {
    const res = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.data.choices[0].message.content;
  } catch (error) {
    return "❌ AI Error: Ba zan iya amsawa yanzu ba.";
  }
}

// =====================================
// MAIN MENU
// =====================================
function mainMenu(refLink) {
  return {
    inline_keyboard: [
      [{ text: "🤖 AI Chat", callback_data: "ai_chat" }],
      [{ text: "👥 Referral", callback_data: "ref" }],
      [
        { text: "📢 Join Channel", url: "https://t.me/TeleAIupdates" },
        { text: "▶️ YouTube", url: YOUTUBE_LINK },
      ],
      [{ text: "🔄 Refresh", callback_data: "refresh" }],
    ],
  };
}

// =====================================
// WEBHOOK
// =====================================
app.post("/webhook", async (req, res) => {
  const body = req.body;

  // START COMMAND
  if (body.message?.text?.startsWith("/start")) {
    const userId = body.message.from.id;
    const ref = body.message.text.split(" ")[1];

    const refLink = `https://t.me/${BOT_USERNAME}?start=${userId}`;

    await sendMessage(
      userId,
      `👋 <b>Barka da zuwa TeleAI Bot!</b>\n\nReferral Link:\n${refLink}`,
      mainMenu(refLink)
    );

    return res.sendStatus(200);
  }

  // NORMAL MESSAGE = AI CHAT
  if (body.message?.text) {
    const userId = body.message.from.id;

    // Check subscription
    if (!(await isSubscribed(userId))) {
      await sendMessage(
        userId,
        "❌ <b>Ba ka gama subscription ba!</b>\nSai ka shiga:\n@TeleAIupdates"
      );
      return res.sendStatus(200);
    }

    const ai = await generateAIResponse(body.message.text);
    await sendMessage(userId, ai);
    return res.sendStatus(200);
  }

  // CALLBACKS
  if (body.callback_query) {
    const userId = body.callback_query.from.id;

    if (body.callback_query.data === "refresh") {
      const refLink = `https://t.me/${BOT_USERNAME}?start=${userId}`;
      await sendMessage(userId, "🔄 Refreshed!", mainMenu(refLink));
    }

    if (body.callback_query.data === "ai_chat") {
      await sendMessage(userId, "✍️ Rubuta tambayarka…");
    }

    if (body.callback_query.data === "ref") {
      const refLink = `https://t.me/${BOT_USERNAME}?start=${userId}`;
      await sendMessage(userId, `👥 Referral Link:\n${refLink}`);
    }

    return res.sendStatus(200);
  }

  res.sendStatus(200);
});

// =====================================
// SERVER (IMPORTANT – PORT 10000)
// =====================================
const PORT = process.env.PORT || 10000;

app.get("/", (req, res) => {
  res.send("TeleAI Bot Running…");
});

app.listen(PORT, () => console.log(`Bot running on port ${PORT}`));
