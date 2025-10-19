import React from "react";
import ChatPanel from "./ChatPanel";
import UserInfo from "./UserInfo";
import HostControls from "./HostControls";

export default function Sidebar({
  messages,
  permissions,
  isOwner,
  mySocketId,
  pendingRequests,
  participantsList,
  onSendMessage,
  onAdmit,
  onDeny,
  onGrantPermission,
}) {
  return (
    <aside
      className="flex flex-col rounded-md overflow-hidden"
      style={{
        width: "340px",
        background: "#161b22",
        border: "1px solid #30363d",
      }}
    >
      <ChatPanel
        messages={messages}
        permissions={permissions}
        isOwner={isOwner}
        onSendMessage={onSendMessage}
      />

      <UserInfo
        mySocketId={mySocketId}
        isOwner={isOwner}
        permissions={permissions}
      />

      {isOwner && (
        <HostControls
          pendingRequests={pendingRequests}
          participantsList={participantsList}
          onAdmit={onAdmit}
          onDeny={onDeny}
          onGrantPermission={onGrantPermission}
        />
      )}
    </aside>
  );
}
