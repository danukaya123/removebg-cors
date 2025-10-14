export default async function handler(req, res) {
method: req.method,
// Filter hop-by-hop headers
headers: {}
};


// Copy headers except host and origin (and some hop-by-hop)
const hopByHop = ['host','connection','keep-alive','proxy-authenticate','proxy-authorization','te','trailers','transfer-encoding','upgrade'];
for (const [k, v] of Object.entries(req.headers)) {
const lk = k.toLowerCase();
if (lk === 'origin') continue; // don't forward original Origin
if (lk === 'referer') continue;
if (hopByHop.includes(lk)) continue;
fetchOptions.headers[k] = v;
}


// Forward body for methods that allow it
if (['POST','PUT','PATCH','DELETE'].includes(req.method.toUpperCase())) {
// When running on Vercel serverless, the request body is available as a stream.
// We can pipe raw body by using the Request constructor if available, but
// simplest approach is to read the body as a buffer.
const buffers = [];
for await (const chunk of req) buffers.push(chunk);
const body = Buffer.concat(buffers);
if (body.length) fetchOptions.body = body;
}


// Use global fetch (available on Vercel)
const upstreamRes = await fetch(url, fetchOptions);


// Copy status
res.status(upstreamRes.status);


// Copy response headers, but override CORS headers
upstreamRes.headers.forEach((value, key) => {
const lk = key.toLowerCase();
if (['access-control-allow-origin','access-control-allow-credentials','access-control-allow-methods','access-control-allow-headers'].includes(lk)) return;
res.setHeader(key, value);
});


// Ensure we return appropriate content-type and CORS
res.setHeader('Access-Control-Allow-Origin', allowOrigin || 'null');
res.setHeader('Access-Control-Allow-Credentials', 'true');


// Stream response body
const reader = upstreamRes.body?.getReader?.();
if (reader) {
//stream
const stream = new ReadableStream({
start(controller) {
function push() {
reader.read().then(({ done, value }) => {
if (done) {
controller.close();
return;
}
controller.enqueue(value);
push();
}).catch(err => controller.error(err));
}
push();
}
});


const resBody = await new Response(stream).arrayBuffer();
res.end(Buffer.from(resBody));
return;
}


// Fallback: get as arrayBuffer/text
const buffer = Buffer.from(await upstreamRes.arrayBuffer());
res.end(buffer);


} catch (err) {
console.error('Proxy error:', err);
res.status(500).json({ error: 'Proxy failed', details: String(err) });
}
}
