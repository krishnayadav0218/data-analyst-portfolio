const { checkPassword, commitFile } = require("./_shared");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  try {
    const { password, content } = JSON.parse(event.body || "{}");

    if (!checkPassword(password)) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, error: "Wrong password" }),
      };
    }
    if (!content || typeof content !== "object") {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: "Missing content" }),
      };
    }

    await commitFile(content, "Update site content via admin panel");

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: err.message }),
    };
  }
};
