import { io, Socket } from "socket.io-client";
import { resolveBackendOrigin } from "@/lib/backend-url";

let socket: Socket | null = null;

export const getGlobalSocket = (token?: string) => {
    if (!socket) {
        socket = io(resolveBackendOrigin(), {
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
    socket.connect();
    return socket;
};
