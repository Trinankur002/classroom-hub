const { spawn } = require("child_process")
const path = require("path")

const livekitPath = path.join(__dirname, "../livekit/livekit-server.exe")
const configPath = path.join(__dirname, "../livekit/livekit.yaml")

console.log("Starting LiveKit...")

const livekit = spawn(livekitPath, ["--config", configPath], {
    stdio: "inherit",
})

console.log("Starting NestJS...")

const nest = spawn("npx", ["nest", "start", "--watch"], {
    stdio: "inherit",
    shell: true
})

function shutdown() {
    console.log("\nShutting down services...")

    livekit.kill()
    nest.kill()

    process.exit()
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)