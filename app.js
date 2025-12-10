import express from "express";
import { Telegraf } from "telegraf";
import axios from "axios";
import fs from "fs";
import OpenAI from "openai";

const app = express();
app.use(express.json());

// ======= ENV VARIABLES =======
const BOT_TOKEN = process.env.BOT_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;

const PREMIUM_PRICE_NGN = process.env.PREMIUM_PRICE_NGN || 1000;
const DB_FILE = "./data/db.json";

// ======= DEBUG LOGS =======
console.log("======= TELE TECH AI BOT STARTING =======");
console.log("BOT_TOKEN:", BOT_TOKEN ? "OK" : "MISSING");
console.log("OPENAI_API_KEY:", OPENAI_API_KEY ? "OK" : "MISSING");
console.log("FLW_SECRET_KEY:", FLW_SECRET_KEY ? "OK" : "MISSING");
console.log("=========================================");

// BOT
const bot = new Telegraf(BOT_TOKEN);

// DB
let db = { users: {} };
if (fs.existsSync(DB_FILE)) {
  db = JSON.parse(fs.readFileSync(DB_FILE));
}
function saveDB() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// Flutterwave payment
async function createPayment(ref, amount) {
  try {
    const res = await axios.post(
      "https://api.flutterwave.com/v3/payments",
      {
        tx_ref: ref,
        amount,
        currency: "NGN",
        redirect_url: "https://google.com",
        customer: { email: `${ref}@mail.com` },
        customizations: {
          title: "Premium Access",
          description: "Tele Tech AI Premium",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`,
        },
      }
    );

    return res.data.data.link;
  } catch (e) {
    console.error("Payment ERROR:", e.response?.data || e.message);
    return null;
  }
}

// Verify Flutterwave
async function verifyPayment(txRef) {
  try {
    const res = await axios.get(
      `https://api.flutterwave.com/v3/transactions?tx_ref=${txRef}`,
      {
        headers: { Authorization: `Bearer ${FLW_SECRET_KEY}` },
      }
    );

    const data = res.data.data;
    if (!data || data.length === 0) return false;
    return data[0].status === "successful";
  } catch (e) {
    console.error("Verify ERROR:", e.response?.data || e.message);
    return false;
  }
}

// OpenAI Client
const client = new OpenAI({ apiKey: OPENAI_API_KEY });

// Start command
bot.start((ctx) => {
  ctx.reply(
    "👋 *Welcome to Tele Tech AI Bot!*\n\n" +
      "Use /premium to unlock unlimited AI chat.",
    { parse_mode: "Markdown" }
  );
});

// Premium command
bot.command("premium", async (ctx) => {
  const userId = ctx.from.id;
  const ref = `tx_${userId}_${Date.now()}`;

  const paymentLink = await createPayment(ref, PREMIUM_PRICE_NGN);

  if (!paymentLink)
    return ctx.reply("❌ Error generating payment link. Try again.");

  ctx.reply(
    `💳 *Premium Price: ₦${PREMIUM_PRICE_NGN}*\n` +
      `Pay using link below:\n${paymentLink}\n\n` +
      `Then verify using:\n/verify ${ref}`,
    { parse_mode: "Markdown" }
  );
});

// Verify command
bot.command("verify", async (ctx) => {
  const parts = ctx.message.text.split(" ");
  if (parts.length < 2)
    return ctx.reply("Example:\n/verify tx_123456789");

  const txRef = parts[1];
  ctx.reply("⏳ Checking payment...");

  const ok = await verifyPayment(txRef);
  if (!ok) return ctx.reply("❌ Payment not successful.");

  db.users[ctx.from.id] = { premium: true };
  saveDB();

  ctx.reply("🎉 *Premium Activated!*", { parse_mode: "Markdown" });
});

// AI Chat
bot.on("text", async (ctx) => {
  const userId = ctx.from.id;

  if (!db.users[userId]?.premium) {
    return ctx.reply(
      "⚠️ You need Premium access.\nUse /premium to unlock AI chat."
    );
  }

  const prompt = ctx.message.text;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are Tele Tech AI Bot. Respond helpfully.",
        },
        { role: "user", content: prompt },
      ],
    });

    ctx.reply(completion.choices[0].message.content);
  } catch (e) {
    console.error("AI ERROR:", e);
    ctx.reply("❌ OpenAI Server Error. Try again later.");
  }
});

// WEBHOOK SETUP
app.post(`/webhook/${BOT_TOKEN}`, (req, res) => {
  bot.handleUpdate(req.body);
  res.sendStatus(200);
});

// HOME PAGE
app.get("/", (req, res) => {
  res.send("Tele Tech AI Bot Running...");
});

// START EXPRESS
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Bot running on port " + PORT);
});
