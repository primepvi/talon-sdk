import type { Node } from "@/structs/node";

export interface PanelEvents {
	"node:connected": [Node];
	"node:disconnected": [Node];
	error: [Error];
}