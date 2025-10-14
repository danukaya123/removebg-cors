export default async function handler(req, res) {
  try {
    // 1) CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    // 2) Preflight request
    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }

    // 3) Get target URL
    const targetUrl = req.query.url;
    if (!targetUrl) {
      return res.status(400).json({ error: "Missing 'url' query parameter" });
    }

    // 4) Prepare fetch options
    const fetchOptions = {
      method: req.method,
      headers: {}
    };

    // Copy headers except host/origin
    for (const [key, value] of Object.entries(req.headers)) {
      const lower = key.toLowerCase();
      if (["host", "origin", "referer"].includes(lower)) continue;
      fetchOptions.headers[key] = value;
    }

    // 5) Attach body if needed
    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method.toUpperCase())) {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      fetchOptions.body = Buffer.concat(chunks);
    }

    // 6) Call the target URL
    const response = await fetch(targetUrl, fetchOptions);

    // 7) Copy status code
    res.status(response.status);

    // 8) Copy response headers (except CORS)
    response.headers.forEach((value, key) => {
      if (!key.toLowerCase().startsWith("access-control-")) {
        res.setHeader(key, value);
      }
    });

    // 9) Return the body
    const buffer = Buffer.from(await response.arrayBuffer());
    return res.send(buffer);

  } catch (error) {
    console.error("Proxy Error:", error);
    return res.status(500).json({ error: "Proxy Error", details: error.message });
  }
}
