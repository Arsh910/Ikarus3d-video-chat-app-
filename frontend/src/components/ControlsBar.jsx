import { useEffect, useRef, useState } from "react";

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
  ),
  moreVertical: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="1"></circle>
      <circle cx="12" cy="12" r="1"></circle>
      <circle cx="12" cy="19" r="1"></circle>
    </svg>
  )
};

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
  pendingRequestsCount,
  chatNotificationsCount = 0,
  notificationSoundEnabled = true
}) {
  const btnBaseClass = "w-[52px] h-[52px] rounded-full flex items-center justify-center cursor-pointer transition-colors duration-200 border-none";
  const btnNormalClass = `${btnBaseClass} bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-[#1A1F2E] dark:hover:bg-[#252B3A] dark:text-white`;
  const btnActiveClass = `${btnBaseClass} bg-indigo-500 hover:bg-indigo-600 text-white`;
  const btnDangerClass = `${btnBaseClass} bg-red-500 hover:bg-red-600 text-white`;

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const moreBtnRef = useRef(null);

  const prevChatRef = useRef(null);
  const prevPendingRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (menuOpen) {
        if (menuRef.current && !menuRef.current.contains(e.target) && moreBtnRef.current && !moreBtnRef.current.contains(e.target)) {
          setMenuOpen(false);
        }
      }
    }
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [menuOpen]);

  // notification sound using Web Audio API
  const playNotificationSound = () => {
    try {
      if (!notificationSoundEnabled) return;
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.2);
      setTimeout(() => {
        if (ctx && ctx.state !== "closed") ctx.close().catch(() => {});
      }, 500);
    } catch (err) {
    }
  };

  useEffect(() => {
    if (prevChatRef.current === null || prevPendingRef.current === null) {
      prevChatRef.current = chatNotificationsCount;
      prevPendingRef.current = pendingRequestsCount;
      return;
    }

    if (chatNotificationsCount > prevChatRef.current || pendingRequestsCount > prevPendingRef.current) {
      playNotificationSound();
    }

    prevChatRef.current = chatNotificationsCount;
    prevPendingRef.current = pendingRequestsCount;
  }, [chatNotificationsCount, pendingRequestsCount, notificationSoundEnabled]);

  const showChatRing = chatNotificationsCount > 0;
  const showPartRing = pendingRequestsCount > 0;
  const showAnyRing = showChatRing || showPartRing;

  return (
    <>
      <style>{`
        @keyframes cb-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .cb-rotating-svg {
          animation: cb-rotate 1.1s linear infinite;
          pointer-events: none;
        }
      `}</style>

      <div className="flex h-full w-full items-center justify-between bg-white px-6 dark:bg-[#0F1419]">
        {/* Left Controls */}
        <div className="flex gap-4">
          <button onClick={onToggleMute} className={muted ? btnDangerClass : btnNormalClass} aria-label={muted ? "Unmute" : "Mute"}>
            {muted ? icons.micOff : icons.mic}
          </button>
          <button onClick={onToggleCam} className={camOff ? btnDangerClass : btnNormalClass} aria-label={camOff ? "Start video" : "Stop video"}>
            {camOff ? icons.videoOff : icons.video}
          </button>
          <button onClick={onToggleScreenShare} className={sharing ? btnActiveClass : btnNormalClass} aria-label={sharing ? "Stop sharing" : "Share screen"}>
            {icons.screenShare}
          </button>
        </div>

        {/* Center Leave button (circular) */}
        <div>
          <button
            onClick={onLeave}
            className="flex h-[52px] w-[52px] items-center justify-center rounded-full border-none bg-red-500 text-white transition-colors duration-200 hover:bg-red-600"
            aria-label="Leave meeting"
          >
            {icons.phoneOff}
          </button>
        </div>

        {/* Right Controls (desktop / tablet) */}
        <div className="hidden sm:flex gap-4 items-center">
          {/* Chat - relative wrapper so ring can sit around the whole button */}
          <div className="relative inline-flex items-center justify-center">
            <button
              onClick={onToggleChat}
              className={activePanelState === "chat" ? btnActiveClass : btnNormalClass}
              aria-label="Open chat"
            >
              {icons.messageSquare}
            </button>

            {/* red rotating ring for chat notifications */}
            {showChatRing && (
              <svg
                className="cb-rotating-svg absolute -left-1 -top-1 w-[60px] h-[60px]"
                viewBox="0 0 60 60"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                {/* Solid red stroke ring */}
                <circle cx="30" cy="30" r="26" stroke="#ef4444" strokeWidth="3" strokeLinecap="round"
                  strokeDasharray="120" strokeDashoffset="60" fill="none" />
              </svg>
            )}
          </div>

          {/* Participants */}
          <div className="relative inline-flex items-center justify-center">
            <button
              onClick={onToggleParticipants}
              className={activePanelState === "participants" ? btnActiveClass : btnNormalClass}
              aria-label="Open participants list"
            >
              {icons.users}
            </button>

            {/* red rotating ring for participant requests */}
            {showPartRing && (
              <svg
                className="cb-rotating-svg absolute -left-1 -top-1 w-[60px] h-[60px]"
                viewBox="0 0 60 60"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <circle cx="30" cy="30" r="26" stroke="#ef4444" strokeWidth="3" strokeLinecap="round"
                  strokeDasharray="120" strokeDashoffset="60" fill="none" />
              </svg>
            )}
          </div>
        </div>

        {/* Small screen: more button */}
        <div className="flex sm:hidden items-center">
          <div className="relative inline-block">
            <button
              ref={moreBtnRef}
              onClick={() => setMenuOpen((s) => !s)}
              className={menuOpen ? btnActiveClass : btnNormalClass}
              aria-label="More controls"
              title="More"
            >
              {icons.moreVertical}
            </button>

            {/* show a red rotating ring around more button if any notifications exist */}
            {showAnyRing && (
              <svg
                className="cb-rotating-svg absolute -left-1 -top-1 w-[60px] h-[60px]"
                viewBox="0 0 60 60"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <circle cx="30" cy="30" r="26" stroke="#ef4444" strokeWidth="3" strokeLinecap="round"
                  strokeDasharray="120" strokeDashoffset="60" fill="none" />
              </svg>
            )}

            {/* Overflow menu */}
            {menuOpen && (
              <div
                ref={menuRef}
                className="absolute right-0 mt-2 w-44 rounded-md shadow-lg bg-white dark:bg-[#0F1419] ring-1 ring-black ring-opacity-5 z-50"
              >
                <div className="py-1">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onToggleChat();
                    }}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 ${activePanelState === "chat" ? "bg-indigo-50 dark:bg-[#13203a]" : "hover:bg-gray-50 dark:hover:bg-[#111521]"}`}
                    aria-label="Open chat"
                  >
                    <span className="w-6 h-6 flex items-center justify-center">{icons.messageSquare}</span>
                    <span className="flex-1">Chat</span>
                    {chatNotificationsCount > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] rounded-full bg-red-500 text-white text-xs px-1">{chatNotificationsCount}</span>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onToggleParticipants();
                    }}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 ${activePanelState === "participants" ? "bg-indigo-50 dark:bg-[#13203a]" : "hover:bg-gray-50 dark:hover:bg-[#111521]"}`}
                    aria-label="Open participants"
                  >
                    <span className="w-6 h-6 flex items-center justify-center">{icons.users}</span>
                    <span className="flex-1">Participants</span>
                    {pendingRequestsCount > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] rounded-full bg-red-500 text-white text-xs px-1">{pendingRequestsCount}</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

