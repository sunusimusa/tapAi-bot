const { Telegraf, Markup } = require("telegraf");
require("dotenv").config();

// === TOKEN ===
// SAKA TOKEN DINKA A NAN ↓↓↓↓
const bot = new Telegraf(process.env.BOT_TOKEN);

// ==== USER DATA (simple in-memory) ====
let users = {};

// ==== MAIN MENU KEYBOARD ====
const mainMenu = Markup.keyboard([
  ["💰 Earn Coins", "👥 Referral"],
  ["💳 Check Balance", "📌 Requirements"]
]).resize();

// ==== START ====
bot.start((ctx) => {
  const uid = ctx.from.id;

  // Register new user
  if (!users[uid]) {
    users[uid] = { coins: 0, refs: 0 };
  }

  ctx.reply(
    "👋 Welcome to *Tap AI Bot!* Zaka iya amfani da menu.",
    { parse_mode: "Markdown", ...mainMenu }
  );
});

// ==== MENU COMMAND ====
bot.command("menu", (ctx) => {
  ctx.reply("👉 Main Menu", mainMenu);
});

// ==== EARN COINS ====
bot.hears("💰 Earn Coins", (ctx) => {
  const uid = ctx.from.id;

  users[uid].coins += 1;

  ctx.reply(`✅ Ka samu **+1 coin!**\n\n*Total:* ${users[uid].coins} coins`, {
    parse_mode: "Markdown",
    ...mainMenu
  });
});

// ==== REFERRAL ====
bot.hears("👥 Referral", (ctx) => {
  const uid = ctx.from.id;

  const link = `https://t.me/${ctx.botInfo.username}?start=${uid}`;

  ctx.reply(
    `👥 *Invite Friends*\n\nKa tura wannan link:\n${link}\n\n👍 Kana samun 2 coins daga kowanne.`,
    { parse_mode: "Markdown", ...mainMenu }
  );
});

// ==== CHECK BALANCE ====
bot.hears("💳 Check Balance", (ctx) => {
  const uid = ctx.from.id;

  ctx.reply(
    `💳 *Balance*\n\nCoins: ${users[uid].coins}\nReferrals: ${users[uid].refs}`,
    { parse_mode: "Markdown", ...mainMenu }
  );
});

// ==== REQUIREMENTS ====
bot.hears("📌 Requirements", (ctx) => {
  ctx.reply(
    "📌 *Subscribe Requirements*\n\n1. Join channel: https://t.me/tele_tap_ai\n2. Join updates: https://t.me/TeleAIupdates\n3. Subscribe YouTube: https://youtube.com/@Sunusicrypto",
    { parse_mode: "Markdown", ...mainMenu }
  );
});

// ==== REFERRAL AUTO CREDIT ====
bot.start((ctx) => {
  const uid = ctx.from.id;
  const ref = ctx.message.text.split(" ")[1];

  if (!users[uid]) {
    users[uid] = { coins: 0, refs: 0 };
  }

  if (ref && ref != uid && users[ref]) {
    users[ref].refs += 1;
    users[ref].coins += 2;
  }

  ctx.reply("👋 Welcome! Tura /menu ka fara.", mainMenu);
});

// ==== FIX FOR RENDER.COM ====
const PORT = process.env.PORT || 10000;
bot.launch();
console.log("Server running on port", PORT);

// Graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
