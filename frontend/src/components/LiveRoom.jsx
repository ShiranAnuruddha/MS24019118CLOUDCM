import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { getSocketPath, getSocketUrl } from "../lib/api";

export default function LiveRoom({ roomId, user }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    return () => cleanup();
  }, []);

  async function startSession() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    const socket = io(getSocketUrl(), {
      path: getSocketPath(),
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerConnectionRef.current = peerConnection;

    stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));

    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", { roomId, candidate: event.candidate });
      }
    };

    socket.on("connect", async () => {
      setConnected(true);
      socket.emit("join-room", {
        roomId,
        userId: user.id,
        displayName: user.name,
      });
    });

    socket.on("peer-joined", async () => {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket.emit("offer", { roomId, offer });
    });

    socket.on("offer", async ({ offer }) => {
      await peerConnection.setRemoteDescription(offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket.emit("answer", { roomId, answer });
    });

    socket.on("answer", async ({ answer }) => {
      await peerConnection.setRemoteDescription(answer);
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      try {
        await peerConnection.addIceCandidate(candidate);
      } catch (error) {
        console.error("ICE candidate failed", error);
      }
    });

    socket.on("chat-message", (message) => {
      setMessages((current) => [...current, message]);
    });
  }

  function cleanup() {
    if (socketRef.current) socketRef.current.disconnect();
    if (peerConnectionRef.current) peerConnectionRef.current.close();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    setConnected(false);
  }

  function sendMessage(event) {
    event.preventDefault();
    if (!chatInput.trim() || !socketRef.current) return;
    socketRef.current.emit("chat-message", {
      roomId,
      sender: user.name,
      message: chatInput.trim(),
    });
    setChatInput("");
  }

  return (
    <div className="card">
      <h3>Live Room</h3>
      <p className="muted">Room: {roomId}</p>
      <div className="video-grid">
        <video ref={localVideoRef} autoPlay muted playsInline className="video-box" />
        <video ref={remoteVideoRef} autoPlay playsInline className="video-box" />
      </div>
      <div className="button-row">
        <button onClick={startSession} disabled={connected}>Start / Join</button>
        <button className="secondary" onClick={cleanup}>Leave</button>
      </div>
      <form onSubmit={sendMessage} className="message-compose">
        <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Message room..." />
        <button type="submit">Send</button>
      </form>
      <div className="thread">
        {messages.map((msg, index) => (
          <div key={index} className="message-bubble">
            <strong>{msg.sender}:</strong> {msg.message}
          </div>
        ))}
      </div>
    </div>
  );
}
