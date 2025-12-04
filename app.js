// Keep Alive server for Render
const express = require("express");
const app = express();

app.get("/", (req, res) => {
    res.send("TapAI Bot is Running");
});

app.listen(3000, () => {
    console.log("Web server running on port 3000");
});
