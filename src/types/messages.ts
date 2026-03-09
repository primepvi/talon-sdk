import type {
	AckPayload,
	AppDeployPayload,
	AppDestroyPayload,
	AppRedeployPayload,
	AppStartPayload,
	AppStatePayload,
	AppStopPayload,
	NodeReadyPayload,
	NodeRegisterPayload,
	NodeSyncPayload,
} from "./payloads";

export type MessageKind =
	| "node.register"
	| "node.sync"
	| "node.ready"
	| "app.create"
	| "app.deploy"
	| "app.redeploy"
	| "app.state"
	| "app.start"
	| "app.stop"
	| "app.destroy"
	| "ack";

export interface BaseMessage {
	type: MessageKind;
	correlation_id: string;
	payload: unknown;
}

export interface AppDeployMessage extends BaseMessage {
	type: "app.deploy";
	payload: AppDeployPayload;
}

export interface AppRedeployMessage extends BaseMessage {
	type: "app.redeploy";
	payload: AppRedeployPayload;
}

export interface AppStateMessage extends BaseMessage {
	type: "app.state";
	payload: AppStatePayload;
}

export interface AppStartMessage extends BaseMessage {
	type: "app.start";
	payload: AppStartPayload;
} 

export interface AppStopMessage extends BaseMessage {
	type: "app.stop";
	payload: AppStopPayload;
}

export interface AppDestroyMessage extends BaseMessage {
	type: "app.destroy";
	payload: AppDestroyPayload;
}

export interface NodeRegisterMessage extends BaseMessage {
	type: "node.register";
	payload: NodeRegisterPayload;
}

export interface NodeSyncMessage extends BaseMessage {
	type: "node.sync";
	payload: NodeSyncPayload;
}

export interface NodeReadyMessage extends BaseMessage {
	type: "node.ready";
	payload: NodeReadyPayload;
}

export interface AckMessage extends BaseMessage {
	type: "ack";
	payload: AckPayload;
}
