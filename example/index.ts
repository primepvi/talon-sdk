import { randomUUID } from "node:crypto";
import { Panel } from "@/structs/panel";

const panel = Panel.create({
	port: 9000,
	token: "banana",
});

panel.listen();

const node = await panel.waitForNode("banana");

const app = await node.createApp({
	app_id: randomUUID(),
	name: "panel-test-app",
	strategy: "dockerfile",
	repo: "https://github.com/primepvi/test",
	commit: "HEAD",
	resources: { cpu: 1.0, memory: 512 },
	env: { PORT: "3000" },
});

await app.deploy(randomUUID());
await app.redeploy({
	deploy_id: randomUUID(),
	changes: ["name"],
	name: "carlos"
})

await app.stop();
await app.destroy();

console.log("Finalized");