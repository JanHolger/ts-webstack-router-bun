import { HTTPMethod } from "@ts-webstack/router/HTTPMethod";
import { HTTPStatus, HTTP_STATUS_MESSAGES } from "@ts-webstack/router/HTTPStatus";
import IHTTPSocket from "@ts-webstack/router/adapter/IHTTPSocket";

export default class BunHTTPSocket implements IHTTPSocket {

    private url: URL
    private status: HTTPStatus
    private statusMessage: string
    private responseHeaders: Map<string, string> = new Map()
    private bodyChunks: any[] = []
    private closed: boolean

    constructor(private request: Request, private responseCallback: (response: Response) => void) {
        this.url = new URL(request.url)
    }

    getRequestMethod(): HTTPMethod {
        return this.request.method as HTTPMethod
    }

    getRequestPath(): string {
        return this.url.pathname
    }

    getRequestQuery(): string {
        return this.url.search.substring(1)
    }

    getRequestHeaderNames(): string[] {
        return Array.from(this.request.headers.keys())
    }

    getRequestHeader(key: string): string {
        return this.request.headers.get(key)
    }

    write(chunk: any) {
        this.bodyChunks.push(chunk)
    }

    setResponseHeader(key: string, value: string): void {
        this.responseHeaders.set(key, value)
    }

    setResponseStatus(status: HTTPStatus, message?: string): void {
        if(!message) {
            message = HTTP_STATUS_MESSAGES[status] || 'Unknown'
        }
        this.status = status
        this.statusMessage = message
    }

    getResponseStatus(): HTTPStatus {
        return this.status
    }

    close() {
        this.closed = true
        const response = new Response(new ReadableStream({
            start: (controller) => {
                for(let chunk of this.bodyChunks) {
                    controller.enqueue(chunk)
                }
                controller.close()
            }
        }), {
            status: this.status,
            statusText: this.statusMessage
        })
        for(let [key, value] of this.responseHeaders) {
            response.headers.set(key, value)
        }
        this.responseCallback(response)
    }

    isClosed(): boolean {
        return this.closed
    }

}