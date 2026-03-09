import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

const getSocketServerUrl = () => {
    let raw = import.meta.env.VITE_BACKEND_API_URL;

    if (!/^https?:\/\//i.test(raw)) {
        raw = `http://${raw}`;
    }

    return raw.replace(/\/+$/, "");
};

export const getGlobalSocket = (token?: string) => {
    if (!socket) {
        socket = io(getSocketServerUrl(), {
            transports: ["websocket"],
            autoConnect: false,
            auth: {
                token,
            },
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
        });
    }

    socket.auth = { token };
    return socket;
};
