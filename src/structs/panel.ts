import { EventEmitter } from "node:events";
import { Node } from "./node";
import type { NodeRegisterMessage } from "@/types/messages";
import type { PanelEvents } from "@/types/panel";
import { WebSocketServer, type WebSocket } from "ws";
import type { Server } from "node:http";

export class Panel extends EventEmitter<PanelEvents> {
	private socket!: WebSocketServer;
	private nodeEnsureResolvers = new Map<string, ((node: Node) => void)[]>();

	public nodes = new Map<string, Node>();

	public constructor(private token: string) {
		super();
	}

	public listen(port: number): void {
		this.socket = new WebSocketServer({ port });
		this.setupSocket();
	}

	public attach(server: Server, path: string) {
		this.socket = new WebSocketServer({ noServer: true });
		this.setupSocket();

		server.on("upgrade", (request, socket, head) => {
			if (path && request.url !== path) return; 

			this.socket.handleUpgrade(request, socket, head, (ws) => {
				this.socket.emit("connection", ws, request);
			});
		});
	}

	private setupSocket() {
		this.socket.on("error", (err) => this.emit("error", err));
		this.socket.on("connection", (connection, request) => {
			this.handleConnection(connection, request.headers.authorization);
		});
	}

	private handleConnection(
		connection: WebSocket,
		authorization?: string,
	): void {
		if (authorization !== `Bearer ${this.token}`) {
			connection.close(1008, "Unauthorized.");
			return;
		}

		const registrationTimeout = setTimeout(() => {
			if (connection.readyState === connection.OPEN) {
				connection.close(1002, "Registration timeout.");
			}
		}, 10_000);

		connection.once("message", (data) => {
			clearTimeout(registrationTimeout);

			try {
				const message = JSON.parse(data.toString()) as NodeRegisterMessage;
				if (message.type !== "node.register") {
					connection.close(1002, "Expected 'node.register' payload.");
					return;
				}

				const { node_id: nodeId, version } = message.payload;
				if (!nodeId || !version) {
					connection.close(1007, "Invalid registration payload.");
					return;
				}

				const node = new Node(nodeId, version, connection);
				this.registerNode(node);
			} catch (err) {
				connection.close(
					1003,
					err instanceof Error ? err.message : "Invalid JSON payload.",
				);
			}
		});
	}

	private registerNode(node: Node): void {
		this.nodes.set(node.id, node);
		this.emit("node:connected", node);

		node.once("close", () => {
			this.nodes.delete(node.id);
			this.emit("node:disconnected", node);
		});

		const resolvers = this.nodeEnsureResolvers.get(node.id);
		if (resolvers) {
			for (const resolve of resolvers) {
				resolve(node);
			}

			this.nodeEnsureResolvers.delete(node.id);
		}
	}

	public getNodes(): Node[] {
		return Array.from(this.nodes.values());
	}

	public async waitForNode(id: string, timeout = 30_000): Promise<Node> {
		const node = this.nodes.get(id);
		if (node) return node;

		return new Promise<Node>((resolve, reject) => {
			const timer = setTimeout(() => {
				const resolvers = this.nodeEnsureResolvers.get(id);
				if (resolvers) {
					const index = resolvers.indexOf(resolve);
					if (index !== -1) resolvers.splice(index, 1);
					if (resolvers.length === 0) this.nodeEnsureResolvers.delete(id);
				}

				reject(new Error(`Timeout waiting for node: ${id}`));
			}, timeout);

			const resolvers = this.nodeEnsureResolvers.get(id) || [];
			resolvers.push((node) => {
				clearTimeout(timer);
				resolve(node);
			});

			this.nodeEnsureResolvers.set(id, resolvers);
		});
	}

	public async close(): Promise<void> {
		for (const node of this.nodes.values()) {
			node.close(1001, "Panel shutting down");
		}

		this.nodes.clear();

		return new Promise((resolve, reject) => {
			this.socket.close((err) => {
				if (err) reject(err);
				else resolve();
			});
		});
	}
}
