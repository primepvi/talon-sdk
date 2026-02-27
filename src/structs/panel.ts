import { PanelConfig } from "@/types/panel";
import { WebSocketServer } from "ws";

export class Panel {
    private token: string;
    private socket: WebSocketServer; 

    public constructor({port, token}: PanelConfig) {
        this.token = token;
        this.socket = new WebSocketServer({
            port
        })
    }
}