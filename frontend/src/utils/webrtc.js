import { STUN } from '../config/constants';

export function createPeerConnection(peerId, localStreamRef, sendRaw, setRemoteStreams) {
  console.log(`[PEER] Creating peer connection with ${peerId}`);
  const pc = new RTCPeerConnection(STUN);
  const stream = localStreamRef.current;

  if (stream) {
    const videoTrack = stream.getVideoTracks()[0];
    const audioTrack = stream.getAudioTracks()[0];
    
    if (videoTrack) {
      try {
        pc.addTrack(videoTrack, stream);
        console.log("Added video track to peer connection");
      } catch (e) {
        console.warn("Failed to add video track", e);
      }
    }
    
    if (audioTrack) {
      try {
        pc.addTrack(audioTrack, stream);
        console.log("Added audio track to peer connection");
      } catch (e) {
        console.warn("Failed to add audio track", e);
      }
    }
  }

  pc.ontrack = (ev) => {
    console.log("✅ ontrack event from", peerId, ev.streams);
    const remoteStream = ev.streams?.[0];
    if (remoteStream) {
      setRemoteStreams(prev => {
        if (prev[peerId] === remoteStream) return prev;
        console.log("Setting remote stream for", peerId);
        return { ...prev, [peerId]: remoteStream };
      });
    }
  };

  pc.onicecandidate = (ev) => {
    if (ev.candidate) {
      try {
        const c = ev.candidate.toJSON ? ev.candidate.toJSON() : ev.candidate;
        sendRaw({ typeof: "ice_candidate", to: peerId, candidate: c });
      } catch (e) {
        console.warn("send ice candidate failed", e);
      }
    }
  };

  pc.onconnectionstatechange = () => {
    console.log("pc connection state:", peerId, pc.connectionState);
    if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
      console.log("Connection failed/disconnected for", peerId);
    }
  };

  pc.oniceconnectionstatechange = () => {
    console.log("pc ice state:", peerId, pc.iceConnectionState);
  };

  return pc;
}

export async function getUserMedia() {
  return await navigator.mediaDevices.getUserMedia({
    video: { width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: true,
  });
}

export async function getDisplayMedia() {
  return await navigator.mediaDevices.getDisplayMedia({ video: true });
}