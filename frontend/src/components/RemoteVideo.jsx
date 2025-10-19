import React, { useRef, useEffect } from "react";

export default function RemoteVideo({ stream }) {
  const ref = useRef();

  useEffect(() => {
    if (ref.current && stream) {
      if (ref.current.srcObject !== stream) {
        ref.current.srcObject = stream;
        console.log("Set srcObject for remote video");
      }
      ref.current
        .play()
        .catch((e) => console.warn("Remote video play failed", e));
    }
  }, [stream]);

  return (
    <video
      ref={ref}
      className="w-full h-full object-cover bg-transparent"
      autoPlay
      playsInline
    />
  );
}
