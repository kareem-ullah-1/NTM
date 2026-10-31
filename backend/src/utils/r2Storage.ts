import { randomUUID } from "crypto";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "../config/env";
import { r2Client, r2Configured } from "../config/r2";
import { ApiError } from "./ApiError";

const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_VIDEO_MIME_TYPES = new Set(["video/mp4", "video/webm"]);
const ALLOWED_MEDIA_MIME_TYPES = new Set([...ALLOWED_IMAGE_MIME_TYPES, ...ALLOWED_VIDEO_MIME_TYPES]);
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024;

const MAGIC_BYTES: Record<string, number[][][]> = {
  "image/jpeg": [[[0, 0xff, 0xd8, 0xff]]],
  "image/png": [[[0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]]],
  "image/webp": [[[0, 0x52, 0x49, 0x46, 0x46], [8, 0x57, 0x45, 0x42, 0x50]]],
  "video/mp4": [[[0, 0x00, 0x00, 0x00], [4, 0x66, 0x74, 0x79, 0x70]]],
  "video/webm": [[[0, 0x1a, 0x45, 0xdf, 0xa3]]],
};

function matchesMagicBytes(buffer: Buffer, mimetype: string): boolean {
  const signatures = MAGIC_BYTES[mimetype];
  if (!signatures) return false;

  return signatures.some((segments) =>
    segments.every(([offset, ...bytes]) => {
      if (buffer.length < offset + bytes.length) return false;
      return bytes.every((byte, i) => buffer[offset + i] === byte);
    })
  );
}

export function assertValidImageFile(file: { mimetype: string; size: number; buffer?: Buffer }): void {
  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
    throw ApiError.badRequest("Only JPEG, PNG, or WEBP images are allowed.");
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw ApiError.badRequest("Image must be smaller than 5MB.");
  }

  if (file.buffer && !matchesMagicBytes(file.buffer, file.mimetype)) {
    throw ApiError.badRequest("File content does not match the claimed image type.");
  }
}

export function assertValidMediaFile(file: { mimetype: string; size: number; buffer?: Buffer }): void {
  if (!ALLOWED_MEDIA_MIME_TYPES.has(file.mimetype)) {
    throw ApiError.badRequest("Only JPEG, PNG, WEBP images or MP4, WebM videos are allowed.");
  }
  const isVideo = ALLOWED_VIDEO_MIME_TYPES.has(file.mimetype);
  const maxSize = isVideo ? MAX_VIDEO_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;
  if (file.size > maxSize) {
    throw ApiError.badRequest(isVideo ? "Video must be smaller than 50MB." : "Image must be smaller than 5MB.");
  }
  if (file.buffer && !matchesMagicBytes(file.buffer, file.mimetype)) {
    throw ApiError.badRequest("File content does not match the claimed media type.");
  }
}

function extensionFromMime(mimetype: string): string {
  switch (mimetype) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "video/mp4":
      return "mp4";
    case "video/webm":
      return "webm";
    default:
      return "bin";
  }
}

export async function uploadImageToR2(file: {
  buffer: Buffer;
  mimetype: string;
  size: number;
}, folder?: string): Promise<{ url: string; key: string }> {
  if (!r2Configured || !r2Client) {
    throw ApiError.internal(
      "Image uploads are not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and R2_PUBLIC_URL."
    );
  }

  assertValidImageFile(file);

  const key = `${folder ?? env.r2UploadFolder}/${randomUUID()}.${extensionFromMime(file.mimetype)}`;

  await r2Client.send(
    new PutObjectCommand({
      Bucket: env.r2BucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      CacheControl: "public, max-age=31536000, immutable"
    })
  );

  return { url: `${env.r2PublicUrl}/${key}`, key };
}

export async function uploadMediaToR2(file: {
  buffer: Buffer;
  mimetype: string;
  size: number;
}, folder?: string): Promise<{ url: string; key: string }> {
  if (!r2Configured || !r2Client) {
    throw ApiError.internal(
      "Media uploads are not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and R2_PUBLIC_URL."
    );
  }

  assertValidMediaFile(file);

  const isVideo = ALLOWED_VIDEO_MIME_TYPES.has(file.mimetype);
  const key = `${folder ?? (isVideo ? "ntm-fabrics/promotions/video" : "ntm-fabrics/promotions")}/${randomUUID()}.${extensionFromMime(file.mimetype)}`;

  const cacheControl = isVideo ? "public, max-age=31536000" : "public, max-age=31536000, immutable";

  await r2Client.send(
    new PutObjectCommand({
      Bucket: env.r2BucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      CacheControl: cacheControl
    })
  );

  return { url: `${env.r2PublicUrl}/${key}`, key };
}

export async function deleteImageFromR2(url: string): Promise<void> {
  if (!r2Configured || !r2Client) return;
  if (!url.startsWith(env.r2PublicUrl)) return;

  const key = url.slice(env.r2PublicUrl.length + 1);
  if (!key) return;

  try {
    await r2Client.send(new DeleteObjectCommand({ Bucket: env.r2BucketName, Key: key }));
  } catch {
  }
}
