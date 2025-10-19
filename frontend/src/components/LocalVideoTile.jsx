const MicIcon = ({ muted }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={muted ? "#EF4444" : "#10B981"} strokeWidth="2">
    {muted ? (
      <>
        <line x1="1" y1="1" x2="23" y2="23"></line>
        <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
      </>
    ) : (
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
    )}
  </svg>
);

export default function LocalVideoTile(props) {
  const {
    localVideoRef,
    camOff,
    muted,
    name,
    isOwner,
    isSolo,
    isSpotlight,
    isThumbnail,
  } = props;

  let containerClasses = "relative w-full h-full rounded-xl overflow-hidden bg-slate-800 dark:bg-gray-700"; // Default for spotlight/solo
  if (isThumbnail) {
    containerClasses = "relative w-40 h-30 flex-shrink-0 rounded-lg overflow-hidden border-2 border-indigo-500 bg-slate-800 dark:bg-gray-700"; // Specific size for thumbnail
  }

  return (
    <div className={containerClasses}>
      {/* Video Element */}
      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover ${camOff ? 'hidden' : 'block'}`}
      />

      {camOff && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-center text-white text-sm font-semibold p-1 break-words">
            {name}
          </div>
        </div>
      )}

      {/* Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MicIcon muted={muted} />
          <span className="text-white text-sm font-medium truncate">{name}</span>
        </div>
        <span className="text-xs font-medium text-white bg-indigo-600 dark:bg-indigo-500 px-2 py-0.5 rounded">
          You {isOwner && "👑"}
        </span>
      </div>
    </div>
  );
}
