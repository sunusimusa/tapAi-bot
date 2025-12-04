# main.py — simple TapAi MVP (SQLite)
import os
import sqlite3
import time
import random
from dotenv import load_dotenv
from telegram import Bot, Update, ParseMode
from telegram.ext import Updater, CommandHandler, CallbackContext

load_dotenv()
BOT_TOKEN = os.getenv("BOT_TOKEN")
POINTS_TO_TTAI = int(os.getenv("POINTS_TO_TTAI", "2000"))
ONE_TAP_POINTS = int(os.getenv("ONE_TAP_POINTS", "5"))
CLAIM_MIN_POINTS = int(os.getenv("CLAIM_MIN_POINTS", "2000"))
DAILY_TAP_LIMIT = int(os.getenv("DAILY_TAP_LIMIT", "100"))
ENERGY_MAX = int(os.getenv("ENERGY_MAX", "10"))
ADMIN_IDS = [int(x.strip()) for x in os.getenv("ADMIN_IDS","").split(",") if x.strip()]
YT_VIDEO = os.getenv("YT_VIDEO","")
CHANNEL_ID = os.getenv("CHANNEL_ID") or "@TeleAIupdates"
GROUP_ID = os.getenv("GROUP_ID") or "@tele_tap_ai"

DB = "tapai.db"

def init_db():
    conn = sqlite3.connect(DB, check_same_thread=False)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users (
                   telegram_id INTEGER PRIMARY KEY,
                   username TEXT,
                   points INTEGER DEFAULT 0,
                   energy INTEGER DEFAULT ?,
                   last_tap INTEGER DEFAULT 0,
                   total_points INTEGER DEFAULT 0,
                   level INTEGER DEFAULT 1,
                   referrer INTEGER,
                   created INTEGER DEFAULT ?)''', (ENERGY_MAX, int(time.time())))
    c.execute('''CREATE TABLE IF NOT EXISTS taps (
                   id INTEGER PRIMARY KEY AUTOINCREMENT,
                   telegram_id INTEGER,
                   ts INTEGER)''')
    c.execute('''CREATE TABLE IF NOT EXISTS claims (
                   id INTEGER PRIMARY KEY AUTOINCREMENT,
                   telegram_id INTEGER,
                   points INTEGER,
                   ttc_amount REAL,
                   status TEXT DEFAULT 'pending',
                   created_at INTEGER DEFAULT ?)''', (int(time.time()),))
    conn.commit()
    return conn

conn = init_db()

def ensure_user(telegram_id, username=None):
    c = conn.cursor()
    c.execute("INSERT OR IGNORE INTO users(telegram_id, username, created) VALUES(?,?,?)",
              (telegram_id, username or "", int(time.time())))
    conn.commit()
    c.execute("SELECT * FROM users WHERE telegram_id=?", (telegram_id,))
    return c.fetchone()

def update_user_points(uid, delta):
    c = conn.cursor()
    c.execute("UPDATE users SET points = points + ?, total_points = total_points + ? WHERE telegram_id=?",
              (delta, delta, uid))
    conn.commit()

def cmd_start(update: Update, context: CallbackContext):
    user = update.effective_user
    args = context.args
    ensure_user(user.id, user.username)
    # referral handling simple: if arg is numeric and not self
    if args:
        try:
            ref = int(args[0])
            if ref != user.id:
                c = conn.cursor()
                c.execute("SELECT * FROM users WHERE telegram_id=?", (ref,))
                if c.fetchone():
                    # give referrer and referee bonuses if not already referred
                    c.execute("SELECT referrer FROM users WHERE telegram_id=?", (user.id,))
                    existing_ref = c.fetchone()
                    if not existing_ref or existing_ref[0] is None:
                        c.execute("UPDATE users SET referrer=? WHERE telegram_id=?", (ref, user.id))
                        c.execute("UPDATE users SET points = points + ? WHERE telegram_id=?", (1500, ref))
                        c.execute("UPDATE users SET points = points + ? WHERE telegram_id=?", (500, user.id))
                        conn.commit()
        except:
            pass
    text = ("Barka da zuwa *TapAi*!\n\n"
            "Commands:\n"
            "/tap - Tap to earn\n"
            "/me - Show your stats\n"
            "/daily - Daily claim\n"
            "/tasks - Show tasks\n"
            "/do_task <group|channel|youtube> - Submit a task\n"
            "/ref - Get your referral link\n"
            "/claim - Redeem points (admin processes payouts)\n")
    update.message.reply_text(text, parse_mode=ParseMode.MARKDOWN)

def cmd_me(update: Update, context: CallbackContext):
    user = update.effective_user
    ensure_user(user.id, user.username)
    c = conn.cursor()
    c.execute("SELECT points,energy,total_points,level FROM users WHERE telegram_id=?", (user.id,))
    row = c.fetchone()
    pts, energy, total, level = row
    update.message.reply_text(f"Points: {pts}\nEnergy: {energy}\nLevel: {level}\nTotal earned: {total}")

def cmd_tap(update: Update, context: CallbackContext):
    user = update.effective_user
    ensure_user(user.id, user.username)
    c = conn.cursor()
    c.execute("SELECT energy, points, total_points FROM users WHERE telegram_id=?", (user.id,))
    energy, points, total = c.fetchone()
    # energy check
    if energy <= 0:
        return update.message.reply_text("No energy left. Wait for regen or do tasks.")
    # taps today limit
    today_start = int(time.time()) - (int(time.time()) % 86400)
    c.execute("SELECT COUNT(*) FROM taps WHERE telegram_id=? AND ts>=?", (user.id, today_start))
    taps_today = c.fetchone()[0]
    if taps_today >= DAILY_TAP_LIMIT:
        return update.message.reply_text("You reached daily tap limit.")
    # award
    award = ONE_TAP_POINTS
    c.execute("UPDATE users SET points = points + ?, energy = energy - 1, total_points = total_points + ? WHERE telegram_id=?",
              (award, award, user.id))
    c.execute("INSERT INTO taps(telegram_id, ts) VALUES(?,?)", (user.id, int(time.time())))
    conn.commit()
    c.execute("SELECT points, energy FROM users WHERE telegram_id=?", (user.id,))
    pts, eng = c.fetchone()
    update.message.reply_text(f"+{award} points! Total: {pts}. Energy: {eng}")

def cmd_daily(update: Update, context: CallbackContext):
    user = update.effective_user
    ensure_user(user.id, user.username)
    c = conn.cursor()
    # check last daily via claims with status 'daily'
    c.execute("SELECT created_at FROM claims WHERE telegram_id=? AND status='daily' ORDER BY created_at DESC LIMIT 1", (user.id,))
    last = c.fetchone()
    now = int(time.time())
    if last and (now - last[0]) < 24*3600:
        return update.message.reply_text("Daily already claimed. Try again later.")
    reward = random.randint(800,1500)
    c.execute("UPDATE users SET points = points + ? WHERE telegram_id=?", (reward, user.id))
    c.execute("INSERT INTO claims(telegram_id, points, ttc_amount, status, created_at) VALUES(?,?,?,?,?)",
              (user.id, reward, 0.0, 'daily', now))
    conn.commit()
    update.message.reply_text(f"Daily claimed: +{reward} points!")

def cmd_tasks(update: Update, context: CallbackContext):
    text = (f"Tasks:\n"
            f"1) Join Group -> {GROUP_ID}  (+1200)\n"
            f"2) Join Channel -> {CHANNEL_ID}  (+2500)\n"
            f"3) Watch YouTube -> {YT_VIDEO}  (+2000, manual verify)\n\n"
            "Use /do_task group|channel|youtube to submit.")
    update.message.reply_text(text)

def cmd_do_task(update: Update, context: CallbackContext):
    user = update.effective_user
    args = context.args
    if not args:
        return update.message.reply_text("Usage: /do_task group|channel|youtube")
    t = args[0].lower()
    ensure_user(user.id, user.username)
    c = conn.cursor()
    if t == "group":
        # verify membership
        try:
            member = context.bot.get_chat_member(GROUP_ID, user.id)
            if member.status in ('member','administrator','creator'):
                c.execute("UPDATE users SET points = points + ? WHERE telegram_id=?", (1200, user.id))
                conn.commit()
                return update.message.reply_text("Group join verified +1200 points!")
            else:
                return update.message.reply_text("You are not a member of the group yet.")
        except Exception as e:
            return update.message.reply_text("Unable to verify membership. Make sure bot is admin in group.")
    elif t == "channel":
        try:
            member = context.bot.get_chat_member(CHANNEL_ID, user.id)
            if member.status in ('member','administrator','creator'):
                c.execute("UPDATE users SET points = points + ? WHERE telegram_id=?", (2500, user.id))
                conn.commit()
                return update.message.reply_text("Channel join verified +2500 points!")
            else:
                return update.message.reply_text("You are not a member of the channel yet.")
        except Exception as e:
            return update.message.reply_text("Unable to verify membership for channel.")
    elif t == "youtube":
        # insert youtube pending for admin review
        c.execute("INSERT INTO claims(telegram_id, points, ttc_amount, status, created_at) VALUES(?,?,?,?,?)",
                  (user.id, 2000, 0.0, 'youtube_pending', int(time.time())))
        conn.commit()
        return update.message.reply_text("YouTube task submitted for review. Admin will approve soon.")
    else:
        return update.message.reply_text("Unknown task type.")

def cmd_ref(update: Update, context: CallbackContext):
    user = update.effective_user
    bot_user = context.bot.get_me()
    link = f"https://t.me/{bot_user.username}?start={user.id}"
    update.message.reply_text(f"Your referral link:\n{link}")

def cmd_claim(update: Update, context: CallbackContext):
    user = update.effective_user
    ensure_user(user.id, user.username)
    c = conn.cursor()
    c.execute("SELECT points FROM users WHERE telegram_id=?", (user.id,))
    pts = c.fetchone()[0]
    if pts < CLAIM_MIN_POINTS:
        return update.message.reply_text(f"You need at least {CLAIM_MIN_POINTS} points to claim.")
    ttc = round(pts / POINTS_TO_TTAI, 9)
    c.execute("INSERT INTO claims(telegram_id, points, ttc_amount, status, created_at) VALUES(?,?,?,?,?)",
              (user.id, pts, ttc, 'pending', int(time.time())))
    c.execute("UPDATE users SET points = 0 WHERE telegram_id=?", (user.id,))
    conn.commit()
    update.message.reply_text(f"Claim submitted for {ttc} TTAI. Admin will process soon.")

def admin_only(func):
    def wrapper(update: Update, context: CallbackContext):
        if update.effective_user.id not in ADMIN_IDS:
            return update.message.reply_text("You are not admin.")
        return func(update, context)
    return wrapper

@admin_only
def cmd_process_claims(update: Update, context: CallbackContext):
    c = conn.cursor()
    c.execute("SELECT id,telegram_id,points,ttc_amount FROM claims WHERE status='pending' LIMIT 10")
    rows = c.fetchall()
    if not rows:
        return update.message.reply_text("No pending claims.")
    processed = 0
    for r in rows:
        cid, uid, pts, ttc = r
        # HERE: integrate on-chain transfer using your custodial wallet (Ton SDK)
        # For now we mark processed
        c.execute("UPDATE claims SET status='done' WHERE id=?", (cid,))
        processed += 1
    conn.commit()
    update.message.reply_text(f"Processed {processed} claims (mock).")

@admin_only
def cmd_approve_youtube(update: Update, context: CallbackContext):
    c = conn.cursor()
    c.execute("SELECT id,telegram_id FROM claims WHERE status='youtube_pending' LIMIT 20")
    rows = c.fetchall()
    if not rows:
        return update.message.reply_text("No youtube tasks pending.")
    for r in rows:
        cid, uid = r
        c.execute("UPDATE claims SET status='done', ttc_amount=0 WHERE id=?", (cid,))
        c.execute("UPDATE users SET points = points + ? WHERE telegram_id=?", (2000, uid))
        try:
            context.bot.send_message(uid, "Your YouTube task was approved: +2000 points!")
        except:
            pass
    conn.commit()
    update.message.reply_text(f"Approved {len(rows)} youtube tasks.")

def main():
    updater = Updater(BOT_TOKEN, use_context=True)
    dp = updater.dispatcher
    dp.add_handler(CommandHandler("start", cmd_start, pass_args=True))
    dp.add_handler(CommandHandler("me", cmd_me))
    dp.add_handler(CommandHandler("tap", cmd_tap))
    dp.add_handler(CommandHandler("daily", cmd_daily))
    dp.add_handler(CommandHandler("tasks", cmd_tasks))
    dp.add_handler(CommandHandler("do_task", cmd_do_task, pass_args=True))
    dp.add_handler(CommandHandler("ref", cmd_ref))
    dp.add_handler(CommandHandler("claim", cmd_claim))
    dp.add_handler(CommandHandler("process_claims", cmd_process_claims))
    dp.add_handler(CommandHandler("approve_youtube", cmd_approve_youtube))
    updater.start_polling()
    updater.idle()

if __name__ == "__main__":
    main()
