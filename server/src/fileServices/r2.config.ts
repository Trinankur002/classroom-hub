import { S3Client } from "@aws-sdk/client-s3";
import { FetchHttpHandler } from "@aws-sdk/fetch-http-handler";

export const r2Client = new S3Client({
    region: "us-east-1",
    endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    requestHandler: new FetchHttpHandler(),
    credentials: {
        accessKeyId: String(process.env.CF_ACCESS_KEY_ID),
        secretAccessKey: String(process.env.CF_SECRET_ACCESS_KEY),
    },
});
