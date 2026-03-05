export interface NodeRegisterPayload {
	node_id: string;
	version: string;
}

export interface NodeSyncPayload {
	apps: AppCreatePayload[]
}

export interface NodeReadyPayload {
	apps: Array<{app_id: string, status: AppStatus}>
}

export type AppCreatePayload =
	| RegistryAppCreatePayload
	| DockerfileAppCreatePayload;

export interface RegistryAppCreatePayload {
	app_id: string;
	name: string;
	image: string;
	strategy: "registry";
	resources: {
		cpu: number;
		memory: number;
	};
	env?: Record<string, string>;
}

export interface DockerfileAppCreatePayload {
	app_id: string;
	name: string;
	repo: string;
	strategy: "dockerfile";
	resources: {
		cpu: number;
		memory: number;
	};
	env?: Record<string, string>;
	branch?: string;
	commit?: string;
}

export interface AppDeployPayload {
	app_id: string;
	deploy_id: string;
}

export type AppChanges = 
	| "name"
	| "image"
	| "strategy"
	| "env"
	| "repo"
	| "branch"
	| "commit"
	| "resources"

export type AppRedeployPayload = {
	app_id: string;
	deploy_id: string;
	changes: AppChanges[];
} & Partial<AppCreatePayload>

export interface AppActionPayload {
	app_id: string;
}

export type AppStartPayload = AppActionPayload;
export type AppStopPayload = AppActionPayload;
export type AppDestroyPayload = AppActionPayload;

export type AckPayload = AcceptedAckPayload | RejectedAckPayload;

export interface AcceptedAckPayload {
	status: "accepted";
}

export interface RejectedAckPayload {
	status: "rejected";
	reason: string;
}

export type AppStatus = 
 | "empty" 
 | "idle"
 | "deploying" 
 | "redeploying" 
 | "running"  
 | "failed" 
 | "crashed"
 | "destroyed"

export interface AppStatePayload {
	app_id: string;
	deploy_id: string | null;
	state: AppStatus;
	reason?: string;
}
