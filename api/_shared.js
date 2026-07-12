// Shared helper: reads & writes src/data/content.json directly in the GitHub repo
// using the GitHub Contents API. Works the same regardless of which host (Vercel/
// Netlify/custom domain) is serving the frontend, because the source of truth is
// the GitHub repo itself — every host just rebuilds from it.

const GH_API = "https://api.github.com";

function getEnv() {
  const owner = process.env.GH_OWNER;
  const repo = process.env.GH_REPO;
  const branch = process.env.GH_BRANCH || "main";
  const filePath = process.env.GH_FILE_PATH || "src/data/content.json";
  const token = process.env.GH_TOKEN;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!owner || !repo || !token || !adminPassword) {
    throw new Error(
      "Missing required env vars: GH_OWNER, GH_REPO, GH_TOKEN, ADMIN_PASSWORD"
    );
  }
  return { owner, repo, branch, filePath, token, adminPassword };
}

async function getCurrentFile() {
  const { owner, repo, branch, filePath, token } = getEnv();
  const res = await fetch(
    `${GH_API}/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    }
  );
  if (!res.ok) {
    throw new Error(`GitHub read failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  const content = Buffer.from(data.content, "base64").toString("utf-8");
  return { sha: data.sha, content };
}

async function commitFile(newContentObj, commitMessage) {
  const { owner, repo, branch, filePath, token } = getEnv();
  const { sha } = await getCurrentFile();

  const newContentStr = JSON.stringify(newContentObj, null, 2) + "\n";
  const base64Content = Buffer.from(newContentStr, "utf-8").toString("base64");

  const res = await fetch(
    `${GH_API}/repos/${owner}/${repo}/contents/${filePath}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: commitMessage || "Update site content via admin panel",
        content: base64Content,
        sha,
        branch,
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`GitHub write failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

function checkPassword(password) {
  const { adminPassword } = getEnv();
  return typeof password === "string" && password === adminPassword;
}

module.exports = { getCurrentFile, commitFile, checkPassword, getEnv };
