// src/notification/bullmq.options.ts
import { RedisOptions } from 'bullmq';
import * as dotenv from 'dotenv';
dotenv.config();

const isTls = process.env.REDIS_TLS === 'true';

const connection: RedisOptions = {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    tls: isTls ? {} : undefined,
};

export default connection;

// const connection: RedisOptions = {
//     url: process.env.REDIS_URL,
// };