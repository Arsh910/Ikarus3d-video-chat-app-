import { useState, useRef, useCallback } from 'react';
import { getDisplayMedia } from '../utils/webrtc';

export function useScreenShare(localStreamRef, localVideoRef, pcsRef) {
  const [sharing, setSharing] = useState(false);
  const screenTrackRef = useRef(null);

  const startScreenShare = useCallback(async () => {
    if (sharing) return;
    try {
      const s = await getDisplayMedia();
      const track = s.getVideoTracks()[0];
      screenTrackRef.current = track;
      Object.values(pcsRef.current).forEach(pc => {
        const sender = pc.getSenders().find(s => s.track && s.track.kind === "video");
        if (sender) sender.replaceTrack(track).catch(() => {});
        else pc.addTrack(track, s);
      });
      if (localVideoRef.current) localVideoRef.current.srcObject = s;
      setSharing(true);
      track.onended = () => stopScreenShare();
    } catch (e) {
      console.error("screen share failed", e);
    }
  }, [sharing, pcsRef, localVideoRef]);

  const stopScreenShare = useCallback(() => {
    if (!screenTrackRef.current) return;
    const camTrack = localStreamRef.current?.getVideoTracks()[0];
    Object.values(pcsRef.current).forEach(pc => {
      const sender = pc.getSenders().find(s => s.track && s.track.kind === "video");
      if (sender && camTrack) sender.replaceTrack(camTrack).catch(() => {});
    });
    if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
    try {
      screenTrackRef.current.stop();
    } catch (e) {
      console.warn("Error stopping screen track", e);
    }
    screenTrackRef.current = null;
    setSharing(false);
  }, [localStreamRef, localVideoRef, pcsRef]);

  const stopScreenTrack = useCallback(() => {
    if (screenTrackRef.current) {
      try {
        screenTrackRef.current.stop();
      } catch (e) {
        console.warn("Error stopping screen track", e);
      }
      screenTrackRef.current = null;
      setSharing(false);
    }
  }, []);

  return {
    sharing,
    screenTrackRef,
    startScreenShare,
    stopScreenShare,
    stopScreenTrack,
  };
}