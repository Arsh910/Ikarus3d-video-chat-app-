import React, { useState } from "react";

const COLORS = {
  primary: "#6366F1",
  danger: "#EF4444",
  bgMain: "#0F1419",
  bgSecondary: "#1A1F2E",
  bgTertiary: "#252B3A",
  textPrimary: "#FFFFFF",
  textSecondary: "#9CA3AF",
  success: "#10B981",
  warning: "#F59E0B",
};

export default function ParticipantRow({
  participant,
  isPending = false,
  isOwner = false,
  onAdmit,
  onDeny,
  onGrantPermission,
  onKickUser,
}) {
  const [isHovered, setIsHovered] = useState(false);

  const { socketId = "", name, isLocal, permissions } = participant || {};
  const displayName = name || `User-${socketId.substring(0, 4)}`;

  const userPerms = permissions || { unmute: false, video: false };

  return (
    <div
      className="w-full rounded-md p-3 flex items-center gap-3 transition-colors duration-150"
      style={{ background: COLORS.bgMain }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="listitem"
    >
      {/* Avatar */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
        style={{ background: isLocal ? COLORS.primary : COLORS.bgTertiary, color: COLORS.textPrimary }}
        aria-hidden
      >
        {displayName.charAt(0).toUpperCase()}
      </div>

      {/* Name & meta */}
      <div className="flex-1 min-w-0">
        <div
          className="text-sm font-medium truncate"
          style={{ color: COLORS.textPrimary }}
          title={displayName}
        >
          {displayName} {isLocal && "(You)"}
        </div>

        {participant?.is_owner && (
          <span
            className="inline-block mt-1 text-xs font-medium rounded"
            style={{ background: COLORS.primary, color: COLORS.textPrimary, padding: "2px 8px" }}
          >
            Host
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Pending actions (Admit / Deny) */}
        {isPending && isOwner && (
          <div className="flex items-center gap-2">
            <button
              title="Admit"
              onClick={() => onAdmit && onAdmit(socketId, name)}
              className="w-8 h-8 rounded-full flex items-center justify-center transition"
              style={{
                border: `1px solid ${COLORS.success}`,
                color: COLORS.success,
                background: "transparent",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>

            <button
              title="Deny"
              onClick={() => onDeny && onDeny(socketId)}
              className="w-8 h-8 rounded-full flex items-center justify-center transition"
              style={{
                border: `1px solid ${COLORS.danger}`,
                color: COLORS.danger,
                background: "transparent",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        {/* Host actions (Kick) — shown only when hovered, not for local user */}
        {!isPending && isOwner && !isLocal && (
          <div className={`${isHovered ? "flex" : "hidden"} items-center gap-2`}>
            <button
              title="Kick User"
              onClick={() => onKickUser && onKickUser(socketId)}
              className="w-8 h-8 rounded-full flex items-center justify-center transition"
              style={{
                border: `1px solid ${COLORS.danger}`,
                color: COLORS.danger,
                background: "transparent",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
