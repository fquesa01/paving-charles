import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import { saveRadioLog, getRadioLogs, saveChecklistAction } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
  path: "/socket.io",
});

app.use(express.json());

const COMPLETION_PATTERNS = [
  /\b(completed?|finished|done with|knocked out|wrapped up|all done|taken care of)\b/i,
];
const PROBLEM_PATTERNS = [
  /\b(problem with|issue with|need to fix|broken|damaged|we need|defect|crack|pothole|delay|shortage)\b/i,
];

function detectChecklistAction(transcript) {
  for (const p of COMPLETION_PATTERNS) {
    if (p.test(transcript)) {
      return { type: "complete", text: transcript };
    }
  }
  for (const p of PROBLEM_PATTERNS) {
    if (p.test(transcript)) {
      return { type: "add", text: transcript };
    }
  }
  return null;
}

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

  socket.on("radio-transcript", async ({ channel, userName, transcript, durationSec }) => {
    if (!transcript || !transcript.trim()) return;

    try {
      const log = await saveRadioLog({ channel, userName, transcript, durationSec });

      io.to(channel).emit("transcript", {
        id: log.id,
        channel: log.channel,
        userName: log.user_name,
        transcript: log.transcript,
        createdAt: log.created_at,
      });

      const action = detectChecklistAction(transcript);
      if (action) {
        io.to(channel).emit("checklist-suggestion", {
          radioLogId: log.id,
          actionType: action.type,
          transcript: log.transcript,
          userName: log.user_name,
          suggestedText: action.text,
          createdAt: log.created_at,
        });
      }
    } catch (err) {
      console.error("[Radio] Failed to save transcript:", err.message);
    }
  });

  socket.on("checklist-confirm", async ({ radioLogId, projectId, actionType, itemText }) => {
    try {
      const action = await saveChecklistAction({ radioLogId, projectId, actionType, itemText });
      if (currentChannel) {
        io.to(currentChannel).emit("checklist-action-confirmed", {
          ...action,
          channel: currentChannel,
        });
      }
    } catch (err) {
      console.error("[Radio] Failed to save checklist action:", err.message);
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

app.get("/api/radio-logs", async (req, res) => {
  try {
    const channel = req.query.channel;
    if (!channel) return res.status(400).json({ error: "channel is required" });
    const logs = await getRadioLogs(channel, parseInt(req.query.limit) || 50);
    res.json(logs);
  } catch (err) {
    console.error("[API] Failed to fetch radio logs:", err.message);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

const distPath = path.join(__dirname, "..", "dist");
app.use(express.static(distPath));
app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

const PORT = parseInt(process.env.PORT || "3001", 10);
server.listen(PORT, "0.0.0.0", () => {
  console.log(`[Radio Server] Running on 0.0.0.0:${PORT}`);
});
