import { Readable } from "stream";
import Busboy from "busboy";
import FormData from "form-data";
import fetch from "node-fetch";

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  // 1) CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );

  // 2) Handle preflight
  if (req.method === "OPTIONS") return res.status(204).end();

  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).json({ error: "Missing 'url' query param" });

  try {
    const form = new FormData();

    // Parse multipart/form-data using Busboy
    await new Promise((resolve, reject) => {
      const busboy = Busboy({ headers: req.headers });
      busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
        form.append(fieldname, file, { filename, contentType: mimetype });
      });
      busboy.on("field", (name, val) => form.append(name, val));
      busboy.on("finish", resolve);
      busboy.on("error", reject);
      req.pipe(busboy);
    });

    // Send the request to Hugging Face Space
    const response = await fetch(targetUrl, {
      method: req.method,
      body: form,
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get("content-type") || "application/octet-stream";
    res.setHeader("Content-Type", contentType);

    res.status(response.status).send(buffer);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Proxy Error", details: err.message });
  }
}
