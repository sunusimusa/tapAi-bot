require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);

// ==== USER MUST SUBSCRIBE CHANNELS ====
const YOUTUBE_URL = "https://www.youtube.com/@Sunusicrypto";
const TG_CHANNEL_1 = "https://t.me/tele_tap_ai";
const TG_CHANNEL_2 = "https://t.me/TeleAIupdates";

// ==== MAIN MENU BUTTONS ====
function mainMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("👤 Profile", "profile")],
    [Markup.button.callback("🎁 Referral", "referral")],
    [Markup.button.callback("⚙️ Settings", "settings")],
  ]);
}

// ==== START COMMAND ====
bot.start(async (ctx) => {
  const user = ctx.from;

  const text =
    `👋 *Welcome ${user.first_name}!* \n\n` +
    `Before you use this bot, you MUST complete these steps:\n\n` +
    `1️⃣ Subscribe to YouTube channel:\n👉 ${YOUTUBE_URL}\n\n` +
    `2️⃣ Join these Telegram channels:\n👉 ${TG_CHANNEL_1}\n👉 ${TG_CHANNEL_2}\n\n` +
    `After joining, click the button below 👇`;

  await ctx.replyWithMarkdown(text,
    Markup.inlineKeyboard([
      [Markup.button.callback("✅ I Have Subscribed & Joined", "verify_sub")],
    ])
  );
});

// ==== VERIFY SUBSCRIPTION ====
bot.action("verify_sub", async (ctx) => {
  try {
    await ctx.answerCbQuery();

    // NOTE: We only verify Telegram membership (YouTube cannot be verified by API)
    const userId = ctx.from.id;

    const check1 = await ctx.telegram.getChatMember("@tele_tap_ai", userId);
    const check2 = await ctx.telegram.getChatMember("@TeleAIupdates", userId);

    const isJoined1 = ["member", "creator", "administrator"].includes(
      check1.status
    );
    const isJoined2 = ["member", "creator", "administrator"].includes(
      check2.status
    );

    if (!isJoined1 || !isJoined2) {
      return ctx.reply(
        "❌ You must join ALL required channels first!\n\n" +
          "👉 " + TG_CHANNEL_1 + "\n" +
          "👉 " + TG_CHANNEL_2,
        Markup.inlineKeyboard([
          [Markup.button.callback("🔄 Try Again", "verify_sub")],
        ])
      );
    }

    // SUCCESS → Show Menu
    await ctx.reply("🎉 *Verification Successful!*", { parse_mode: "Markdown" });
    await ctx.reply("👇 *MAIN MENU*", {
      parse_mode: "Markdown",
      ...mainMenu(),
    });
  } catch (e) {
    console.log("Verify Error:", e.message);
    ctx.reply("❌ Error checking subscription.");
  }
});

// ==== PROFILE ====
bot.action("profile", async (ctx) => {
  await ctx.answerCbQuery();
  ctx.reply(
    `👤 *Your Profile*\n\nID: ${ctx.from.id}\nName: ${ctx.from.first_name}`,
    { parse_mode: "Markdown" }
  );
});

// ==== REFERRAL SYSTEM ====
bot.action("referral", async (ctx) => {
  await ctx.answerCbQuery();

  const refLink = `https://t.me/${ctx.me}?start=${ctx.from.id}`;

  ctx.reply(
    `🎁 *Your Referral Link*\n\nShare this link:\n👉 ${refLink}`,
    { parse_mode: "Markdown" }
  );
});

// ==== SETTINGS ====
bot.action("settings", async (ctx) => {
  await ctx.answerCbQuery();
  ctx.reply("⚙️ Settings coming soon...");
});

// ==== RUN SERVER FOR RENDER ====
const PORT = process.env.PORT || 10000;

bot.launch();
console.log("Bot is running...");

// Keep server alive
const express = require("express");
const app = express();
app.get("/", (req, res) => res.send("BOT IS RUNNING"));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
