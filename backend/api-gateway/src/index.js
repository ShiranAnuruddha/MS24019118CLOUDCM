
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { createProxyMiddleware } = require("http-proxy-middleware");
const { authMiddleware } = require("./auth");

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "api-gateway" });
});

app.use(authMiddleware);

function proxy(path, target, extra = {}) {
  const middleware = createProxyMiddleware({
    target,
    changeOrigin: true,
    ws: extra.ws || false,
    pathRewrite: extra.pathRewrite || undefined,
    on: {
      proxyReq: (proxyReq, req) => {
        if (req.user) {
          proxyReq.setHeader("x-user-id", req.user.id);
          proxyReq.setHeader("x-user-email", req.user.email || "");
          proxyReq.setHeader("x-user-role", req.user.role || "candidate");
          proxyReq.setHeader("x-user-name", req.user.name || "");
        }
      },
    },
  });

  app.use(path, middleware);
  return middleware;
}

proxy("/profiles", process.env.PROFILE_SERVICE_URL);
proxy("/bookings", process.env.BOOKING_SERVICE_URL);
proxy("/submissions", process.env.SUBMISSION_SERVICE_URL);
proxy("/messages", process.env.MESSAGING_SERVICE_URL);
proxy("/evaluations", process.env.EVALUATION_SERVICE_URL);
const liveProxy = proxy("/live", process.env.LIVE_SESSION_SERVICE_URL, {
  ws: true,
  pathRewrite: { "^/live": "" },
});

const server = app.listen(port, () => {
  console.log(`API Gateway listening on ${port}`);
});

server.on("upgrade", liveProxy.upgrade);
