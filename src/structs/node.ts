import { EventEmitter } from "node:events";
import { randomUUID } from "node:crypto";
import type { WebSocket } from "ws";

import type {
	AppStartMessage,
	AppCreateMessage,
	AppDeployMessage,
	AppStateMessage,
	BaseMessage,
	AppStopMessage,
	AppDestroyMessage,
	AppRedeployMessage,
} from "@/types/messages";

import type {
	AckPayload,
	AppCreatePayload,
	AppDeployPayload,
	AppDestroyPayload,
	AppRedeployPayload,
	AppStartPayload,
	AppStatePayload,
	AppStopPayload,
} from "@/types/payloads";

import type { NodeEvents, NodeMessageResolver } from "@/types/node";
import { ackHandler } from "@/utils/handlers";
import { App } from "./app";

export class Node extends EventEmitter<NodeEvents> {
	private queue = new Map<string, NodeMessageResolver>();

	public constructor(
		public id: string,
		public version: string,
		private connection: WebSocket,
	) {
		super();
		this.connection.on("message", (data) => this.handleRawMessage(data));
		
		this.connection.on("close", (code, reason) => {
			const error = new Error(`Connection closed: ${reason || code}`);
			for (const resolver of this.queue.values()) {
				resolver(null, error);
			}

			this.queue.clear();
			this.emit("close", code, reason.toString());
		});

		this.connection.on("error", (err) => this.emit("error", err));
	}

	public async createApp(payload: AppCreatePayload): Promise<App> {
		const result = await this.handleAppCreate(payload);

		if (result.status === "rejected") {
			throw new Error(
				`Cannot create app with id: ${payload.app_id}, because: ${result.reason}`,
			);
		}

		return new App(payload.app_id, this);
	}

	public async handleAppCreate(payload: AppCreatePayload): Promise<AckPayload> {
		const correlationId = randomUUID();

		return this.request<AckPayload, AppCreateMessage>(
			{
				type: "app.create",
				correlation_id: correlationId,
				payload,
			},
			(message) => message.payload as AckPayload,
		);
	}

	public async handleAppDeploy(
		payload: AppDeployPayload,
	): Promise<AppStatePayload> {
		const correlationId = randomUUID();

		await this.request<void, AppDeployMessage>(
			{
				type: "app.deploy",
				correlation_id: correlationId,
				payload,
			},
			ackHandler,
		);

		return this.waitFor<AppStatePayload>(correlationId, (message) => {
			const { payload } = message as AppStateMessage;
			return payload;
		});
	}

	public async handleAppStart(
		payload: AppStartPayload,
	): Promise<AppStatePayload> {
		const correlationId = randomUUID();

		await this.request<void, AppStartMessage>(
			{
				type: "app.start",
				correlation_id: correlationId,
				payload,
			},
			ackHandler,
		);

		return this.waitFor<AppStatePayload>(correlationId, (message) => {
			const { payload } = message as AppStateMessage;
			return payload;
		});
	}

	public async handleAppRedeploy(
		payload: AppRedeployPayload,
	): Promise<AppStatePayload> {
		const correlationId = randomUUID();

		await this.request<void, AppRedeployMessage>(
			{
				type: "app.redeploy",
				correlation_id: correlationId,
				payload,
			},
			ackHandler,
		);

		return this.waitFor<AppStatePayload>(correlationId, (message) => {
			const { payload } = message as AppStateMessage;
			return payload;
		});
	}

	public async handleAppStop(payload: AppStopPayload): Promise<AppStatePayload> {
		const correlationId = randomUUID();

		await this.request<void, AppStopMessage>(
			{
				type: "app.stop",
				correlation_id: correlationId,
				payload,
			},
			ackHandler,
		);

		return this.waitFor<AppStatePayload>(correlationId, (message) => {
			const { payload } = message as AppStateMessage;
			return payload;
		});
	}

	public async handleAppDestroy(
		payload: AppDestroyPayload,
	): Promise<AppStatePayload> {
		const correlationId = randomUUID();

		await this.request<void, AppDestroyMessage>(
			{
				type: "app.destroy",
				correlation_id: correlationId,
				payload,
			},
			ackHandler,
		);

		return this.waitFor<AppStatePayload>(correlationId, (message) => {
			const { payload } = message as AppStateMessage;
			return payload;
		});
	}

	private waitFor<T>(
		correlationId: string,
		handler: (message: BaseMessage) => T,
		timeout = 60_000,
	): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			const timer = setTimeout(() => {
				this.removeResolver(correlationId);
				reject(new Error(`Timeout waiting for response (${correlationId})`));
			}, timeout);

			this.addResolver(correlationId, (message, err) => {
				clearTimeout(timer);

				if (err) return reject(err);
				if (!message) return reject(new Error("No message received"));

				try {
					resolve(handler(message));
				} catch (err) {
					reject(err);
				}
			});
		});
	}

	private request<T, U extends BaseMessage>(
		message: U,
		handler: (message: BaseMessage) => T,
		timeout = 30_000,
	): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			const timer = setTimeout(() => {
				this.removeResolver(message.correlation_id);
				reject(new Error(`Request timeout (${message.type})`));
			}, timeout);

			this.addResolver(message.correlation_id, (incomingMessage, err) => {
				clearTimeout(timer);

				if (err) return reject(err);
				if (!incomingMessage) return reject(new Error("No message received"));

				try {
					resolve(handler(incomingMessage));
				} catch (err) {
					reject(err);
				}
			});

			this.connection.send(JSON.stringify(message), (err) => {
				if (err) {
					clearTimeout(timer);
					this.removeResolver(message.correlation_id);
					reject(err);
				}
			});
		});
	}

	private addResolver(
		correlationId: string,
		resolver: NodeMessageResolver,
	): void {
		this.queue.set(correlationId, resolver);
	}

	private removeResolver(correlationId: string): void {
		this.queue.delete(correlationId);
	}

	private handleRawMessage(data: WebSocket.RawData): void {
		try {
			const message = JSON.parse(data.toString()) as BaseMessage;
			if (!message.type) return;

			if (message.type === "app.state") {
				this.emit("app:state", message.payload as AppStatePayload);
			}

			if (message.correlation_id) {
				const resolver = this.queue.get(message.correlation_id);
				if (resolver) {
					resolver(message);
					this.removeResolver(message.correlation_id);
				}
			}
		} catch (err) {
			this.emit("error", err instanceof Error ? err : new Error(String(err)));
		}
	}

	public close(code?: number, reason?: string): void {
		this.connection.close(code, reason);
	}
}
