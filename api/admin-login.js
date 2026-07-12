const { checkPassword } = require("./_shared");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ success: false, error: "Method Not Allowed" });
    return;
  }
  try {
    const { password } = req.body || {};
    const ok = checkPassword(password);
    res.status(ok ? 200 : 401).json({ success: ok });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
