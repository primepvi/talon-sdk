export interface NodeRegisterPayload {
    node_id: string;
    version: string;
}

export type AppCreatePayload = RegistryAppCreatePayload | DockerfileAppCreatePayload;

export interface RegistryAppCreatePayload {
    app_id: string;
    name: string;
    image: string;
    strategy: "registry";
    resources: {
        cpu: number;
        memory: number;
    };
    env?: Record<string, string>
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

export type AckPayload = AcceptedAckPayload | RejectedAckPayload;

export interface AcceptedAckPayload {
    status: "accepted";
}

export interface RejectedAckPayload {
    status: "rejected";
    reason: string;
}

export interface AppStatePayload {
    app_id: string;
    deploy_id: string | null;
    state: "running" | "failed";
    reason?: string;
}