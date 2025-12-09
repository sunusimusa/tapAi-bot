require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");
const express = require("express");
const axios = require("axios");

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

const REQUIRED_CHANNEL = "@TeleAIupdates"; // CHANNEL NA SUBSCRIPTION
const BOT_USERNAME = "Tele_tap_ai_bot"; // BOT USERNAME
const YT_LINK = "https://youtube.com/@SunusiCrypto"; // YOUTUBE LINK

// =============== 1. CHECK SUBSCRIPTION ==================
async function checkSubscription(ctx) {
  try {
    const chatMember = await ctx.telegram.getChatMember(
      REQUIRED_CHANNEL,
      ctx.from.id
    );

    if (
      chatMember.status === "member" ||
      chatMember.status === "administrator" ||
      chatMember.status === "creator"
    ) {
      return true;
    } else {
      return false;
    }
  } catch (e) {
    return false;
  }
}

// =============== 2. START COMMAND + REFERRAL ===============
bot.start(async (ctx) => {
  const userId = ctx.from.id;
  const args = ctx.message.text.split(" ");

  let ref = null;
  if (args[1]) ref = args[1]; // REFERRAL ID

  const isSubbed = await checkSubscription(ctx);

  if (!isSubbed) {
    return ctx.reply(
      "⚠️ *Join our update channel first!*",
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.url("📢 Join Channel", "https://t.me/TeleAIupdates")],
          [Markup.button.callback("✔️ I Joined", "joined")]
        ])
      }
    );
  }

  ctx.reply(
    `👋 *Welcome to TeleTap AI Bot!*  
🤖 Powered by SunusiCrypto  
🔗 Referral: ${ref ? "User " + ref : "None"}`,
    { parse_mode: "Markdown" }
  );
});

// =============== 3. CONFIRM SUBSCRIPTION BUTTON ===============
bot.action("joined", async (ctx) => {
  const isSubbed = await checkSubscription(ctx);

  if (!isSubbed) {
    return ctx.answerCbQuery("❌ You must join first!", { show_alert: true });
  }

  ctx.reply("🎉 *Thank you for joining!* You can now use the bot.", {
    parse_mode: "Markdown"
  });
});

// =============== 4. AI CHAT SYSTEM ==================
bot.on("text", async (ctx) => {
  const isSubbed = await checkSubscription(ctx);
  if (!isSubbed) {
    return ctx.reply(
      "⚠️ You must join our channel to continue!",
      {
        ...Markup.inlineKeyboard([
          [Markup.button.url("📢 Join Channel", "https://t.me/TeleAIupdates")],
          [Markup.button.callback("✔️ I Joined", "joined")]
        ])
      }
    );
  }

  const userMessage = ctx.message.text;

  ctx.reply("⏳ AI is thinking…");

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: userMessage }],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    const aiReply = response.data.choices[0].message.content;

    ctx.reply(aiReply);
  } catch (e) {
    ctx.reply("❌ AI Service Error!");
  }
});

// =============== 5. WEBHOOK SYSTEM FOR RENDER ===============
app.use(express.json());

app.post(`/webhook/${process.env.BOT_TOKEN}`, (req, res) => {
  bot.handleUpdate(req.body);
  res.sendStatus(200);
});

app.get("/", (req, res) => {
  res.send("TeleTap AI Bot Running...");
});

// LISTEN
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bot running on port ${PORT}`));
  await bot.telegram.setWebhook(
    `https://${process.env.RENDER_EXTERNAL_HOSTNAME}/webhook/${process.env.BOT_TOKEN}`
  );
});
