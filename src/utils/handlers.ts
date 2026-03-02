import type { AckMessage, BaseMessage } from "@/types/messages";

export function ackHandler(message: BaseMessage) {
	const { payload } = message as AckMessage;
	if (payload.status === "rejected") {
		throw new Error(payload.reason);
	}
}
