import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createPeerConnection } from "../utils/webrtc";
import { useWebSocket } from "../hooks/useWebSocket";
import { useMediaStream } from "../hooks/useMediaStream";
import { useScreenShare } from "../hooks/useScreenShare";
import ControlsBar from "../components/ControlsBar";
import ParticipantRow from "../components/RemoteParticipants";
import LocalVideoTile from "../components/LocalVideoTile";
import RemoteVideoTile from "../components/RemoteVideoTile";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Header from "../components/Header";

const DEFAULT_PARTICIPANT_PERMS = { allowed: true, unmute: true, video: true };
const DEFAULT_PENDING_PERMS = { allowed: false, unmute: false, video: false };

export default function SimpleMeeting() {
  const { meetingId } = useParams();
  const navigate = useNavigate();

  // pcsRef will store RTCPeerConnection objects keyed by remote socketId
  const pcsRef = useRef({});
  // buffer for ICE candidates that arrive before pc or before remoteDescription
  const pendingCandidatesRef = useRef({});

  const myNameRef = useRef("User-" + Math.floor(Math.random() * 1000));
  const localVideoRef = useRef();

  const [remoteStreams, setRemoteStreams] = useState({});
  const [mySocketId, setMySocketId] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [joinPending, setJoinPending] = useState(false);
  const [participantsList, setParticipantsList] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [permissions, setPermissions] = useState({ allowed: false, unmute: false, video: false });
  const [activePanelState, setActivePanelState] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [spotlightId, setSpotlightId] = useState(null);

  const [chatNotificationsCount, setChatNotificationsCount] = useState(0);

  const {
    localStreamRef,
    muted,
    setMuted,
    camOff,
    startLocalMedia,
    stopLocalMedia,
    updateCamStateFromStream,
  } = useMediaStream();

  const {
    sharing,
    startScreenShare,
    stopScreenShare,
    stopScreenTrack,
  } = useScreenShare(localStreamRef, localVideoRef, pcsRef);

  const wsRef = useWebSocket(meetingId, myNameRef);
  const sendRaw = useCallback((obj) => {
    const ws = wsRef.current;
    if (!ws) return;
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(obj));
    }
  }, []);

  // Deterministic initiator rule (lexicographic) to avoid glare
  const shouldInitiate = useCallback((localId, remoteId) => {
    if (!localId || !remoteId) return false;
    // choose one deterministic ordering; change this if you prefer opposite rule
    return String(localId) > String(remoteId);
  }, []);

  // createPeer: creates (or returns existing) RTCPeerConnection using your util.
  // also ensures any buffered ICE candidates for this peer are flushed to the pc.
  const createPeer = useCallback((peerId) => {
    if (pcsRef.current[peerId]) return pcsRef.current[peerId];
    const pc = createPeerConnection(peerId, localStreamRef, sendRaw, setRemoteStreams);

    // store and expose
    pcsRef.current[peerId] = pc;

    // flush any candidates buffered earlier
    const pending = pendingCandidatesRef.current[peerId];
    if (pending && pending.length > 0) {
      // apply them asynchronously to avoid race with setRemoteDescription
      setTimeout(async () => {
        for (const c of pendingCandidatesRef.current[peerId] || []) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(c));
          } catch (e) {
            console.warn("Error applying buffered candidate for", peerId, e);
          }
        }
        delete pendingCandidatesRef.current[peerId];
      }, 0);
    }

    return pc;
  }, [localStreamRef, sendRaw]);

  // createPeerAndOffer: ensures local media and tracks are added, then creates an offer.
  const createPeerAndOffer = useCallback(async (peerId) => {
    try {
      await startLocalMedia(true, permissions, isOwner, pcsRef);
      const pc = createPeer(peerId);

      // Add local tracks if not already added
      const stream = localStreamRef.current;
      if (stream) {
        const senders = pc.getSenders();
        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];

        if (videoTrack && !senders.some(s => s.track?.kind === "video")) {
          pc.addTrack(videoTrack, stream);
        }
        if (audioTrack && !senders.some(s => s.track?.kind === "audio")) {
          pc.addTrack(audioTrack, stream);
        }
      }

      // create & send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendRaw({ typeof: "offer", to: peerId, offer: { type: offer.type, sdp: offer.sdp } });
    } catch (e) {
      console.error("createPeerAndOffer failed", e);
    }
  }, [startLocalMedia, permissions, isOwner, createPeer, localStreamRef, sendRaw]);

  const stopAll = useCallback(() => {
    stopLocalMedia();
    stopScreenTrack();
    Object.keys(pcsRef.current).forEach(id => {
      try { pcsRef.current[id].close(); } catch (e) {}
    });
    pcsRef.current = {};
    pendingCandidatesRef.current = {};
    setRemoteStreams({});
  }, [stopLocalMedia, stopScreenTrack]);

  const handleAdmitParticipant = useCallback((socketId, name) => {
    console.log("Admitting participant:", socketId, name);
    sendRaw({
      typeof: "admit",
      meetingId,
      socketId,
      name
    });
    setPendingRequests(prev => prev.filter(req => req.socketId !== socketId));
  }, [sendRaw, meetingId]);

  const handleDenyParticipant = useCallback((socketId) => {
    console.log("Denying participant:", socketId);
    sendRaw({
      typeof: "deny",
      meetingId,
      socketId
    });
    setPendingRequests(prev => prev.filter(req => req.socketId !== socketId));
  }, [sendRaw, meetingId]);

  const handleGrantPermission = useCallback((socketId, permUpdate) => {
    sendRaw({
      typeof: "grant-permission",
      socketId,
      permissions: permUpdate
    });

    setParticipantsList(currentList => {
      const index = currentList.findIndex(p => p.socketId === socketId);
      if (index === -1) return currentList;
      const oldParticipant = currentList[index];
      const newPermissions = {
        ...oldParticipant.permissions,
        ...permUpdate
      };
      const updatedParticipant = {
        ...oldParticipant,
        permissions: newPermissions
      };
      const newList = [
        ...currentList.slice(0, index),
        updatedParticipant,
        ...currentList.slice(index + 1)
      ];
      return newList;
    });
  }, [sendRaw]);

  const handleKickUser = useCallback((socketId) => {
    if (window.confirm("Are you sure you want to kick this user?")) {
      sendRaw({
        typeof: "kick-user",
        socketId,
      });

      const pcLeft = pcsRef.current[socketId];
      if (pcLeft) {
        pcLeft.close();
        delete pcsRef.current[socketId];
      }
      setRemoteStreams(prev => {
        const copy = { ...prev };
        delete copy[socketId];
        return copy;
      });
      setParticipantsList(prev => prev.filter(p => p.socketId !== socketId));
    }
  }, [sendRaw]);

  useEffect(() => {
    const ws = wsRef.current;
    if (!ws) return;

    const handleWebSocketMessage = async (evt) => {
      let data;
      try {
        data = JSON.parse(evt.data);
      } catch (e) {
        return;
      }

      const type = data.typeof || data.type;

      switch (type) {
        case "permission-update": {
          const perms = data.permissions || {};
          const newPerms = { ...permissions, ...perms };
          setPermissions(newPerms);

          if (newPerms.is_owner) setIsOwner(true);

          if (newPerms.allowed && !joinPending) {
            await startLocalMedia(true, newPerms, isOwner, pcsRef);
          }

          const stream = localStreamRef.current;
          if (stream) {
            if (perms.unmute === false) {
              console.log("Host forced mute");
              stream.getAudioTracks().forEach(t => (t.enabled = false));
              setMuted(true);
            }
            if (perms.video === false) {
              console.log("Host forced video off");
              stream.getVideoTracks().forEach(t => (t.enabled = false));
              updateCamStateFromStream();
            }
          }
          break;
        }

        case "owner-assigned":
          setIsOwner(true);
          setPermissions(prev => ({ ...prev, allowed: true, unmute: true, video: true, is_owner: true }));
          await startLocalMedia(true, permissions, true, pcsRef);
          break;

        case "your-id":
          setMySocketId(data.socketId);
          setSpotlightId(data.socketId);
          break;

        case "join-pending":
          setJoinPending(true);
          break;

        case "admitted":
          console.log("✅ We are admitted! Sending ready-for-offers");
          setJoinPending(false);
          sendRaw({ typeof: "ready-for-offers", meetingId });
          break;

        case "join-denied":
          {
            const reason = (data.reason || data.message || "The host denied your request to join." ) + " You will be redirected back to lobby";
            try { stopAll(); } catch (e) {}
            setJoinPending(false);

            toast.warn(reason, {
              position: "top-center",
              autoClose: 3000,
              theme: "dark",
            });

            setTimeout(() => {
              try { navigate("/"); } catch (e) {}
            }, 3500);
          }
          break;

        case "join-request":
          // FIX: only the host should receive the rotating notification and see pending requests
          // If current client is owner, add to pendingRequests and show the toast.
          if (isOwner) {
            console.log("Host received join-request:", data);
            setPendingRequests(prev => {
              if (prev.find(req => req.socketId === data.socketId)) return prev;
              return [...prev, { socketId: data.socketId, name: data.name || "User", is_owner: data.is_owner, permissions: { ...DEFAULT_PENDING_PERMS } }];
            });

            toast.info(`${data.name || "User"} wants to join. Check the Participants list.`, {
              position: "top-center",
              autoClose: 3000,
              theme: "dark",
            });
          } else {
            // Non-host clients ignore join requests (server will route to host)
            console.debug("join-request ignored (not host)");
          }
          break;

        case "existing-participants":
          if (Array.isArray(data.participants)) {
            const participantsWithPerms = data.participants.map(p => ({
              ...p,
              permissions: p.permissions || { ...DEFAULT_PARTICIPANT_PERMS }
            }));
            setParticipantsList(participantsWithPerms);

            if (!spotlightId) {
              setSpotlightId(mySocketId);
            }

            // Ensure we have local media, then create offers deterministically
            await startLocalMedia(true, permissions, isOwner, pcsRef);
            for (const p of participantsWithPerms) {
              if (p?.socketId && p.socketId !== mySocketId) {
                // deterministic initiator
                if (shouldInitiate(mySocketId, p.socketId)) {
                  // small stagger to reduce implicit glare
                  await new Promise(resolve => setTimeout(resolve, 200));
                  await createPeerAndOffer(p.socketId);
                } else {
                  // ensure pc exists so incoming offers/ice can be applied
                  createPeer(p.socketId);
                }
              }
            }
          }
          break;

        case "new-participant":
          if (data.socketId && data.socketId !== mySocketId) {
            setParticipantsList(prev => {
              if (prev.find(p => p.socketId === data.socketId)) return prev;
              const newParticipant = {
                socketId: data.socketId,
                name: data.name,
                is_owner: data.is_owner,
                permissions: data.permissions || { ...DEFAULT_PARTICIPANT_PERMS }
              };
              return [...prev, newParticipant];
            });

            setSpotlightId(data.socketId);

            // Deterministic decision: either initiate or wait for offer
            try {
              if (shouldInitiate(mySocketId, data.socketId)) {
                // small delay so remote sets up websocket listeners
                setTimeout(() => {
                  createPeerAndOffer(data.socketId).catch(err => {
                    console.warn("createPeerAndOffer for new participant failed", err);
                  });
                }, 150);
              } else {
                // ensure there is a pc to accept incoming offer / candidates
                createPeer(data.socketId);
              }
            } catch (e) {
              console.warn("Error creating offer for new participant", e);
            }
          }
          break;

        case "offer":
          try {
            await startLocalMedia(true, permissions, isOwner, pcsRef);
            const pc = createPeer(data.from);

            // If signalingState is not stable, still attempt to handle offer if possible.
            if (pc.signalingState !== 'stable' && pc.signalingState !== 'have-local-offer' && pc.signalingState !== 'have-remote-offer') {
              // allow, but warn
              console.warn(`[PEER] Received offer from ${data.from} with signalingState=${pc.signalingState}`);
            }

            await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

            // flush buffered ICE candidates for this peer after remoteDescription set
            const pending = pendingCandidatesRef.current[data.from];
            if (pending && pending.length) {
              for (const c of pending) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(c));
                } catch (e) {
                  console.warn("Error applying buffered candidate after offer", e);
                }
              }
              delete pendingCandidatesRef.current[data.from];
            }

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            sendRaw({ typeof: "answer", to: data.from, answer: { type: answer.type, sdp: answer.sdp } });
          } catch (e) {
            console.error("handle offer failed", e);
          }
          break;

        case "answer":
          {
            const pc = pcsRef.current[data.from];
            if (pc && data.answer) {
              try {
                await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
              } catch (e) {
                console.warn("Failed to set remote answer description:", e);
              }

              // flush any buffered candidates after answer
              const pending = pendingCandidatesRef.current[data.from];
              if (pending && pending.length) {
                for (const c of pending) {
                  try {
                    await pc.addIceCandidate(new RTCIceCandidate(c));
                  } catch (e) {
                    console.warn("Error applying buffered candidate after answer", e);
                  }
                }
                delete pendingCandidatesRef.current[data.from];
              }
            }
          }
          break;

        case "ice_candidate":
        case "ice-candidate":
          {
            const from = data.from;
            const candidate = data.candidate;
            if (!from || !candidate) break;

            const peerConn = pcsRef.current[from];
            if (peerConn) {
              try {
                await peerConn.addIceCandidate(new RTCIceCandidate(candidate));
              } catch (e) {
                // sometimes addIceCandidate fails if remoteDesc still missing — buffer then
                console.warn("addIceCandidate failed, buffering candidate", e);
                pendingCandidatesRef.current[from] = pendingCandidatesRef.current[from] || [];
                pendingCandidatesRef.current[from].push(candidate);
              }
            } else {
              // No pc yet — buffer candidate for when pc is created
              pendingCandidatesRef.current[from] = pendingCandidatesRef.current[from] || [];
              pendingCandidatesRef.current[from].push(candidate);
            }
          }
          break;

        case "participant-left":
          {
            const pcLeft = pcsRef.current[data.socketId];
            if (pcLeft) {
              try { pcLeft.close(); } catch (e) {}
              delete pcsRef.current[data.socketId];
            }
            // clear any pending candidates
            if (pendingCandidatesRef.current[data.socketId]) delete pendingCandidatesRef.current[data.socketId];

            setRemoteStreams(prev => {
              const copy = { ...prev };
              delete copy[data.socketId];
              return copy;
            });
            setParticipantsList(prev => prev.filter(p => p.socketId !== data.socketId));
          }
          break;

        case "chat-message":
          {
            const senderId = data.fromName;
            if (myNameRef && myNameRef.current === senderId) {
              break;
            }

            setMessages(prev => [...prev, { fromName: data.fromName || "User", text: data.text }]);
            setChatNotificationsCount(prev => prev + 1);
          }
          break;

        case "you-were-kicked":
          stopAll();
          navigate("/");
          break;
      }
    };

    ws.onmessage = handleWebSocketMessage;
    ws.onclose = () => stopAll();
  }, [isOwner, startLocalMedia, permissions, createPeer, createPeerAndOffer, sendRaw, meetingId, mySocketId, navigate, stopAll, setMuted, updateCamStateFromStream, joinPending, spotlightId, shouldInitiate]);

  useEffect(() => {
    return () => stopAll();
  }, [stopAll]);

  const allParticipants = [
    { socketId: mySocketId, name: myNameRef.current, isLocal: true, is_owner: isOwner, permissions: permissions },
    ...participantsList
  ];
  const numParticipants = allParticipants.length;

  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [localStreamRef.current, spotlightId, numParticipants]);

  const toggleMute = useCallback(() => {
    if (!permissions.unmute && !isOwner) return;

    const s = localStreamRef.current;
    if (!s) {
      startLocalMedia(true, permissions, isOwner, pcsRef).then(() => {
        const ss = localStreamRef.current;
        if (ss) {
          if(permissions.unmute || isOwner) {
            ss.getAudioTracks().forEach(t => (t.enabled = !t.enabled));
            setMuted(!ss.getAudioTracks()[0]?.enabled);
          }
        }
      });
      return;
    }

    const isCurrentlyMuted = !s.getAudioTracks()[0]?.enabled;
    if (isCurrentlyMuted && !permissions.unmute && !isOwner) return;

    s.getAudioTracks().forEach(t => (t.enabled = !t.enabled));
    setMuted(!s.getAudioTracks()[0]?.enabled);
  }, [permissions, isOwner, localStreamRef, startLocalMedia, setMuted, pcsRef]);

  const toggleCam = useCallback(() => {
    if (!permissions.video && !isOwner) return;

    const s = localStreamRef.current;
    if (!s) {
      startLocalMedia(true, permissions, isOwner, pcsRef).then(() => {
        const ss = localStreamRef.current;
        if (ss) {
           if(permissions.video || isOwner) {
            ss.getVideoTracks().forEach(t => (t.enabled = !t.enabled));
            updateCamStateFromStream();
           }
        }
      });
      return;
    }

    const isCurrentlyOff = !s.getVideoTracks()[0]?.enabled;
    if(isCurrentlyOff && !permissions.video && !isOwner) return;

    s.getVideoTracks().forEach(t => (t.enabled = !t.enabled));
    updateCamStateFromStream();
  }, [permissions, isOwner, localStreamRef, startLocalMedia, updateCamStateFromStream, pcsRef]);

  const handleToggleScreenShare = useCallback(() => {
    sharing ? stopScreenShare() : startScreenShare();
  }, [sharing, startScreenShare, stopScreenShare]);

  const handleLeave = useCallback(() => {
    stopAll();
    navigate("/");
  }, [stopAll, navigate]);

  const togglePanel = useCallback((panelName) => {
    setActivePanelState(prev => prev === panelName ? null : panelName);
  }, []);

  const handleSendMessage = useCallback(() => {
    if (!messageInput.trim()) return;
    sendRaw({ typeof: "chat-message", meetingId, text: messageInput, fromName: myNameRef.current });
    setMessages(prev => [...prev, { fromName: "You", text: messageInput }]);
    setMessageInput("");
  }, [messageInput, sendRaw, meetingId]);

  const spotlightParticipant = allParticipants.find(p => p.socketId === spotlightId);
  const thumbnailParticipants = allParticipants.filter(p => p.socketId !== spotlightId);

  useEffect(() => {
    if (spotlightId && !spotlightParticipant && mySocketId) {
      setSpotlightId(mySocketId);
    }
  }, [spotlightId, spotlightParticipant, mySocketId]);


  useEffect(() => {
    function onBeforeLeave(e) {
      try {
        stopAll();
      } catch (err) {
        console.warn("Error in stopAll during before-leave-meeting:", err);
      }
    }
  
    window.addEventListener("before-leave-meeting", onBeforeLeave);
  
    return () => {
      window.removeEventListener("before-leave-meeting", onBeforeLeave);
    };
  }, [stopAll]);


  
  return (
    <div
      className="relative flex h-screen w-full flex-col overflow-hidden bg-white font-sans text-gray-900 dark:bg-[#0F1419] dark:text-white"
    >
      <ToastContainer />
      {/* Header */}
      <Header meetingId={meetingId} allParticipants={allParticipants}/>

      {/* Main Content */}
      <div
        className="absolute top-[60px] bottom-[80px] left-0 right-0 flex overflow-hidden"
      >
        <div
          className="flex h-full w-full flex-1 flex-col gap-4 p-4"
        >
          {numParticipants === 1 ? (
            // 1. SOLO LAYOUT
            <div
              className="relative h-full w-full"
            >
              <LocalVideoTile
                localVideoRef={localVideoRef}
                camOff={camOff}
                muted={muted}
                name={myNameRef.current}
                isOwner={isOwner}
                isSolo={true}
              />
            </div>
          ) : (
            // 2. SPOTLIGHT LAYOUT
            <>
              <div
                className="relative h-4/5 w-full overflow-hidden rounded-xl bg-gray-100 dark:bg-[#1A1F2E]"
              >
                {spotlightParticipant &&
                  (spotlightParticipant.isLocal ? (
                    <LocalVideoTile
                      localVideoRef={localVideoRef}
                      camOff={camOff}
                      muted={muted}
                      name={myNameRef.current}
                      isOwner={isOwner}
                      isSpotlight={true}
                    />
                  ) : (
                    <RemoteVideoTile
                      stream={remoteStreams[spotlightParticipant.socketId]}
                      participant={spotlightParticipant}
                      isSpotlight={true}
                    />
                  ))}
              </div>

              <div
                className="flex h-1/5 w-full flex-row items-center justify-center gap-2 overflow-y-hidden overflow-x-auto py-2"
              >
                {thumbnailParticipants.map((p) => (
                  <div
                    key={p.socketId}
                    onClick={() => setSpotlightId(p.socketId)}
                    className="cursor-pointer"
                  >
                    {p.isLocal ? (
                      <LocalVideoTile
                        localVideoRef={localVideoRef}
                        camOff={camOff}
                        muted={muted}
                        name={p.name}
                        isOwner={p.is_owner}
                        isThumbnail={true}
                      />
                    ) : (
                      <RemoteVideoTile
                        stream={remoteStreams[p.socketId]}
                        participant={p}
                        isThumbnail={true}
                      />
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Side Panels */}
        <div
          className={`fixed top-[60px] bottom-[80px] right-0 z-[100] flex w-[360px] flex-col border-l border-gray-200 bg-gray-50 shadow-[-4px_0_16px_rgba(0,0,0,0.3)] transition-transform duration-300 ease-in-out dark:border-[#252B3A] dark:bg-[#1A1F2E] ${
            activePanelState === "chat" ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Chat panel content */}
          <div className="border-b border-gray-200 p-6 dark:border-[#252B3A]">
            <h3 className="m-0 text-lg font-semibold">
              Meeting Chat
            </h3>
          </div>
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${
                  msg.fromName === "You" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 ${
                    msg.fromName === "You"
                      ? "bg-indigo-500 text-white"
                      : "bg-gray-200 dark:bg-[#252B3A]"
                  }`}
                >
                  <div className="mb-1 text-xs text-gray-400 dark:text-gray-400">
                    {msg.fromName}
                  </div>
                  <div className="text-sm">
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 bg-gray-50 p-6 dark:border-[#252B3A] dark:bg-[#1A1F2E]">
            <div className="flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 rounded-xl border-none bg-white px-3 py-2 text-sm text-gray-900 outline-none dark:bg-[#0F1419] dark:text-white"
              />
              <button
                onClick={handleSendMessage}
                className="flex cursor-pointer items-center justify-center rounded-xl border-none bg-indigo-500 px-3 py-2 text-white hover:bg-indigo-600"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div
          className={`fixed top-[60px] bottom-[80px] right-0 z-[100] flex w-[360px] flex-col border-l border-gray-200 bg-gray-50 shadow-[-4px_0_16px_rgba(0,0,0,0.3)] transition-transform duration-300 ease-in-out dark:border-[#252B3A] dark:bg-[#1A1F2E] ${
            activePanelState === "participants"
              ? "translate-x-0"
              : "translate-x-full"
          }`}
        >
          {/* Participants panel content */}
          <div className="border-b border-gray-200 p-6 dark:border-[#252B3A]">
            <h3 className="m-0 text-lg font-semibold">
              Participants ({allParticipants.length})
            </h3>
          </div>
          <div className="flex flex-1 flex-col overflow-y-auto">
            {isOwner && pendingRequests.length > 0 && (
              <div className="px-6 py-4">
                <h4 className="m-0 mb-3 text-sm text-gray-500 dark:text-gray-400">
                  Waiting ({pendingRequests.length})
                </h4>
                <div className="flex flex-col gap-2">
                  {pendingRequests.map((p) => (
                    <ParticipantRow
                      key={p.socketId}
                      participant={p}
                      isPending={true}
                      isOwner={isOwner}
                      onAdmit={handleAdmitParticipant}
                      onDeny={handleDenyParticipant}
                      onGrantPermission={handleGrantPermission}
                      onKickUser={handleKickUser}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="px-6 py-4">
              <h4 className="m-0 mb-3 text-sm text-gray-500 dark:text-gray-400">
                In Meeting ({allParticipants.length})
              </h4>
              <div className="flex flex-col gap-2">
                {allParticipants.map((p) => (
                  <ParticipantRow
                    key={p.socketId}
                    participant={p}
                    isPending={false}
                    isOwner={isOwner}
                    onAdmit={handleAdmitParticipant}
                    onDeny={handleDenyParticipant}
                    onGrantPermission={handleGrantPermission}
                    onKickUser={handleKickUser}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 h-[80px] border-t border-gray-200 dark:border-[#252B3A]"
      >
        <ControlsBar
          muted={muted}
          camOff={camOff}
          sharing={sharing}
          permissions={permissions}
          isOwner={isOwner}
          onToggleMute={toggleMute}
          onToggleCam={toggleCam}
          onToggleScreenShare={handleToggleScreenShare}
          onLeave={handleLeave}
          
          onToggleChat={() => {
            togglePanel("chat");
            setChatNotificationsCount(0);
          }}

          onToggleParticipants={() => togglePanel("participants")}
          activePanelState={activePanelState}
          pendingRequestsCount={pendingRequests.length}

          chatNotificationsCount={chatNotificationsCount}

        />
      </div>

      {/* Join Pending Overlay */}
      {joinPending && (
        <div
          className="absolute inset-0 z-[1000] flex items-center justify-center bg-black/85"
        >
          <div
            className="rounded-2xl bg-gray-50 p-10 text-center dark:bg-[#1A1F2E]"
          >
            <h2 className="m-0 mb-4 text-2xl">
              Waiting for host...
            </h2>
            <p className="m-0 text-gray-500 dark:text-gray-400">
              The host will admit you shortly
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
