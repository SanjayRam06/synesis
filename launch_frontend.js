import { spawn } from "child_process";
import path from "path";

const frontendDir = "c:/sem 4/synesis/frontend";

console.log("Starting frontend from:", frontendDir);

const child = spawn("npx", ["vite"], {
  cwd: frontendDir,
  stdio: "inherit",
  shell: true,
  env: { ...process.env }
});

child.on("error", (err) => {
  console.error("Failed to start frontend:", err);
});

child.on("exit", (code) => {
  console.log("Frontend exited with code:", code);
});
