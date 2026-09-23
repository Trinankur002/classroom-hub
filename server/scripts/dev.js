const { spawn } = require("child_process")
const path = require("path")

const fs = require("fs")

const livekitPath = path.join(__dirname, "../livekit/livekit-server.exe")
const configPath = path.join(__dirname, "../livekit/livekit.yaml")

let livekit = null
if (fs.existsSync(livekitPath)) {
    console.log("Starting LiveKit...")
    livekit = spawn(livekitPath, ["--config", configPath], {
        stdio: "inherit",
    })
    livekit.on("error", (err) => {
        console.warn("LiveKit failed to start:", err.message)
    })
} else {
    console.log("LiveKit binary not found at " + livekitPath + " (skipping local LiveKit executable)")
}

console.log("Starting NestJS...")

const nest = spawn("npx", ["nest", "start", "--watch"], {
    stdio: "inherit",
    shell: true
})

function shutdown() {
    if (livekit) {
        try { livekit.kill(); } catch (_) {}
    }
    try { nest.kill(); } catch (_) {}
    process.exit(0);
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)