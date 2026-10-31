import { S3Client } from "@aws-sdk/client-s3";
import { env } from "./env";

export const r2Configured = Boolean(
  env.r2AccountId && env.r2AccessKeyId && env.r2SecretAccessKey && env.r2BucketName && env.r2PublicUrl
);

export const r2Client = r2Configured
  ? new S3Client({
      region: "auto",
      endpoint: `https://${env.r2AccountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.r2AccessKeyId,
        secretAccessKey: env.r2SecretAccessKey
      }
    })
  : null;
