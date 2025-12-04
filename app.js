const { Bot } = require("grammy");
const bot = new Bot(process.env.BOT_TOKEN);

// Commands
bot.command("start", ctx => ctx.reply("Welcome to TapAI bot!"));

// All handlers here...


bot.start(); // ← Ka saka nan kawai

// Render Keep Alive Server
const express = require("express");
const app = express();

app.get("/", (req, res) => {
    res.send("TapAI Bot is Running");
});

app.listen(3000, () => {
    console.log("Web server running on port 3000");
});
const { Bot } = require("grammy");
const express = require("express");

// Create bot
const bot = new Bot(process.env.BOT_TOKEN);

// Commands
bot.command("start", ctx => {
    ctx.reply("👋 Welcome to TapAI bot!\n\nType /menu to open the game menu.");
});

bot.command("menu", ctx => {
    ctx.reply(
`📍 *TapAI Menu*

1️⃣ /tap - Tap to earn points
2️⃣ /claim - Claim rewards
3️⃣ /daily - Daily bonus
4️⃣ /energy - Check your energy
5️⃣ /invite - Get your invite link
6️⃣ /comment - Send feedback

Enjoy the game! 🚀`,
        { parse_mode: "Markdown" }
    );
});

bot.command("tap", ctx => {
    ctx.reply("🖐️ You tapped!\n+5 points added!");
});

bot.command("claim", ctx => {
    ctx.reply("🎁 You claimed your reward!");
});

bot.command("daily", ctx => {
    ctx.reply("🔥 Your daily bonus has been claimed!");
});

bot.command("energy", ctx => {
    ctx.reply("⚡ Your current energy: 10/10");
});

bot.command("invite", ctx => {
    const id = ctx.from.id;
    ctx.reply(
`🔗 *Invite Link:*
https://t.me/${ctx.me.username}?start=${id}`,
        { parse_mode: "Markdown" }
    );
});

bot.command("comment", ctx => {
    ctx.reply("📝 Send your comment. I will deliver it to admin.");
});

// Start bot
bot.start();
console.log("🤖 TapAI Bot is running...");

// Keep alive server for Render
const app = express();

app.get("/", (req, res) => {
    res.send("TapAI Bot server is active.");
});

app.listen(3000, () => {
    console.log("🌐 Web server running on port 3000");
});
