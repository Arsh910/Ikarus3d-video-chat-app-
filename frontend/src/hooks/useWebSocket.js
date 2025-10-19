import { useEffect, useRef } from 'react';
import { SIGNALING_URL } from '../config/constants';

export function useWebSocket(meetingId, myNameRef) {
  const wsRef = useRef(null);

  useEffect(() => {
    const ws = new WebSocket(SIGNALING_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WS open -> join-room", meetingId);
      ws.send(JSON.stringify({ typeof: "join-room", meetingId, name: myNameRef.current }));
    };

    ws.onerror = (err) => console.error("ws error", err);

    return () => {
      try {
        ws.close();
      } catch (e) {
        console.warn("Error closing ws", e);
      }
    };
  }, [meetingId]);

  return wsRef;
}