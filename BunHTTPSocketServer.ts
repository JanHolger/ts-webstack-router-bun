import { Server } from "bun";
import IHTTPSocketServer from "@ts-webstack/router/adapter/IHTTPSocketServer";
import { IHTTPSocketHandler } from "@ts-webstack/router/adapter/IHTTPSocketHandler";
import BunHTTPSocket from "./BunHTTPSocket";

export default class BunHTTPSocketServer implements IHTTPSocketServer {

    private port: number = 80;
    private server: Server;
    private handler: IHTTPSocketHandler;

    setPort(port: number) {
        this.port = port
    }

    getPort(): number {
        return this.port
    }

    setHandler(handler: IHTTPSocketHandler) {
        this.handler = handler
    }

    async start() {
        if(this.server) {
            throw new Error('Server has already been started')
        }
        const socketServer = this
        this.server = Bun.serve({
            development: false,
            port: this.port,
            async fetch(req: Request) {
                let res = null
                const socket = new BunHTTPSocket(req, r => res = r)
                await socketServer.handler(socket)
                if(!socket.isClosed()) {
                    socket.close()
                }
                return res || new Response('Unexpected server error')
            }
        })
    }

    async stop() {
        if(!this.server) {
            throw new Error("Server hasn't been started")
        }
        this.server.stop()
    }

}