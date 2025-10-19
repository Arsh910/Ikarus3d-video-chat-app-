import React, { useState, useEffect } from 'react';
import RemoteVideo from './RemoteVideo';

export default function RemoteVideoTile(props) {
  const {
    stream,
    participant,
    isSpotlight,
    isThumbnail,
  } = props;

  const [hasVideoTrack, setHasVideoTrack] = useState(false);

  const name = participant?.name || "User";
  const isVideoAllowed = participant ? participant.permissions.video : true;

  useEffect(() => {
    let videoTrack = null;
    const handleTrackEnded = () => setHasVideoTrack(false);

    if (stream && stream.getVideoTracks().length > 0) {
       videoTrack = stream.getVideoTracks()[0];
       setHasVideoTrack(videoTrack.enabled && !videoTrack.muted);
       videoTrack.addEventListener('ended', handleTrackEnded);

       videoTrack.onmute = () => setHasVideoTrack(false);
       videoTrack.onunmute = () => setHasVideoTrack(true);


    } else {
      setHasVideoTrack(false);
    }

    return () => {
      if (videoTrack) {
        videoTrack.removeEventListener('ended', handleTrackEnded);
        videoTrack.onmute = null;
        videoTrack.onunmute = null;
      }
    };
  }, [stream]);


  let containerClasses = "relative w-full h-full rounded-xl overflow-hidden bg-slate-800 dark:bg-gray-700";
  if (isThumbnail) {
    containerClasses = "relative w-40 h-30 flex-shrink-0 rounded-lg overflow-hidden bg-slate-800 dark:bg-gray-700";
  }
  const showVideo = isVideoAllowed && stream && hasVideoTrack;

  return (
    <div className={containerClasses}>
      {showVideo ? (
        <RemoteVideo stream={stream} />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-center">
          <div>
            <div className="w-20 h-20 rounded-full bg-slate-700 dark:bg-gray-600 flex items-center justify-center text-center text-white text-sm font-semibold p-1 break-words mx-auto mb-2">
              {name}
            </div>
            {!isVideoAllowed && (
              <p className="text-xs text-slate-400 dark:text-gray-400">
                Video disabled by host
              </p>
            )}
             {isVideoAllowed && !hasVideoTrack && (
               <p className="text-xs text-slate-400 dark:text-gray-400">
                 Camera off
               </p>
            )}
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 px-3 py-2">
        <span className="text-white text-sm font-medium truncate">{name}</span>
      </div>
    </div>
  );
}