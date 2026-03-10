const fs = require("fs")
const path = require("path")

const PID_FILE = path.join(__dirname, "livekit.pid")

if (!fs.existsSync(PID_FILE)) {
    console.log("LiveKit is not running.")
    process.exit()
}

const pid = fs.readFileSync(PID_FILE, "utf8")

try {
    process.kill(pid)
    fs.unlinkSync(PID_FILE)
    console.log("LiveKit stopped.")
} catch (err) {
    console.error("Failed to stop LiveKit:", err)
}