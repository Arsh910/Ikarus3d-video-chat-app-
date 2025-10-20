
let HOST = import.meta.env.SERVER_HOST ? `wss://${import.meta.env.SERVER_HOST}` : 'ws://127.0.0.1:8000'

export const SIGNALING_URL = HOST+'/ws/video_chat';
export const STUN = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
 