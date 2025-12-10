// =============== TELE-TECH AI BOT ===============
// Telegram Bot + OpenAI Chat + Flutterwave Payment

import express from "express";
import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// ====== ENVIRONMENT VARIABLES ======
const BOT_TOKEN = process.env.BOT_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// ====== WELCOME MESSAGE ======
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text === "/start") {
    return bot.sendMessage(
      chatId,
      `👋 *Welcome to TeleTech AI Bot!*

I'm an advanced AI bot powered by ChatGPT.
You can chat with me, ask questions, or buy AI credits.

💰 To buy credit type: /buy

🧠 Start chatting by typing anything!
`, { parse_mode: "Markdown" }
    );
  }

  // NORMAL AI CHAT
  try {
    const reply = await askOpenAI(text);
    bot.sendMessage(chatId, reply);
  } catch (error) {
    bot.sendMessage(chatId, "❌ Error from AI. Try again.");
  }
});

// ====== BUY COMMAND ======
bot.onText(/\/buy/, async (msg) => {
  const chatId = msg.chat.id;

  const payment = await createFlutterwavePayment(500); // 500 NGN

  bot.sendMessage(
    chatId,
    `💳 *Buy AI Credits*

Amount: *₦500*

Click below to pay:
${payment.link}

After payment screenshot and send it here.`,
    { parse_mode: "Markdown" }
  );
});

// ====== OPENAI FUNCTION ======
async function askOpenAI(userMessage) {
  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: userMessage }],
    },
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
    }
  );

  return response.data.choices[0].message.content;
}

// ====== FLUTTERWAVE PAYMENT FUNCTION ======
async function createFlutterwavePayment(amount) {
  const response = await axios.post(
    "https://api.flutterwave.com/v3/payments",
    {
      tx_ref: "tlc" + Date.now(),
      amount: amount,
      currency: "NGN",
      redirect_url: "https://example.com/thanks",
      customer: {
        email: "teleai@example.com",
        name: "TeleAI User",
      },
    },
    {
      headers: {
        Authorization: `Bearer ${FLW_SECRET_KEY}`,
      },
    }
  );

  return { link: response.data.data.link };
}

// ====== EXPRESS SERVER ======
app.get("/", (req, res) => {
  res.send("TeleTech AI Bot is running...");
});

app.listen(3000, () => console.log("Server running on port 3000"));
