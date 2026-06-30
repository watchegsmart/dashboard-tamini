// src/socket.js
import { io } from "socket.io-client";

const SERVER_URL = process.env.REACT_APP_SERVER_URL || "https://tamini-server-3.onrender.com";

export const socket = io(SERVER_URL, {
  transports: ["websocket", "polling"],
  autoConnect: false,
});
