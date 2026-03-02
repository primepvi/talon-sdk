import type {
	AckPayload,
	AppCreatePayload,
	AppDeployPayload,
	AppDestroyPayload,
	AppRedeployPayload,
	AppStartPayload,
	AppStatePayload,
	AppStopPayload,
	NodeRegisterPayload,
} from "./payloads";

export type MessageKind =
	| "node.register"
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

export interface AppCreateMessage extends BaseMessage {
	type: "app.create";
	payload: AppCreatePayload;
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

export interface AckMessage extends BaseMessage {
	type: "ack";
	payload: AckPayload;
}
