// ===============================
//      TELE TAP AI BOT
//         By ChatGPT
// ===============================

import express from "express";
import { Bot, InlineKeyboard } from "grammy";
import axios from "axios";

const app = express();

// ===============================
//   YOUR BOT TOKEN FROM RENDER
// ===============================
const bot = new Bot(process.env.BOT_TOKEN);

// ===============================
//   LINKS YOU PROVIDED
// ===============================
const YT_LINK = "https://youtu.be/ZVa0RnXWJNg?si=9fud3_z4jBSvrgSq";
const TG_CH1 = "https://t.me/tele_tap_ai";
const TG_CH2 = "https://t.me/TeleAIupdates";

// Telegram channel usernames
const CH1_NAME = "tele_tap_ai";
const CH2_NAME = "TeleAIupdates";

// ===============================
// CHECK IF USER IS SUBSCRIBED
// ===============================
async function isSubscribed(userId) {
    try {
        const ch1 = await bot.api.getChatMember(`@${CH1_NAME}`, userId);
        const ch2 = await bot.api.getChatMember(`@${CH2_NAME}`, userId);

        const valid = ["member", "administrator", "creator"];

        return (
            valid.includes(ch1.status) &&
            valid.includes(ch2.status)
        );
    } catch (e) {
        return false;
    }
}

// ===============================
//     START COMMAND
// ===============================
bot.command("start", async (ctx) => {
    const keyboard = new InlineKeyboard()
        .url("📌 Join Telegram Channel 1", TG_CH1)
        .row()
        .url("📌 Join Telegram Channel 2", TG_CH2)
        .row()
        .url("▶️ Watch YouTube Video", YT_LINK)
        .row()
        .text("✅ I have subscribed", "check_sub");

    await ctx.reply(
        "👋 *Welcome to Tele Tap AI!*\n\n" +
        "To continue using the bot, please complete the following:\n" +
        "1️⃣ Join our Telegram channels\n" +
        "2️⃣ Subscribe to our YouTube video\n\n" +
        "After doing so, click *“I have subscribed”* 👇",
        { reply_markup: keyboard, parse_mode: "Markdown" }
    );
});

// ===============================
// BUTTON HANDLER → CHECK SUB
// ===============================
bot.callbackQuery("check_sub", async (ctx) => {
    const userId = ctx.from.id;
    const ok = await isSubscribed(userId);

    if (!ok) {
        await ctx.answerCallbackQuery({
            text: "❌ You have not subscribed yet!",
            show_alert: true,
        });
        return;
    }

    await ctx.answerCallbackQuery({
        text: "✅ Subscription Verified!",
        show_alert: true,
    });

    await ctx.reply("🎉 *Welcome! You now have full access.*", {
        parse_mode: "Markdown",
    });
});

// ===============================
// CATCH UNKNOWN TEXT → FIXES
// “Unrecognized command”
// ===============================
bot.on("message", async (ctx) => {
    await ctx.reply("Use /start to begin 👇");
});

// ===============================
// EXPRESS + WEBHOOK PORT
// ===============================
app.get("/", (req, res) => {
    res.send("TELE TAP AI BOT IS RUNNING");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`BOT SERVER RUNNING ON PORT ${PORT}`);
});

bot.start();
