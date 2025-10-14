import Busboy from "busboy";
import fetch from "node-fetch";
import FormData from "form-data";

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).json({ error: "Missing 'url' query parameter" });

  try {
    if (req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "*");
      return res.status(204).end();
    }

    const form = new FormData();

    // Parse the incoming multipart/form-data
    const busboy = Busboy({ headers: req.headers });
    const finishPromise = new Promise((resolve, reject) => {
      busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
        form.append(fieldname, file, { filename, contentType: mimetype });
      });
      busboy.on("field", (fieldname, value) => {
        form.append(fieldname, value);
      });
      busboy.on("error", reject);
      busboy.on("finish", resolve);
    });

    req.pipe(busboy);
    await finishPromise;

    // Forward to Hugging Face Space
    const response = await fetch(targetUrl, {
      method: req.method,
      body: form,
    });

    // Forward headers + CORS
    const contentType = response.headers.get("content-type") || "application/octet-stream";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Access-Control-Allow-Origin", "*");

    const buffer = Buffer.from(await response.arrayBuffer());
    res.status(response.status).send(buffer);

  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({ error: "Proxy Error", details: error.message });
  }
}
