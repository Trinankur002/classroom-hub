import * as path from "path";
import * as fs from "fs";
import { Storage } from "@google-cloud/storage";

let gcsStorage: Storage;

export function getBucket() {
    const projectId = process.env.GCP_PROJECT_ID;
    const bucketName = process.env.GCP_BUCKET_NAME;
    const keyFile = process.env.GCP_KEY_FILE;

    if (!projectId) throw new Error("❌ GCP_PROJECT_ID missing");
    if (!bucketName) throw new Error("❌ GCP_BUCKET_NAME missing");
    if (!keyFile) throw new Error("❌ GCP_KEY_FILE missing");

    const absPath = path.resolve(keyFile);
    if (!fs.existsSync(absPath)) {
        throw new Error(`❌ GCP key file not found at ${absPath}`);
    }
    if (!gcsStorage) {
        gcsStorage = new Storage({
            keyFilename: absPath,
            projectId,
        });
    }

    return gcsStorage.bucket(bucketName);
}
