const prisma = require("../lib/prisma");
const { customAlphabet } = require("nanoid");

const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const nano = customAlphabet(alphabet, 8);

function isValidCode(code) {
  return /^[A-Za-z0-9]{6,8}$/.test(code);
}

async function createLink(req, res) {
  try {
    const { targetUrl, code: requestedCode } = req.body;

    if (!targetUrl) {
      return res.status(400).json({ error: "targetUrl is required" });
    }
    try {
      new URL(targetUrl);
    } catch (err) {
      return res.status(400).json({ error: "Invalid URL" });
    }

    let code = requestedCode;
    if (code) {
      if (!isValidCode(code)) {
        return res.status(400).json({
          error: "Custom code must match [A-Za-z0-9]{6,8}",
        });
      }
      const exists = await prisma.link.findUnique({ where: { code } });
      if (exists) return res.status(409).json({ error: "Code already exists" });
    } else {
      let tries = 0;
      do {
        code = nano();
        const exists = await prisma.link.findUnique({ where: { code } });
        if (!exists) break;
        tries++;
      } while (tries < 5);
    }

    const link = await prisma.link.create({
      data: {
        code,
        targetUrl,
      },
    });

    return res.status(201).json(link);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function listLinks(req, res) {
  try {
    const links = await prisma.link.findMany({ orderBy: { createdAt: "desc" } });
    return res.json(links);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function getLink(req, res) {
  try {
    const code = req.params.code;
    const link = await prisma.link.findUnique({ where: { code } });
    if (!link) return res.status(404).json({ error: "404 Not found" });
    return res.json(link);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function deleteLink(req, res) {
  try {
    const code = req.params.code;
    const link = await prisma.link.findUnique({ where: { code } });
    if (!link) return res.status(404).json({ error: "404 Not found" });
    await prisma.link.delete({ where: { code } });
    return res.redirect(303, "/");
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function renderDashboard(req, res) {
  const { id } = req.query;
  const links = await prisma.link.findMany({ orderBy: { createdAt: "desc" } });

  res.render("home", {
    links,
    id,
    baseUrl: process.env.BASE_URL || `http://localhost:${process.env.PORT || 8000}`
  });
}


async function handleCreateFromForm(req, res) {
  try {
    const { url: targetUrl, customCode } = req.body;

    let code = customCode;
    if (code) {
      if (!isValidCode(code)) return res.status(400).json({error:"Invalid code"});
      const exists = await prisma.link.findUnique({ where: { code } });
      if (exists) return res.status(409).json({error:"Code already exists"});
    } else {
      code = nano();
    }
    const result = await prisma.link.create({
      data: { code, targetUrl }
    });
    const links = await prisma.link.findMany({ orderBy: { createdAt: "desc" } });
    const baseUrl = process.env.BASE_URL || "http://localhost:8000";

    return res.redirect(`/?id=${result.code}`);

  } catch (err) {
    console.error(err);
    res.status(400).send("Error creating link");
  }
}

async function redirectByCode(req, res) {
  const code = req.params.code;
  const link = await prisma.link.findUnique({ where: { code } });
  if (!link) return res.status(404).json({error:"404 Not found"});

  await prisma.link.update({
    where: { code },
    data: {
      totalClicks: { increment: 1 },
      lastClicked: new Date()
    }
  });

  return res.redirect(302,link.targetUrl);
}

async function renderStatsPage(req, res) {
  const code = req.params.code;
  const link = await prisma.link.findUnique({ where: { code } });
  if (!link) return res.status(404).send("Not found");

  const baseUrl = process.env.BASE_URL || "http://localhost:8000";

  res.render("stats", { link, baseUrl });
}

module.exports = {
  createLink,
  listLinks,
  getLink,
  deleteLink,
  renderDashboard,
  handleCreateFromForm,
  redirectByCode,
  renderStatsPage,
};
