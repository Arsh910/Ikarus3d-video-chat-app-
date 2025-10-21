import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const icons = {
  mic: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
      <line x1="12" y1="19" x2="12" y2="23"></line>
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
  phoneOff: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
    </svg>
  ),
  screenShare: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"></path>
      <path d="M22 3h-6"></path><path d="M16 3v6"></path>
      <path d="M16 9l6-6"></path>
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

const MENU_CONFIG = {
  iconSize: 48,
  iconGap: 8,
  padding: 8,
  iconsCount: 2
};

const NotificationRing = () => (
  <svg 
    className="cb-rotating-svg" 
    style={{
      position: "absolute",
      left: -4,
      top: -4,
      width: 56,
      height: 56,
      pointerEvents: "none",
    }}
    viewBox="0 0 56 56" 
    fill="none" 
    aria-hidden
  >
    <circle cx="28" cy="28" r="24" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeDasharray="120" strokeDashoffset="60" fill="none" />
  </svg>
);

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
  const btnBase = "w-[52px] h-[52px] rounded-full flex items-center justify-center cursor-pointer transition-colors duration-200 border-none";
  const btnNormal = `${btnBase} bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-[#1A1F2E] dark:hover:bg-[#252B3A] dark:text-white`;
  const btnActive = `${btnBase} bg-indigo-500 hover:bg-indigo-600 text-white`;
  const btnDanger = `${btnBase} bg-red-500 hover:bg-red-600 text-white`;

  const moreBtnRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [portalPos, setPortalPos] = useState({ left: 0, top: 0 });

  const menuWidth = MENU_CONFIG.iconsCount * MENU_CONFIG.iconSize + 
                    (MENU_CONFIG.iconsCount - 1) * MENU_CONFIG.iconGap + 
                    MENU_CONFIG.padding * 2;
  const menuHeight = MENU_CONFIG.iconSize + MENU_CONFIG.padding * 2;

  // Notification sound
  const playNotificationSound = useCallback(() => {
    if (!notificationSoundEnabled) return;
    try {
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
      setTimeout(() => { if (ctx?.state !== "closed") ctx.close().catch(() => {}); }, 500);
    } catch {}
  }, [notificationSoundEnabled]);

  // Play sound on notification increases
  const prevChatRef = useRef(null);
  const prevPendingRef = useRef(null);
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
  }, [chatNotificationsCount, pendingRequestsCount, playNotificationSound]);

  // Compute portal position
  const computePortalPos = useCallback(() => {
    const btn = moreBtnRef.current;
    if (!btn) return;
    
    const rect = btn.getBoundingClientRect();
    const gapBetween = 8;
    const rightEdge = rect.left - gapBetween;
    
    let left = Math.max(8, Math.min(rightEdge - menuWidth, window.innerWidth - menuWidth - 8));
    let top = Math.max(8, Math.min(rect.top + rect.height / 2 - menuHeight / 2, window.innerHeight - menuHeight - 8));

    setPortalPos({ left, top });
  }, [menuWidth, menuHeight]);

  // Update position when menu is open
  useEffect(() => {
    if (!menuOpen && !isAnimating) return;
    
    const raf = requestAnimationFrame(() => setTimeout(computePortalPos, 0));
    const onChange = () => computePortalPos();
    
    window.addEventListener("resize", onChange);
    window.addEventListener("scroll", onChange, true);
    
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onChange);
      window.removeEventListener("scroll", onChange, true);
    };
  }, [menuOpen, isAnimating, computePortalPos]);

  // Handle animation state
  useEffect(() => {
    if (menuOpen) {
      setIsAnimating(true);
    } else if (isAnimating) {
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [menuOpen, isAnimating]);

  const showChatRing = chatNotificationsCount > 0;
  const showPartRing = pendingRequestsCount > 0;
  const showAnyRing = showChatRing || showPartRing;

  // Portal Menu
  const PortalMenu = (menuOpen || isAnimating) ? createPortal(
    <div
      className="cb-horizontal-portal"
      style={{
        position: "fixed",
        left: portalPos.left,
        top: portalPos.top,
        width: menuWidth,
        height: menuHeight,
        zIndex: 2147483647,
        pointerEvents: menuOpen ? "auto" : "none",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="w-full h-full rounded-lg flex items-center gap-[8px] p-[1px] transition-all"
        style={{
          transformOrigin: "right center",
          transition: "all 280ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          transform: menuOpen ? "scaleX(1) scaleY(1) translateX(0)" : "scaleX(0.1) scaleY(0.6) translateX(40px)",
          opacity: menuOpen ? 1 : 0,
          /* boxShadow & border are replicated via Tailwind classes below using className */
        }}
      >
        <div className="absolute inset-0 rounded-lg pointer-events-none -z-10"></div>

        <div
          className="flex items-center gap-[8px] w-full h-full rounded-lg"
          style={{
            padding: 0,
          }}
        >
          {/* Actual background wrapper with theme-aware Tailwind classes */}
          <div
            className="w-full h-full rounded-lg flex items-center gap-[8px] p-[8px] bg-white border border-gray-200 shadow-[0_12px_28px_rgba(0,0,0,0.06)] dark:bg-[#0F1419] dark:border-white/6 dark:shadow-[0_12px_28px_rgba(0,0,0,0.55)]"
            style={{
              transformOrigin: "right center"
            }}
          >
            {/* Chat Button */}
            <div style={{ position: "relative" }}>
              <button
                onClick={onToggleChat}
                style={{
                  width: MENU_CONFIG.iconSize,
                  height: MENU_CONFIG.iconSize,
                  borderRadius: "50%",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 280ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                  transitionDelay: menuOpen ? "50ms" : "0ms",
                  transform: menuOpen ? "scale(1) rotate(0deg)" : "scale(0) rotate(-180deg)",
                  opacity: menuOpen ? 1 : 0,
                }}
                aria-label="Open chat"
                className="bg-white dark:bg-[#1A1F2E] border-none"
              >
                <div className="w-6 h-6 text-gray-700 dark:text-white">
                  {icons.messageSquare}
                </div>
              </button>
              {showChatRing && <NotificationRing />}
            </div>

            {/* Participants Button */}
            <div style={{ position: "relative" }}>
              <button
                onClick={onToggleParticipants}
                style={{
                  width: MENU_CONFIG.iconSize,
                  height: MENU_CONFIG.iconSize,
                  borderRadius: "50%",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 280ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                  transitionDelay: menuOpen ? "100ms" : "0ms",
                  transform: menuOpen ? "scale(1) rotate(0deg)" : "scale(0) rotate(-180deg)",
                  opacity: menuOpen ? 1 : 0,
                }}
                aria-label="Open participants"
                className="bg-white dark:bg-[#1A1F2E] border-none"
              >
                <div className="w-6 h-6 text-gray-700 dark:text-white">
                  {icons.users}
                </div>
              </button>
              {showPartRing && <NotificationRing />}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <style>{`
        @keyframes cb-rotate { 0% { transform: rotate(0deg) } 100% { transform: rotate(360deg) } }
        .cb-rotating-svg { animation: cb-rotate 1.1s linear infinite; pointer-events: none; }
      `}</style>

      <div className="flex h-full w-full items-center justify-between bg-white px-6 dark:bg-[#0F1419]">
        {/* Left Controls */}
        <div className="flex gap-4">
          <button onClick={onToggleMute} className={muted ? btnDanger : btnNormal} aria-label={muted ? "Unmute" : "Mute"}>
            {icons.mic}
          </button>
          <button onClick={onToggleCam} className={camOff ? btnDanger : btnNormal} aria-label={camOff ? "Start video" : "Stop video"}>
            {icons.screenShare}
          </button>
          <button onClick={onToggleScreenShare} className={sharing ? btnActive : btnNormal} aria-label={sharing ? "Stop sharing" : "Share screen"}>
            {icons.screenShare}
          </button>
        </div>

        {/* Center Leave */}
        <button
          onClick={onLeave}
          className="flex h-[52px] w-[52px] items-center justify-center rounded-full border-none bg-red-500 text-white transition-colors duration-200 hover:bg-red-600"
          aria-label="Leave meeting"
        >
          {icons.phoneOff}
        </button>

        {/* Right Controls (desktop) */}
        <div className="hidden sm:flex gap-4 items-center">
          <div className="relative inline-flex items-center justify-center">
            <button onClick={onToggleChat} className={activePanelState === "chat" ? btnActive : btnNormal} aria-label="Open chat">
              {icons.messageSquare}
            </button>
            {showChatRing && <NotificationRing />}
          </div>

          <div className="relative inline-flex items-center justify-center">
            <button onClick={onToggleParticipants} className={activePanelState === "participants" ? btnActive : btnNormal} aria-label="Open participants list">
              {icons.users}
            </button>
            {showPartRing && <NotificationRing />}
          </div>
        </div>

        {/* Mobile: Three-dot menu */}
        <div className="flex sm:hidden items-center">
          <div className="relative inline-flex items-center justify-center">
            <button
              ref={moreBtnRef}
              onClick={() => {
                setMenuOpen(prev => {
                  if (!prev) requestAnimationFrame(() => computePortalPos());
                  return !prev;
                });
              }}
              className={menuOpen ? btnActive : btnNormal}
              aria-label="More"
            >
              {icons.moreVertical}
            </button>
            {showAnyRing && <NotificationRing />}
          </div>
        </div>
      </div>

      {PortalMenu}
    </>
  );
}
