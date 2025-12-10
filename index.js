import { Telegraf } from "telegraf";
import axios from "axios";
import fs from "fs";
import OpenAI from "openai";

// ENV
const BOT_TOKEN = process.env.BOT_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;

const PREMIUM_PRICE_NGN = process.env.PREMIUM_PRICE_NGN || 1000;
const DB_FILE = process.env.DB_FILE || "./data/db.json";

// Init bot
const bot = new Telegraf(BOT_TOKEN);

// Init OpenAI client
const client = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Load DB
let db = { users: {} };
if (fs.existsSync(DB_FILE)) {
  db = JSON.parse(fs.readFileSync(DB_FILE));
}
function saveDB() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// Flutterwave Payment
async function createPayment(ref, amount) {
  try {
    const res = await axios.post(
      "https://api.flutterwave.com/v3/payments",
      {
        tx_ref: ref,
        amount: amount,
        currency: "NGN",
        redirect_url: "https://example.com/paid",
        customer: { email: `${ref}@mail.com` },
        customizations: {
          title: "Premium Access",
          description: "Unlock AI access",
        },
      },
      {
        headers: { Authorization: `Bearer ${FLW_SECRET_KEY}` },
      }
    );

    return res.data.data.link;
  } catch (err) {
    console.log(err.response?.data);
    return null;
  }
}

async function verifyPayment(ref) {
  const res = await axios.get(
    `https://api.flutterwave.com/v3/transactions?tx_ref=${ref}`,
    {
      headers: { Authorization: `Bearer ${FLW_SECRET_KEY}` },
    }
  );

  const list = res.data.data;
  if (!list || list.length === 0) return false;

  return list[0].status === "successful";
}

// Middleware: check premium
function isPremium(userId) {
  return db.users[userId]?.premium === true;
}

// START
bot.start((ctx) => {
  ctx.reply(
    "👋 Barka da zuwa!\n\nRubuta *wani abu kai tsaye* domin ChatGPT ya baka amsa.\n\nIdan kana son **unlimited AI**, yi amfani da: /premium",
    { parse_mode: "Markdown" }
  );
});

// PREMIUM command
bot.command("premium", async (ctx) => {
  const userId = ctx.from.id;
  const ref = `tx_${userId}_${Date.now()}`;

  const link = await createPayment(ref, PREMIUM_PRICE_NGN);
  if (!link) return ctx.reply("❌ Matsala wajen ƙirƙirar link.");

  ctx.reply(
    `💳 *Premium Price:* ₦${PREMIUM_PRICE_NGN}\n\nBi link ɗin nan ka biya👇\n${link}\n\nDaga nan ka rubuta:\n/verify ${ref}`,
    { parse_mode: "Markdown" }
  );
});

// VERIFY payment
bot.command("verify", async (ctx) => {
  const args = ctx.message.text.split(" ");
  if (args.length < 2) return ctx.reply("Misali: /verify tx_12345");

  const ref = args[1];
  ctx.reply("🔍 Ana duba biyan ka...");

  const ok = await verifyPayment(ref);
  if (!ok) return ctx.reply("❌ Ba a samu successful payment ba.");

  db.users[ctx.from.id] = { premium: true };
  saveDB();

  ctx.reply("🎉 *An kunna maka Premium!*", { parse_mode: "Markdown" });
});

// MAIN CHAT (AI response)
bot.on("text", async (ctx) => {
  const userId = ctx.from.id;

  if (!isPremium(userId)) {
    return ctx.reply(
      "❌ Ba ka da Premium.\n\nYi amfani da /premium domin buɗe unlimited AI."
    );
  }

  ctx.sendChatAction("typing");

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini", // Latest cheap model
      messages: [{ role: "user", content: ctx.message.text }],
    });

    ctx.reply(completion.choices[0].message.content);
  } catch (err) {
    console.log(err);
    ctx.reply("❌ Error from OpenAI API.");
  }
});

// RUN BOT
bot.launch();
console.log("BOT IS RUNNING...");
