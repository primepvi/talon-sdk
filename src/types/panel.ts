import type { Node } from "@/structs/node";

export interface PanelConfig {
	port: number;
	token: string;
}

export interface PanelEvents {
	"node:connected": [Node];
	"node:disconnected": [Node];
	error: [Error];
}