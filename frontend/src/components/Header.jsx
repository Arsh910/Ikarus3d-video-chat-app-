import { Copy, Check } from "lucide-react";
import { useState } from "react";

export default function Header({ meetingId, allParticipants }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(meetingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncatedId =
    meetingId?.length > 6
      ? `${meetingId.slice(0, 3)}...${meetingId.slice(-3)}`
      : meetingId;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-[60px] items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-[#252B3A] dark:bg-[#0F1419]">
      <div>
        <h1 className="m-0 text-xl font-semibold">Ikarus3d-project</h1>
        <p className="m-0 mt-1 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
          Meeting ID:{" "}
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {truncatedId}
          </span>
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            title="Copy Meeting ID"
          >
            {copied ? (
              <Check size={16} className="text-emerald-500" />
            ) : (
              <Copy size={16} className="text-gray-500 dark:text-gray-400" />
            )}
          </button>
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-sm font-medium">
            {allParticipants.length} Participants
          </span>
        </div>
      </div>
    </header>
  );
}
