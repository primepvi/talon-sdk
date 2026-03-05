import { randomUUID } from "node:crypto";
import { Panel } from "@/structs/panel";

const panel = Panel.create({
	port: 9000,
	token: "banana",
});

panel.listen();

const node = await panel.waitForNode("banana");

const [app, ...rest] = await node.sync({
	apps: [
		{
			app_id: "e20aaca2-6fef-4a0c-a016-21b9303de69d",
			name: "carlos",
			strategy: "dockerfile",
			repo: "https://github.com/primepvi/test",
			commit: "HEAD",
			resources: { cpu: 1.0, memory: 512 },
			env: { PORT: "3000" },
		},
	],
});

console.log(rest);

await app.start();

console.log("Started")
