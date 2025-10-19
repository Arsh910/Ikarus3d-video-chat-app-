import React, { useRef } from "react";

export default function ChatPanel({ messages, permissions, isOwner, onSendMessage }) {
  const msgRef = useRef();

  const handleSend = () => {
    const text = msgRef.current?.value;
    if (!text) return;
    onSendMessage(text);
    if (msgRef.current) msgRef.current.value = "";
  };

  const isDisabled = permissions && !permissions.allowed && !isOwner;

  return (
    <div className="flex flex-1 flex-col border-b border-gray-200 bg-gray-50 dark:border-[#30363d] dark:bg-[#161b22]">
      <h4 className="m-3 mb-2 text-sm font-semibold text-gray-900 dark:text-white">
        💬 Chat
      </h4>

      <div className="flex-1 overflow-y-auto bg-white p-3 text-[13px] dark:bg-[#0d1117]">
        {messages.length === 0 && (
          <div className="text-gray-500 dark:text-[#8b949e]">
            No messages yet
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className="mb-2">
            <div className="text-xs font-semibold text-blue-600 dark:text-[#79c0ff]">
              {m.fromName}
            </div>
            <div className="mt-0.5 break-words text-gray-800 dark:text-[#c9d1d9]">
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 border-t border-gray-200 p-3 dark:border-[#30363d]">
        <input
          ref={msgRef}
          placeholder="Type message..."
          disabled={isDisabled}
          className="flex-1 rounded border border-gray-300 bg-white px-2.5 py-1.5 text-[13px] text-gray-900 placeholder-gray-500 disabled:opacity-60 dark:border-[#30363d] dark:bg-[#0d1117] dark:text-[#c9d1d9] dark:placeholder-gray-400"
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          onClick={handleSend}
          disabled={isDisabled}
          className="rounded border-none bg-[#238636] px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-[#2a9a42] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Send
        </button>
      </div>
    </div>
  );
}