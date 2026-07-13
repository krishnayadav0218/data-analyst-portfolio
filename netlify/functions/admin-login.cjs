const { checkPassword } = require("./_shared.cjs");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  try {
    const { password } = JSON.parse(event.body || "{}");
    const ok = checkPassword(password);
    return {
      statusCode: ok ? 200 : 401,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: ok }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: err.message }),
    };
  }
};
