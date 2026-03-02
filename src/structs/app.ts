import { EventEmitter } from "node:events";
import type { AppRedeployPayload, AppStatePayload } from "@/types/payloads";
import type { Node } from "./node";
import type { AppEvents } from "@/types/app";

export class App extends EventEmitter<AppEvents> {
	private onStateBound: (payload: AppStatePayload) => void;

	public constructor(
		public id: string,
		public node: Node,
	) {
		super();
		this.onStateBound = (payload) => {
			if (payload.app_id === this.id) {
				this.emit("state", payload);
			}
		};
		
		this.node.on("app:state", this.onStateBound);
	}

	public async deploy(deployId: string): Promise<void> {
		const payload = await this.node.handleAppDeploy({
			app_id: this.id,
			deploy_id: deployId,
		});

		if (payload.state === "failed") {
			throw new Error(
				`Cannot create deploy in application: ${this.id}, because: ${payload.reason}`,
			);
		}
	}

	public async redeploy(
		payload: Omit<AppRedeployPayload, "app_id">,
	): Promise<void> {
		const result = await this.node.handleAppRedeploy({
			app_id: this.id,
			...payload,
		});

		if (result.state === "failed") {
			throw new Error(
				`Cannot create re-deploy in application: ${this.id}, because: ${result.reason}`,
			);
		}
	}

	public async start(): Promise<void> {
		const payload = await this.node.handleAppStart({
			app_id: this.id,
		});

		if (payload.state !== "running") {
			throw new Error(
				`Cannot start application with id: ${this.id}, because: ${payload.reason}`,
			);
		}
	}

	public async stop(): Promise<void> {
		const payload = await this.node.handleAppStop({
			app_id: this.id,
		});

		if (payload.state !== "idle") {
			throw new Error(
				`Cannot stop application with id: ${this.id}, because: ${payload.reason}`,
			);
		}
	}

	public async destroy(): Promise<void> {
		const payload = await this.node.handleAppDestroy({
			app_id: this.id,
		});

		this.node.off("app:state", this.onStateBound);

		if (payload.state !== "destroyed") {
			throw new Error(
				`Cannot destroy application with id: ${this.id}, because: ${payload.reason}`,
			);
		}
	}
}

