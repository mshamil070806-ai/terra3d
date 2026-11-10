const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5500;
const ROOT = __dirname;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.htm': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    let reqUrl = decodeURI(req.url.split('?')[0]);
    if (reqUrl === '/' || reqUrl === '') {
        reqUrl = '/index.html';
    }

    const safePath = path.normalize(path.join(ROOT, reqUrl));
    if (!safePath.startsWith(ROOT)) {
        res.writeHead(403);
        res.end('Access Denied');
        return;
    }

    fs.stat(safePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
        }

        const ext = path.extname(safePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', stats.size);

        if (req.method === 'HEAD') {
            res.writeHead(200);
            res.end();
            return;
        }

        const stream = fs.createReadStream(safePath);
        stream.pipe(res);
        stream.on('error', (streamErr) => {
            console.error('Stream error:', streamErr);
            if (!res.headersSent) {
                res.writeHead(500);
            }
            res.end();
        });
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Terra3D Server running at http://localhost:${PORT}/`);
});

