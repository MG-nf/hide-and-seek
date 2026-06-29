import { execSync } from "child_process";
import os from "os";

const port = process.argv[2] || 3000;
const platform = os.platform();

try {
  if (platform === "win32") {
    const output = execSync(`netstat -aon | findstr :${port}`).toString();
    const lines = output.trim().split("\n");

    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parseInt(parts[parts.length - 1]);

      if (pid > 0) {
        try {
          // This specific command is wrapped to suppress errors if the process is already gone
          execSync(`taskkill /f /pid ${pid}`, { stdio: "ignore" });
          console.log(`Successfully killed process ${pid} on port ${port}`);
        } catch (e) {
          // Process already died, ignore it silently
        }
      }
    }
  } else {
    try {
      execSync(`fuser -k ${port}/tcp`, { stdio: "ignore" });
    } catch (e) {
      // Nothing to kill
    }
  }
} catch (e) {
  // No processes found on this port at all
}
