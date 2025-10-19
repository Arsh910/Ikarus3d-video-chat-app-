const icons = {
  mic: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
      <line x1="12" y1="19" x2="12" y2="23"></line>
    </svg>
  ),
  micOff: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="1" x2="23" y2="23"></line>
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
      <line x1="12" y1="19" x2="12" y2="23"></line>
    </svg>
  ),
  video: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7"></polygon>
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
    </svg>
  ),
  videoOff: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="1" x2="23" y2="23"></line>
      <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2l10 10z"></path>
      <path d="M23 7v10"></path><path d="M16 12l7 5"></path><path d="M16 12l7-5"></path>
    </svg>
  ),
  screenShare: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"></path>
      <path d="M22 3h-6"></path><path d="M16 3v6"></path>
      <path d="M16 9l6-6"></path>
    </svg>
  ),
  phoneOff: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="1" x2="23" y2="23"></line>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
    </svg>
  ),
  messageSquare: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  ),
  users: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  )
};

// Main component
export default function ControlsBar({
  muted,
  camOff,
  sharing,
  onToggleMute,
  onToggleCam,
  onToggleScreenShare,
  onLeave,
  onToggleChat,
  onToggleParticipants,
  activePanelState,
  pendingRequestsCount
}) {

  // Base style for all control buttons
  const btnBaseClass = "w-[52px] h-[52px] rounded-full flex items-center justify-center cursor-pointer transition-colors duration-200 border-none";

  // Style for default (non-active) buttons
  const btnNormalClass = `${btnBaseClass} bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-[#1A1F2E] dark:hover:bg-[#252B3A] dark:text-white`;

  // Style for buttons that are "active" (e.g., sharing, panel open)
  const btnActiveClass = `${btnBaseClass} bg-indigo-500 hover:bg-indigo-600 text-white`;

  // Style for "danger" state buttons (e.g., muted, cam off)
  const btnDangerClass = `${btnBaseClass} bg-red-500 hover:bg-red-600 text-white`;

  return (
    <div
      className="flex h-full w-full items-center justify-between bg-white px-6 dark:bg-[#0F1419]"
    >
      {/* Left Controls (Mic, Cam, Share) */}
      <div className="flex gap-4">
        <button
          onClick={onToggleMute}
          className={muted ? btnDangerClass : btnNormalClass}
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? icons.micOff : icons.mic}
        </button>
        <button
          onClick={onToggleCam}
          className={camOff ? btnDangerClass : btnNormalClass}
          aria-label={camOff ? "Start video" : "Stop video"}
        >
          {camOff ? icons.videoOff : icons.video}
        </button>
        <button
          onClick={onToggleScreenShare}
          className={sharing ? btnActiveClass : btnNormalClass}
          aria-label={sharing ? "Stop sharing" : "Share screen"}
        >
          {icons.screenShare}
        </button>
      </div>

      {/* Center Controls (Leave) */}
      <div>
        <button
          onClick={onLeave}
          className="flex h-[52px] w-auto items-center justify-center rounded-xl border-none bg-red-500 px-6 text-white transition-colors duration-200 hover:bg-red-600"
          aria-label="Leave meeting"
        >
          {icons.phoneOff}
          <span className="ml-2">Leave</span>
        </button>
      </div>

      {/* Right Controls (Chat, Participants) */}
      <div className="flex gap-4">
        <button
          onClick={onToggleChat}
          className={activePanelState === 'chat' ? btnActiveClass : btnNormalClass}
          aria-label="Open chat"
        >
          {icons.messageSquare}
        </button>

        {/* PARTICIPANTS BUTTON WRAPPER */}
        <div className="relative inline-block">
          <button
            onClick={onToggleParticipants}
            className={activePanelState === 'participants' ? btnActiveClass : btnNormalClass}
            aria-label="Open participants list"
          >
            {icons.users}
          </button>

          {/* NOTIFICATION DOT */}
          {pendingRequestsCount > 0 && (
            <div
              className="absolute top-1 right-1 h-[10px] w-[10px] rounded-full border-2 border-white bg-red-500 dark:border-[#0F1419]"
            />
          )}
        </div>
      </div>
    </div>
  );
}