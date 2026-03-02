import type { BaseMessage } from "./messages";
import type { AppStatePayload } from "./payloads";

export type NodeMessageResolver = (
	message: BaseMessage | null,
	error?: Error,
) => void;

export interface NodeEvents {
	close: [number, string];
	error: [Error];
	"app:state": [AppStatePayload];
}