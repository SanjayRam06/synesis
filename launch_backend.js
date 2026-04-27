import { spawn } from "child_process";
import path from "path";
import fs from "fs";

const backendDir = "c:/sem 4/synesis/backend";
const serverScript = path.join(backendDir, "server.js");

console.log("Starting backend from:", backendDir);

const child = spawn("node", [`"${serverScript}"`], {
  cwd: backendDir,
  stdio: "inherit",
  shell: true,
  env: { ...process.env }
});

child.on("error", (err) => {
  console.error("Failed to start backend:", err);
});

child.on("exit", (code) => {
  console.log("Backend exited with code:", code);
});
