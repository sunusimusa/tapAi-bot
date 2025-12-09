import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config(); // Load .env variables

// =====================
// CONSTANTS
// =====================
const BOT_TOKEN = process.env.BOT_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const BOT_USERNAME = "Tele_tap_ai_bot"; 
const YOUTUBE_LINK = "https://youtube.com/@SunusiCrypto";

const REQUIRED_CHANNELS = [
  "@TeleAIupdates",
  "@TeleAIupdates" 
];

// =====================
// EXPRESS SERVER
// =====================
const app = express();
app.use(express.json());

// =====================
// SEND MESSAGE FUNCTION
// =====================
async function sendMessage(chatId, text, keyboard = null) {
  const payload = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
  };

  if (keyboard) payload.reply_markup = keyboard;

  await axios.post(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    payload
  );
}

// ======================
// CHECK SUBSCRIPTION
// ======================
async function isSubscribed(userId) {
  try {
    for (let channel of REQUIRED_CHANNELS) {
      const res = await axios.get(
        `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember`,
        {
          params: {
            chat_id: channel,
            user_id: userId,
          },
        }
      );

      const status = res.data.result.status;

      if (
        status !== "member" &&
        status !== "administrator" &&
        status !== "creator"
      ) {
        return false;
      }
    }

    return true;
  } catch (err) {
    console.log("Subscription check error:", err.response?.data);
    return false;
  }
}

// ===============================
// AI RESPONSE FUNCTION
// ===============================
async function generateAIResponse(prompt) {
  try {
    const res = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.data.choices[0].message.content;
  } catch (error) {
    console.log(error.response?.data || error.message);
    return "❌ AI Error: Ba zan iya amsawa yanzu ba.";
  }
}

// =====================
// MAIN MENU
// =====================
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

// ============================
// HANDLE INCOMING MESSAGES
// ============================
app.post(`/webhook`, async (req, res) => {
  const body = req.body;

  // ----------------------
  // START COMMAND
  // ----------------------
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

  // ----------------------
  // AI CHAT MESSAGE
  // ----------------------
  if (body.message?.text && body.message.chat) {
    const userId = body.message.from.id;

    // Check subscription first
    if (!(await isSubscribed(userId))) {
      await sendMessage(
        userId,
        "❌ <b>Ba ka gama subscription ba!</b>\nSai ka shiga kai tsaye:\n@TeleAIupdates"
      );
      return res.sendStatus(200);
    }

    const ai = await generateAIResponse(body.message.text);
    await sendMessage(userId, ai);
    return res.sendStatus(200);
  }

  // ----------------------
  // CALLBACK QUERY
  // ----------------------
  if (body.callback_query) {
    const cq = body.callback_query;
    const userId = cq.from.id;

    if (cq.data === "refresh") {
      const refLink = `https://t.me/${BOT_USERNAME}?start=${userId}`;
      await sendMessage(userId, "🔄 Refreshed!", mainMenu(refLink));
    }

    if (cq.data === "ai_chat") {
      await sendMessage(userId, "✍️ Rubuta tambayarka...");
    }

    if (cq.data === "ref") {
      const refLink = `https://t.me/${BOT_USERNAME}?start=${userId}`;
      await sendMessage(
        userId,
        `👥 Referral Link:\n${refLink}`
      );
    }

    return res.sendStatus(200);
  }

  res.sendStatus(200);
});

// ======================
// SERVER LISTENER
// ======================
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("TeleAI Bot Running…");
});

app.listen(PORT, () =>
  console.log(`Bot running on port ${PORT}`)
);
