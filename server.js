
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;
const publicDir = path.join(__dirname, "public");
const dataFile = path.join(__dirname, "messages.json");

if (!fs.existsSync(dataFile)) {
  fs.writeFileSync(dataFile, "[]", "utf8");
}

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

function readMessages() {
  const messages = JSON.parse(fs.readFileSync(dataFile, "utf8"));

  if (!Array.isArray(messages)) {
    throw new Error("Invalid messages file");
  }

  return messages;
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
  // Get all saved messages
  if (req.method === "GET" && req.url === "/messages") {
    try {
      return sendJson(res, 200, readMessages());
    } catch (error) {
      return sendJson(res, 500, { error: "Could not read messages" });
    }
  }

  // Save a new message
  if (req.method === "POST" && req.url === "/messages") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;

      if (body.length > 10000) {
        res.writeHead(413);
        res.end("Request too large");
        req.destroy();
      }
    });

    req.on("end", () => {
      try {
        const input = JSON.parse(body);
        const name = typeof input.name === "string" ? input.name.trim() : "";
        const message =
          typeof input.message === "string" ? input.message.trim() : "";

        if (!name || !message) {
          return sendJson(res, 400, {
            error: "Name and message are required",
          });
        }

        if (name.length > 100 || message.length > 5000) {
          return sendJson(res, 400, { error: "Input is too long" });
        }

        const messages = readMessages();

        const newMessage = {
          id: Date.now().toString() + Math.random().toString(36).slice(2),
          name,
          message,
          createdAt: new Date().toISOString(),
        };

        // Newest message comes first
        messages.unshift(newMessage);

        fs.writeFileSync(dataFile, JSON.stringify(messages, null, 2), "utf8");

        return sendJson(res, 201, newMessage);
      } catch (error) {
        return sendJson(res, 400, { error: "Invalid data or file error" });
      }
    });

    return;
  }

  // Serve the HTML, CSS, and JavaScript files
  if (req.method === "GET") {
    const pathname = new URL(req.url, "http://localhost").pathname;
    const relativePath =
      pathname === "/" ? "index.html" : pathname.slice(1);

    const filePath = path.resolve(publicDir, relativePath);

    if (!filePath.startsWith(publicDir + path.sep)) {
      res.writeHead(403);
      return res.end("Forbidden");
    }

    fs.readFile(filePath, (error, content) => {
      if (error) {
        res.writeHead(404);
        return res.end("File not found");
      }

      res.writeHead(200, {
        "Content-Type":
          mimeTypes[path.extname(filePath)] || "application/octet-stream",
      });
      res.end(content);
    });

    return;
  }

  res.writeHead(405);
  res.end("Method not allowed");
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
