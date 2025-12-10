import { Telegraf } from "telegraf";
import axios from "axios";
import fs from "fs";
import OpenAI from "openai";

// ====== ENV VARIABLES ======
const BOT_TOKEN = process.env.BOT_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;
const PREMIUM_PRICE_NGN = process.env.PREMIUM_PRICE_NGN || 1000;
const DB_FILE = process.env.DB_FILE || "./data/db.json";

// ====== DEBUG: CHECK ENV ======
console.log("==== DEBUG INFO ====");
console.log("BOT_TOKEN:", BOT_TOKEN ? "SET" : "NOT SET");
console.log("OPENAI_API_KEY:", OPENAI_API_KEY ? "SET" : "NOT SET");
console.log("FLW_SECRET_KEY:", FLW_SECRET_KEY ? "SET" : "NOT SET");
console.log("===================");

// ====== INIT BOT ======
const bot = new Telegraf(BOT_TOKEN);

// ====== LOAD DB ======
let db = { users: {} };
if (fs.existsSync(DB_FILE)) {
  db = JSON.parse(fs.readFileSync(DB_FILE));
}
function saveDB() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// ====== FLUTTERWAVE FUNCTIONS ======
async function createPayment(ref, amount) {
  try {
    const res = await axios.post(
      "https://api.flutterwave.com/v3/payments",
      {
        tx_ref: ref,
        amount: amount,
        currency: "NGN",
        redirect_url: "https://google.com",
        customer: { email: `${ref}@mail.com` },
        customizations: { title: "Premium Access", description: "Unlock AI" },
      },
      { headers: { Authorization: `Bearer ${FLW_SECRET_KEY}` } }
    );
    console.log("Payment link created:", res.data.data.link);
    return res.data.data.link;
  } catch (err) {
    console.error("FLUTTERWAVE ERROR:", err.response?.data || err.message);
    return null;
  }
}

async function verifyPayment(txRef) {
  try {
    const res = await axios.get(
      `https://api.flutterwave.com/v3/transactions?tx_ref=${txRef}`,
      { headers: { Authorization: `Bearer ${FLW_SECRET_KEY}` } }
    );
    const data = res.data.data;
    if (!data || data.length === 0) return false;
    return data[0].status === "successful";
  } catch (err) {
    console.error("FLUTTERWAVE VERIFY ERROR:", err.response?.data || err.message);
    return false;
  }
}

// ====== OPENAI CLIENT ======
const client = new OpenAI({ apiKey: OPENAI_API_KEY });

// ====== BOT COMMANDS ======
bot.start((ctx) => {
  console.log("Received /start from", ctx.from.id);
  ctx.reply(
    "👋 Barka da zuwa *Tele Tech AI Bot!* \n\n" +
      "Yi amfani da /premium domin kunna Premium AI Access.",
    { parse_mode: "Markdown" }
  );
});

bot.command("premium", async (ctx) => {
  const userId = ctx.from.id;
  const ref = `tx_${userId}_${Date.now()}`;
  console.log("User requested premium:", userId);

  const paymentLink = await createPayment(ref, PREMIUM_PRICE_NGN);
  if (!paymentLink) return ctx.reply("❌ Matsala wajen ƙirƙirar payment link.");

  ctx.reply(
    `💳 Biya ₦${PREMIUM_PRICE_NGN} domin Premium\nLink: ${paymentLink}\n\nSannan rubuta:\n/verify ${ref}`,
    { parse_mode: "Markdown" }
  );
});

bot.command("verify", async (ctx) => {
  const args = ctx.message.text.split(" ");
  if (args.length < 2) return ctx.reply("⚠️ Misali: /verify tx_123456789");

  const txRef = args[1];
  console.log("Verifying txRef:", txRef);

  ctx.reply("⏳ Ana duba biyan ka...");

  const ok = await verifyPayment(txRef);
  if (!ok) return ctx.reply("❌ Biyan bai yi successful ba.");

  db.users[ctx.from.id] = { premium: true };
  saveDB();
  ctx.reply("🎉 An kunna maka Premium! Yanzu zaka iya yin chat da AI.", { parse_mode: "Markdown" });
});

// ====== AI CHAT ======
bot.on("text", async (ctx) => {
  const userId = ctx.from.id;
  console.log("Received message from", userId, "text:", ctx.message.text);

  if (!db.users[userId]?.premium) {
    return ctx.reply(
      "❌ Ba ka da Premium. Yi amfani da /premium domin samun damar amfani da Tele Tech AI Bot."
    );
  }

  ctx.sendChatAction("typing");

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Kai ne Tele Tech AI Bot, ƙwararren AI mai taimako. Ka kasance mai ladabi kuma ka bayyana komai a tsari."
        },
        { role: "user", content: ctx.message.text },
      ],
    });

    const reply = completion.choices[0].message.content;
    console.log("AI reply:", reply);
    ctx.reply(reply);
  } catch (err) {
    console.error("OPENAI ERROR:", err);
    ctx.reply("❌ Matsala a OpenAI API. A sake gwadawa daga baya.");
  }
});

// ====== LAUNCH BOT ======
bot.launch().then(() => console.log("🚀 Bot is running in DEBUG mode...")); 
