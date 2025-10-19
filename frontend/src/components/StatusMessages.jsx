import React from "react";

export default function StatusMessages({ isOwner, joinPending, permissions }) {
  if (!isOwner && joinPending) {
    return (
      <div
        className="text-sm font-medium mb-3 p-3 rounded-md border"
        style={{
          color: "#ff922b",
          background: "rgba(255,146,43,0.1)",
          borderColor: "#ff922b",
        }}
      >
        Waiting for host approval...
      </div>
    );
  }

  if (permissions && !permissions.allowed && !joinPending && !isOwner) {
    return (
      <div
        className="text-sm font-medium mb-3 p-3 rounded-md border"
        style={{
          color: "#ff6b6b",
          background: "rgba(255,107,107,0.1)",
          borderColor: "#ff6b6b",
        }}
      >
        Not admitted to the meeting
      </div>
    );
  }

  return null;
}
