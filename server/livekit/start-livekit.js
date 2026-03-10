const { spawn } = require("child_process")
const net = require("net")
const fs = require("fs")
const path = require("path")

const PORT = 7880
const PID_FILE = path.join(__dirname, "livekit.pid")

function isPortInUse(port) {
    return new Promise((resolve) => {
        const server = net.createServer()

        server.once("error", () => resolve(true))

        server.once("listening", () => {
            server.close()
            resolve(false)
        })

        server.listen(port)
    })
}

async function startLiveKit() {
    const inUse = await isPortInUse(PORT)

    if (inUse) {
        console.log("LiveKit already running on port 7880")
        return
    }

    console.log("Starting LiveKit server...")

    const livekitPath = path.join(__dirname, "livekit-server.exe")
    const configPath = path.join(__dirname, "livekit.yaml")

    const livekit = spawn(livekitPath, ["--config", configPath], {
        stdio: "inherit",
    })

    fs.writeFileSync(PID_FILE, livekit.pid.toString())

    livekit.on("exit", () => {
        if (fs.existsSync(PID_FILE)) {
            fs.unlinkSync(PID_FILE)
        }
    })

    process.on("SIGINT", () => {
        console.log("Stopping LiveKit...")
        livekit.kill()
        process.exit()
    })
}

startLiveKit()