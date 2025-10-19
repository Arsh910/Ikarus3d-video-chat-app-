import { useState, useRef, useCallback } from 'react';
import { getUserMedia } from '../utils/webrtc';

export function useMediaStream() {
  const [localStream, setLocalStream] = useState(null);
  const [muted, setMuted] = useState(true);
  const [camOff, setCamOff] = useState(true);
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);

  const updateCamStateFromStream = useCallback(() => {
    const s = localStreamRef.current;
    if (!s) {
      setCamOff(true);
      return;
    }
    const vt = s.getVideoTracks()[0];
    setCamOff(!(vt && vt.enabled));
  }, []);

  const startLocalMedia = useCallback(async (force, permissions, isOwner, pcsRef) => {
    if (!force && permissions && permissions.allowed === false && !isOwner) {
      console.log("Not allowed to start media yet");
      return;
    }
    
    if (localStreamRef.current) {
      updateCamStateFromStream();
      const at = localStreamRef.current.getAudioTracks()[0];
      setMuted(!(at && at.enabled));
      return;
    }

    try {
      const stream = await getUserMedia();
      
      localStreamRef.current = stream;
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
        await localVideoRef.current.play().catch(() => {});
      }

      // Add tracks to existing peer connections
      Object.values(pcsRef.current).forEach(pc => {
        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];
        
        if (videoTrack) {
          const videoSender = pc.getSenders().find(s => s.track && s.track.kind === "video");
          if (videoSender) {
            videoSender.replaceTrack(videoTrack).catch(e => console.warn("replaceTrack video failed", e));
          } else {
            pc.addTrack(videoTrack, stream);
          }
        }

        if (audioTrack) {
          const audioSender = pc.getSenders().find(s => s.track && s.track.kind === "audio");
          if (audioSender) {
            audioSender.replaceTrack(audioTrack).catch(e => console.warn("replaceTrack audio failed", e));
          } else {
            pc.addTrack(audioTrack, stream);
          }
        }
      });

      updateCamStateFromStream();
      const at = stream.getAudioTracks()[0];
      setMuted(!(at && at.enabled));
      
      console.log("Local media started successfully");
    } catch (e) {
      console.error("getUserMedia failed", e);
      alert("Camera/microphone permission required. Please allow access.");
    }
  }, [updateCamStateFromStream]);

  const stopLocalMedia = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
  }, []);

  return {
    localStream,
    localStreamRef,
    localVideoRef,
    muted,
    setMuted,
    camOff,
    setCamOff,
    startLocalMedia,
    stopLocalMedia,
    updateCamStateFromStream,
  };
}