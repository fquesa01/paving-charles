import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
  path: "/socket.io",
});

const channels = {};

function getChannelUsers(channel) {
  if (!channels[channel]) return [];
  return Array.from(channels[channel].values());
}

function broadcastPresence(channel) {
  io.to(channel).emit("channel-users", getChannelUsers(channel));
}

io.on("connection", (socket) => {
  let currentChannel = null;
  let userInfo = null;

  socket.on("join-channel", ({ channel, user }) => {
    if (currentChannel) {
      socket.leave(currentChannel);
      if (channels[currentChannel]) {
        channels[currentChannel].delete(socket.id);
        broadcastPresence(currentChannel);
      }
    }

    currentChannel = channel;
    userInfo = { ...user, socketId: socket.id, talking: false };

    if (!channels[channel]) channels[channel] = new Map();
    channels[channel].set(socket.id, userInfo);

    socket.join(channel);
    broadcastPresence(channel);
  });

  socket.on("leave-channel", () => {
    if (currentChannel && channels[currentChannel]) {
      channels[currentChannel].delete(socket.id);
      broadcastPresence(currentChannel);
      socket.leave(currentChannel);
    }
    currentChannel = null;
    userInfo = null;
  });

  socket.on("signal", ({ to, signal }) => {
    io.to(to).emit("signal", { from: socket.id, signal });
  });

  socket.on("talking-start", () => {
    if (currentChannel && channels[currentChannel] && userInfo) {
      userInfo.talking = true;
      channels[currentChannel].set(socket.id, userInfo);
      io.to(currentChannel).emit("talking", { socketId: socket.id, name: userInfo.name, talking: true });
    }
  });

  socket.on("talking-stop", () => {
    if (currentChannel && channels[currentChannel] && userInfo) {
      userInfo.talking = false;
      channels[currentChannel].set(socket.id, userInfo);
      io.to(currentChannel).emit("talking", { socketId: socket.id, name: userInfo.name, talking: false });
    }
  });

  socket.on("disconnect", () => {
    if (currentChannel && channels[currentChannel]) {
      channels[currentChannel].delete(socket.id);
      broadcastPresence(currentChannel);
      if (channels[currentChannel].size === 0) {
        delete channels[currentChannel];
      }
    }
  });
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

const PORT = 3001;
server.listen(PORT, "localhost", () => {
  console.log(`[Radio Server] Running on localhost:${PORT}`);
});
