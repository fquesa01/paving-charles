import { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";

const FONTS = {
  display: "'Oswald', sans-serif",
  body: "'Source Sans 3', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

const COLORS = {
  bg: "var(--c-bg)",
  surface: "var(--c-surface)",
  surfaceHover: "var(--c-surfaceHover)",
  card: "var(--c-card)",
  border: "var(--c-border)",
  accent: "#F59E0B",
  accentDark: "#D97706",
  success: "#10B981",
  danger: "#EF4444",
  text: "var(--c-text)",
  textSecondary: "var(--c-textSecondary)",
  textMuted: "var(--c-textMuted)",
};

const RADIO_CHANNELS = [
  { id: "alpha-crew", name: "Alpha Crew", icon: "A" },
  { id: "bravo-crew", name: "Bravo Crew", icon: "B" },
  { id: "management", name: "Management", icon: "M" },
  { id: "all-hands", name: "All Hands", icon: "★" },
];

export function useWalkieTalkie() {
  const [channel, setChannel] = useState("alpha-crew");
  const [connected, setConnected] = useState(false);
  const [users, setUsers] = useState([]);
  const [talking, setTalking] = useState(false);
  const [talkers, setTalkers] = useState({});
  const [micAllowed, setMicAllowed] = useState(null);

  const socketRef = useRef(null);
  const streamRef = useRef(null);
  const peersRef = useRef({});
  const audioElemsRef = useRef({});

  const userName = "Sarah Chen";
  const userAvatar = "SC";

  const connectSocket = useCallback(() => {
    if (socketRef.current?.connected) return;
    const socket = io({ path: "/socket.io", transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join-channel", { channel, user: { name: userName, avatar: userAvatar } });
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("channel-users", (channelUsers) => {
      setUsers(channelUsers.filter(u => u.socketId !== socket.id));
    });

    socket.on("talking", ({ socketId, name, talking: isTalking }) => {
      setTalkers(prev => {
        const next = { ...prev };
        if (isTalking) next[socketId] = name;
        else delete next[socketId];
        return next;
      });
    });

    socket.on("signal", async ({ from, signal }) => {
      if (!streamRef.current) return;

      if (signal.type === "offer") {
        const pc = createPeer(from, false);
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("signal", { to: from, signal: pc.localDescription });
      } else if (signal.type === "answer") {
        const pc = peersRef.current[from];
        if (pc) await pc.setRemoteDescription(new RTCSessionDescription(signal));
      } else if (signal.candidate) {
        const pc = peersRef.current[from];
        if (pc) await pc.addIceCandidate(new RTCIceCandidate(signal));
      }
    });

    return socket;
  }, [channel]);

  const createPeer = useCallback((targetId, initiator) => {
    if (peersRef.current[targetId]) {
      peersRef.current[targetId].close();
    }

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => pc.addTrack(track, streamRef.current));
    }

    pc.onicecandidate = (e) => {
      if (e.candidate && socketRef.current) {
        socketRef.current.emit("signal", { to: targetId, signal: e.candidate });
      }
    };

    pc.ontrack = (e) => {
      if (!audioElemsRef.current[targetId]) {
        const audio = new Audio();
        audio.autoplay = true;
        audioElemsRef.current[targetId] = audio;
      }
      audioElemsRef.current[targetId].srcObject = e.streams[0];
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        pc.close();
        delete peersRef.current[targetId];
      }
    };

    peersRef.current[targetId] = pc;

    if (initiator) {
      pc.createOffer().then(offer => {
        pc.setLocalDescription(offer);
        socketRef.current?.emit("signal", { to: targetId, signal: offer });
      });
    }

    return pc;
  }, []);

  const initMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      stream.getAudioTracks().forEach(t => { t.enabled = false; });
      streamRef.current = stream;
      setMicAllowed(true);
      return true;
    } catch {
      setMicAllowed(false);
      return false;
    }
  }, []);

  const switchChannel = useCallback((newChannel) => {
    Object.values(peersRef.current).forEach(pc => pc.close());
    peersRef.current = {};
    Object.values(audioElemsRef.current).forEach(a => { a.srcObject = null; });
    audioElemsRef.current = {};
    setTalkers({});
    setTalking(false);

    setChannel(newChannel);
    if (socketRef.current?.connected) {
      socketRef.current.emit("join-channel", { channel: newChannel, user: { name: userName, avatar: userAvatar } });
    }
  }, []);

  const startTalking = useCallback(() => {
    if (!streamRef.current) return;
    streamRef.current.getAudioTracks().forEach(t => { t.enabled = true; });
    setTalking(true);
    socketRef.current?.emit("talking-start");

    users.forEach(u => {
      if (!peersRef.current[u.socketId]) {
        createPeer(u.socketId, true);
      }
    });
  }, [users, createPeer]);

  const stopTalking = useCallback(() => {
    if (!streamRef.current) return;
    streamRef.current.getAudioTracks().forEach(t => { t.enabled = false; });
    setTalking(false);
    socketRef.current?.emit("talking-stop");
  }, []);

  const disconnect = useCallback(() => {
    Object.values(peersRef.current).forEach(pc => pc.close());
    peersRef.current = {};
    Object.values(audioElemsRef.current).forEach(a => { a.srcObject = null; });
    audioElemsRef.current = {};
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    socketRef.current?.disconnect();
    socketRef.current = null;
    setConnected(false);
    setUsers([]);
    setTalkers({});
    setTalking(false);
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    channel, connected, users, talking, talkers, micAllowed,
    connectSocket, initMic, switchChannel, startTalking, stopTalking, disconnect,
    RADIO_CHANNELS,
  };
}

export function WalkieTalkiePanel({ compact = false }) {
  const {
    channel, connected, users, talking, talkers, micAllowed,
    connectSocket, initMic, switchChannel, startTalking, stopTalking,
    RADIO_CHANNELS,
  } = useWalkieTalkie();

  const [joining, setJoining] = useState(false);
  const activeTalkers = Object.values(talkers);
  const channelInfo = RADIO_CHANNELS.find(c => c.id === channel);

  const handleConnect = async () => {
    setJoining(true);
    const micOk = await initMic();
    if (micOk) {
      connectSocket();
    }
    setJoining(false);
  };

  const handlePTTDown = (e) => {
    e.preventDefault();
    startTalking();
  };

  const handlePTTUp = (e) => {
    e.preventDefault();
    stopTalking();
  };

  if (!connected) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 24, padding: compact ? 20 : 40, height: compact ? "auto" : "100%",
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: 20,
          background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentDark})`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="#000">
            <path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57a1.02 1.02 0 0 0-1.02.24l-2.2 2.2a15.045 15.045 0 0 1-6.59-6.59l2.2-2.21a.96.96 0 0 0 .25-1A11.36 11.36 0 0 1 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1zM12 3v10l3-3h6V3h-9z"/>
          </svg>
        </div>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontFamily: FONTS.display, fontSize: compact ? 20 : 28, fontWeight: 700, marginBottom: 8 }}>
            Push-to-Talk Radio
          </h2>
          <p style={{ color: COLORS.textMuted, fontSize: 14, maxWidth: 340 }}>
            Connect to a crew channel and hold the talk button to communicate instantly with your team.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", maxWidth: 300 }}>
          <div style={{ fontSize: 10, fontFamily: FONTS.mono, color: COLORS.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
            Select Channel
          </div>
          {RADIO_CHANNELS.map(ch => (
            <button key={ch.id} onClick={() => switchChannel(ch.id)} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
              borderRadius: 10, border: `2px solid ${channel === ch.id ? COLORS.accent : COLORS.border}`,
              background: channel === ch.id ? `${COLORS.accent}15` : COLORS.surface,
              color: channel === ch.id ? COLORS.accent : COLORS.text,
              cursor: "pointer", fontFamily: FONTS.body, fontSize: 14, fontWeight: 500,
              transition: "all 0.2s", textAlign: "left",
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: channel === ch.id ? COLORS.accent : COLORS.border,
                color: channel === ch.id ? "#000" : COLORS.textMuted,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: FONTS.display, fontWeight: 700, fontSize: 14,
              }}>{ch.icon}</div>
              {ch.name}
            </button>
          ))}
        </div>

        <button onClick={handleConnect} disabled={joining} style={{
          padding: "14px 40px", borderRadius: 12, border: "none", cursor: joining ? "wait" : "pointer",
          background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentDark})`,
          color: "#000", fontFamily: FONTS.display, fontSize: 16, fontWeight: 700,
          letterSpacing: 1, transition: "all 0.2s", opacity: joining ? 0.7 : 1,
        }}>
          {joining ? "CONNECTING..." : "GO LIVE"}
        </button>

        {micAllowed === false && (
          <p style={{ color: COLORS.danger, fontSize: 13, textAlign: "center" }}>
            Microphone access was denied. Please allow microphone access in your browser settings.
          </p>
        )}
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      height: compact ? "auto" : "100%", padding: compact ? 16 : 32,
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 12, marginBottom: compact ? 16 : 24,
        padding: "10px 20px", borderRadius: 12, background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
      }}>
        <div style={{
          width: 10, height: 10, borderRadius: "50%",
          background: COLORS.success,
          boxShadow: `0 0 8px ${COLORS.success}`,
          animation: "pulse 2s infinite",
        }} />
        <span style={{ fontFamily: FONTS.display, fontSize: 14, fontWeight: 600 }}>
          {channelInfo?.name}
        </span>
        <span style={{ fontSize: 12, color: COLORS.textMuted }}>
          · {users.length + 1} online
        </span>
      </div>

      {!compact && (
        <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap", justifyContent: "center" }}>
          {RADIO_CHANNELS.map(ch => (
            <button key={ch.id} onClick={() => switchChannel(ch.id)} style={{
              padding: "6px 14px", borderRadius: 8,
              border: `1px solid ${channel === ch.id ? COLORS.accent : COLORS.border}`,
              background: channel === ch.id ? `${COLORS.accent}20` : "transparent",
              color: channel === ch.id ? COLORS.accent : COLORS.textMuted,
              cursor: "pointer", fontFamily: FONTS.body, fontSize: 12, fontWeight: 600,
              transition: "all 0.2s",
            }}>
              {ch.name}
            </button>
          ))}
        </div>
      )}

      <div style={{ flex: compact ? undefined : 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: compact ? 16 : 24 }}>
        {activeTalkers.length > 0 && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            animation: "fadeIn 0.3s ease-out",
          }}>
            <div style={{ fontSize: 10, fontFamily: FONTS.mono, color: COLORS.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>
              SPEAKING
            </div>
            {activeTalkers.map((name, i) => (
              <div key={i} style={{
                padding: "8px 20px", borderRadius: 10, background: `${COLORS.success}20`,
                border: `1px solid ${COLORS.success}40`, color: COLORS.success,
                fontFamily: FONTS.display, fontSize: 16, fontWeight: 600,
                animation: "pulse 1.5s infinite",
              }}>
                {name}
              </div>
            ))}
          </div>
        )}

        <button
          onMouseDown={handlePTTDown} onMouseUp={handlePTTUp} onMouseLeave={handlePTTUp}
          onTouchStart={handlePTTDown} onTouchEnd={handlePTTUp} onTouchCancel={handlePTTUp}
          style={{
            width: compact ? 100 : 160, height: compact ? 100 : 160, borderRadius: "50%",
            border: `4px solid ${talking ? COLORS.danger : COLORS.accent}`,
            background: talking
              ? `radial-gradient(circle, ${COLORS.danger}40, ${COLORS.danger}15)`
              : `radial-gradient(circle, ${COLORS.accent}25, transparent)`,
            cursor: "pointer", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 4,
            transition: "all 0.15s", userSelect: "none", WebkitUserSelect: "none",
            boxShadow: talking ? `0 0 40px ${COLORS.danger}40` : `0 0 30px ${COLORS.accent}20`,
            animation: talking ? "pulse 1s infinite" : "none",
          }}
        >
          <svg width={compact ? 28 : 40} height={compact ? 28 : 40} viewBox="0 0 24 24" fill={talking ? COLORS.danger : COLORS.accent}>
            <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
          </svg>
          <span style={{
            fontFamily: FONTS.display, fontSize: compact ? 10 : 13,
            fontWeight: 700, letterSpacing: 1,
            color: talking ? COLORS.danger : COLORS.accent,
          }}>
            {talking ? "LIVE" : "HOLD TO TALK"}
          </span>
        </button>

        {!compact && !talking && activeTalkers.length === 0 && (
          <p style={{ color: COLORS.textMuted, fontSize: 13, textAlign: "center", maxWidth: 260 }}>
            Press and hold the button to talk to everyone on this channel
          </p>
        )}
      </div>

      {!compact && (
        <div style={{ width: "100%", maxWidth: 360, marginTop: 24 }}>
          <div style={{ fontSize: 10, fontFamily: FONTS.mono, color: COLORS.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
            ON THIS CHANNEL
          </div>
          <div style={{
            background: COLORS.surface, borderRadius: 12, border: `1px solid ${COLORS.border}`,
            overflow: "hidden",
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
              borderBottom: users.length > 0 ? `1px solid ${COLORS.border}` : "none",
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 7,
                background: `${COLORS.success}20`, color: COLORS.success,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: FONTS.display, fontWeight: 700, fontSize: 11,
              }}>SC</div>
              <span style={{ fontSize: 13, fontWeight: 600 }}>You (Sarah Chen)</span>
              {talking && <span style={{ marginLeft: "auto", fontSize: 10, color: COLORS.danger, fontFamily: FONTS.mono, fontWeight: 700 }}>TALKING</span>}
            </div>
            {users.map(u => (
              <div key={u.socketId} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                borderBottom: `1px solid ${COLORS.border}`,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: `${COLORS.accent}20`, color: COLORS.accent,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: FONTS.display, fontWeight: 700, fontSize: 11,
                }}>{u.avatar || u.name.split(" ").map(w => w[0]).join("")}</div>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</span>
                {talkers[u.socketId] && <span style={{ marginLeft: "auto", fontSize: 10, color: COLORS.danger, fontFamily: FONTS.mono, fontWeight: 700, animation: "pulse 1s infinite" }}>TALKING</span>}
              </div>
            ))}
            {users.length === 0 && (
              <div style={{ padding: "10px 14px", fontSize: 12, color: COLORS.textMuted, textAlign: "center" }}>
                No other users on this channel yet
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function WalkieTalkieFAB({ isOpen, onToggle }) {
  return (
    <>
      {isOpen && (
        <div style={{
          position: "fixed", bottom: 96, right: 28, zIndex: 201,
          width: 320, maxHeight: 500,
          background: COLORS.card, border: `1px solid ${COLORS.border}`,
          borderRadius: 16, boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
          overflow: "hidden", animation: "fadeIn 0.25s ease-out",
        }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}`,
            background: COLORS.surface,
          }}>
            <span style={{ fontFamily: FONTS.display, fontSize: 14, fontWeight: 600 }}>Radio</span>
            <button onClick={onToggle} style={{
              background: "none", border: "none", color: COLORS.textMuted,
              cursor: "pointer", padding: 4, display: "flex",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
          <div style={{ maxHeight: 440, overflowY: "auto" }}>
            <WalkieTalkiePanel compact />
          </div>
        </div>
      )}
      <button onClick={onToggle} title="Push-to-Talk Radio" style={{
        position: "fixed", bottom: 28, right: 96, zIndex: 200,
        width: 48, height: 48, borderRadius: 14, cursor: "pointer",
        background: isOpen ? COLORS.danger : COLORS.surface,
        border: `1px solid ${isOpen ? COLORS.danger : COLORS.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 16px rgba(0,0,0,0.2)", transition: "all 0.2s",
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill={isOpen ? "#fff" : COLORS.accent}>
          <path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57a1.02 1.02 0 0 0-1.02.24l-2.2 2.2a15.045 15.045 0 0 1-6.59-6.59l2.2-2.21a.96.96 0 0 0 .25-1A11.36 11.36 0 0 1 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1zM12 3v10l3-3h6V3h-9z"/>
        </svg>
      </button>
    </>
  );
}
