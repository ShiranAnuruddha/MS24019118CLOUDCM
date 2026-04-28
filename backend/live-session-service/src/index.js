const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const port = process.env.PORT || 4006;

app.use(cors());
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan("dev"));
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "live-session-service" });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  socket.on("join-room", ({ roomId, userId, displayName }) => {
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.userId = userId;
    socket.data.displayName = displayName;
    socket.to(roomId).emit("peer-joined", { userId, displayName, socketId: socket.id });
  });

  socket.on("offer", ({ roomId, offer }) => {
    socket.to(roomId).emit("offer", { offer, socketId: socket.id });
  });

  socket.on("answer", ({ roomId, answer }) => {
    socket.to(roomId).emit("answer", { answer, socketId: socket.id });
  });

  socket.on("ice-candidate", ({ roomId, candidate }) => {
    socket.to(roomId).emit("ice-candidate", { candidate, socketId: socket.id });
  });

  socket.on("chat-message", ({ roomId, message, sender }) => {
    io.to(roomId).emit("chat-message", {
      sender,
      message,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on("whiteboard-event", ({ roomId, payload }) => {
    socket.to(roomId).emit("whiteboard-event", payload);
  });

  socket.on("disconnect", () => {
    if (socket.data.roomId) {
      socket.to(socket.data.roomId).emit("peer-left", {
        userId: socket.data.userId,
        displayName: socket.data.displayName,
      });
    }
  });
});

server.listen(port, () => {
  console.log(`Live session service listening on ${port}`);
});
