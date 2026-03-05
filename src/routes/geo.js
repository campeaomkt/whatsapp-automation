const express = require("express");
const router = express.Router();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

router.get("/", async (req, res) => {
  try {
    const r = await fetch("https://ipapi.co/json/");
    const data = await r.json();
    res.json({ ddi: data.country_calling_code || "" });
  } catch (e) {
    res.json({ ddi: "" });
  }
});

module.exports = router;