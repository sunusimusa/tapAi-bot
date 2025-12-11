// app.js — Tele Tech AI Bot (Webhook single-file)
import express from "express";
import bodyParser from "body-parser";
import fs from "fs";
import axios from "axios";
import OpenAI from "openai";
import { Telegraf } from "telegraf";

// ========== ENV ==========
const BOT_TOKEN = process.env.BOT_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;
const PREMIUM_PRICE_NGN = process.env.PREMIUM_PRICE_NGN || 1000;
const DB_FILE = process.env.DB_FILE || "./data/db.json";
const PORT = process.env.PORT || 10000;

// ========== DEBUG ENV CHECK ==========
console.log("==== Tele Tech AI Bot (WEBHOOK) Starting ====");
console.log("BOT_TOKEN:", BOT_TOKEN ? "SET" : "MISSING");
console.log("OPENAI_API_KEY:", OPENAI_API_KEY ? "SET" : "MISSING");
console.log("FLW_SECRET_KEY:", FLW_SECRET_KEY ? "SET" : "MISSING");
console.log("DB_FILE:", DB_FILE);
console.log("PORT:", PORT);
console.log("============================================");

// ========== PREP DB ==========
if (!fs.existsSync("./data")) {
  try {
    fs.mkdirSync("./data");
    console.log("Created ./data directory");
  } catch (e) {
    console.error("Could not create ./data:", e.message);
  }
}
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ users: {} }, null, 2));
  console.log("Created db file at", DB_FILE);
}

let db = { users: {} };
try {
  db = JSON.parse(fs.readFileSync(DB_FILE));
} catch (e) {
  console.error("Error reading DB_FILE:", e.message);
}
function saveDB() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// ========== INIT Clients ==========
const app = express();
app.use(bodyParser.json({ limit: "1mb" })); // parse incoming JSON
const bot = new Telegraf(BOT_TOKEN);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// ========== FLUTTERWAVE HELPERS ==========
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
        customizations: { title: "Tele Tech AI Premium", description: "Premium access" },
      },
      { headers: { Authorization: `Bearer ${FLW_SECRET_KEY}` } }
    );
    return res.data.data.link;
  } catch (err) {
    console.error("FLW createPayment error:", err.response?.data || err.message);
    return null;
  }
}

async function verifyPayment(txRef) {
  try {
    const res = await axios.get(
      `https://api.flutterwave.com/v3/transactions?tx_ref=${txRef}`,
      { headers: { Authorization: `Bearer ${FLW_SECRET_KEY}` } }
    );
    const list = res.data.data;
    if (!list || list.length === 0) return false;
    return list[0].status === "successful";
  } catch (err) {
    console.error("FLW verifyPayment error:", err.response?.data || err.message);
    return false;
  }
}

// ========== TELEGRAM COMMANDS (logic) ==========
bot.start((ctx) => {
  console.log("/start from", ctx.from?.id);
  ctx.reply(
    "👋 Barka da zuwa *Tele Tech AI Bot!* \n\n" +
      "Yi amfani da /premium domin kunna Premium AI Access.\n" +
      "Bayan biyan ka rubuta /verify <tx_ref> don kunna premium.",
    { parse_mode: "Markdown" }
  );
});

bot.command("premium", async (ctx) => {
  const userId = ctx.from.id;
  const ref = `tx_${userId}_${Date.now()}`;
  console.log("Generating payment link for", userId, "ref", ref);

  const link = await createPayment(ref, PREMIUM_PRICE_NGN);
  if (!link) {
    return ctx.reply("❌ Matsala wajen ƙirƙirar payment link. Sai a gwada daga baya.");
  }

  return ctx.reply(
    `💳 *Premium Price:* ₦${PREMIUM_PRICE_NGN}\n` +
      `Bi wannan link din ka biya:\n${link}\n\n` +
      `Bayan ka biya, rubuta: /verify ${ref}`,
    { parse_mode: "Markdown" }
  );
});

bot.command("verify", async (ctx) => {
  const parts = ctx.message.text.split(" ");
  if (parts.length < 2) return ctx.reply("⚠️ Misali: /verify tx_123456789");

  const txRef = parts[1];
  console.log("Verifying txRef:", txRef, "for user", ctx.from.id);

  await ctx.reply("⏳ Ana duba biyan ka...");

  const ok = await verifyPayment(txRef);
  if (!ok) {
    return ctx.reply("❌ Biyan bai samu successful ba. Ka tabbata ka biya da tx_ref ɗin daidai.");
  }

  db.users[ctx.from.id] = { premium: true };
  saveDB();
  return ctx.reply("🎉 *An kunna maka Premium!* Yanzu zaka iya amfani da AI.", { parse_mode: "Markdown" });
});

// ========== AI CHAT HANDLER ==========
bot.on("text", async (ctx) => {
  const userId = ctx.from.id;
  const text = ctx.message.text;
  console.log("Received message from", userId, "text:", text);

  if (!db.users[userId]?.premium) {
    return ctx.reply("⚠️ Ba ka da Premium. Yi amfani da /premium domin samun damar amfani da Tele Tech AI Bot.");
  }

  await ctx.sendChatAction("typing");

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Kai ne Tele Tech AI Bot, ƙwararren AI mai taimako. Ka kasance mai ladabi, ka bayyana komai a tsari."
        },
        { role: "user", content: text },
      ],
    });

    const reply = completion.choices?.[0]?.message?.content || "🔎 Babu amsa daga OpenAI.";
    console.log("Replying to", userId, "=>", reply.slice(0, 200));
    return ctx.reply(reply);
  } catch (err) {
    console.error("OPENAI ERROR:", err.response?.data || err.message || err);
    return ctx.reply("❌ Akwai matsala tare da OpenAI. A sake gwadawa daga baya.");
  }
});

// ========== WEBHOOK ROUTE ==========
app.post("/webhook", async (req, res) => {
  try {
    // debug log incoming update
    console.log("Incoming update:", JSON.stringify(req.body).slice(0, 1000));
    await bot.handleUpdate(req.body); // pass update to telegraf
    res.sendStatus(200);
  } catch (e) {
    console.error("Webhook handling error:", e);
    res.sendStatus(500);
  }
});

// optional root
app.get("/", (req, res) => {
  res.send("Tele Tech AI Bot is running (webhook mode).");
});

// ========== START SERVER ==========
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log("Ensure you have set Telegram webhook to: ");
  console.log(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=https://tapai-bot.onrender.com/webhook`);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Bot running on port " + PORT);
});
