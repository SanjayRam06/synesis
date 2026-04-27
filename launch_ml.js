import { spawn } from "child_process";
import path from "path";

const mlDir = "c:/sem 4/synesis/ml-service";
const pythonExe = "c:/sem 4/synesis/.venv/Scripts/python.exe";

console.log("Starting ML Service from:", mlDir);

const child = spawn(`"${pythonExe}"`, ["-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"], {
  cwd: mlDir,
  stdio: "inherit",
  shell: true,
  env: { ...process.env }
});

child.on("error", (err) => {
  console.error("Failed to start ML Service:", err);
});

child.on("exit", (code) => {
  console.log("ML Service exited with code:", code);
});
