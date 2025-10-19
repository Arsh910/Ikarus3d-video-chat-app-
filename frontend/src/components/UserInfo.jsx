import React from "react";

export default function UserInfo({ mySocketId, isOwner, permissions }) {
  return (
    <div
      className="p-3 text-[12px] border-b transition-colors duration-300
                 bg-white text-gray-900 dark:bg-[#0d1117] dark:text-[#c9d1d9]
                 border-gray-300 dark:border-[#30363d]"
    >
      <div className="mb-2">
        <div className="font-semibold text-[#79c0ff]">Your ID</div>
        <div
          className="font-mono break-all text-[11px] text-[#8b949e]"
          title={mySocketId || "Connecting..."}
        >
          {mySocketId ? `${mySocketId.substring(0, 12)}...` : "Connecting..."}
        </div>
      </div>


      <div className="mb-2">
        <div className="font-semibold text-[#79c0ff]">Role</div>
        <div
          className="font-semibold"
          style={{ color: isOwner ? "#ffa657" : "#79c0ff" }}
        >
          {isOwner ? "👑 Host" : "Attendee"}
        </div>
      </div>


      <div>
        <div className="font-semibold text-[#79c0ff]">Status</div>
        <div
          className="text-[11px]"
          style={{
            color: permissions?.allowed ? "#3fb950" : "#d29922",
          }}
        >
          {permissions?.allowed ? "Admitted" : "Pending"}
        </div>
      </div>
    </div>
  );
}
