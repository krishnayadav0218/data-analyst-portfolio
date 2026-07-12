const { checkPassword, commitFile } = require("./_shared");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ success: false, error: "Method Not Allowed" });
    return;
  }
  try {
    const { password, content } = req.body || {};

    if (!checkPassword(password)) {
      res.status(401).json({ success: false, error: "Wrong password" });
      return;
    }
    if (!content || typeof content !== "object") {
      res.status(400).json({ success: false, error: "Missing content" });
      return;
    }

    await commitFile(content, "Update site content via admin panel");
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
