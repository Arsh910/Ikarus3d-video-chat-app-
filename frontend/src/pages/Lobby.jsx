import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import toast, { Toaster } from "react-hot-toast";

export default function Lobby() {
  const [joinId, setJoinId] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    toast("⚠️ The first meeting may take ~50 seconds to load as the server wakes up (Render free tier).", {
      duration: 7000,
      position: "bottom-center",
      style: {
        background: "#333",
        color: "#fff",
        fontSize: "0.9rem",
      },
    });
  }, []);

  const createMeeting = () => {
    const id = uuidv4();
    console.log(id);
    navigate(`/meeting/${id}`);
  };

  const join = () => {
    if (joinId.trim()) navigate(`/meeting/${joinId.trim()}`);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 transition-colors duration-300
                 bg-white text-gray-900 dark:bg-[#0d1117] dark:text-[#c9d1d9]"
    >
      {/* Toast container */}
      <Toaster />

      <div className="w-full max-w-md p-8 rounded-2xl shadow-md bg-gray-100 dark:bg-[#161b22] text-center transition-colors duration-300">
        <h1 className="text-2xl font-bold mb-6">Ikarus3d Video Call Project</h1>

        <button
          onClick={createMeeting}
          className="w-full py-2 mb-5 text-white font-semibold rounded-md
                     bg-[#6366F1] hover:bg-[#5558E3] transition-colors duration-200"
        >
          Create Meeting
        </button>

        <div className="flex items-center justify-center">
          <input
            type="text"
            placeholder="Paste meeting ID"
            value={joinId}
            onChange={(e) => setJoinId(e.target.value)}
            className="flex-1 px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-[#30363d]
                       bg-white dark:bg-[#0d1117] text-gray-900 dark:text-[#c9d1d9]
                       placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2
                       focus:ring-[#6366F1] transition-all duration-200"
          />
          <button
            onClick={join}
            className="ml-2 px-4 py-2 rounded-md text-white font-semibold bg-[#238636]
                       hover:bg-[#2ea043] transition-colors duration-200"
          >
            Join
          </button>
        </div>

        <p className="mt-4 text-sm text-gray-600 dark:text-[#8b949e]">
          Copy the URL to invite others.
        </p>
      </div>
    </div>
  );
}
