"use server";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "content-engine-ai-docs-832666711966";

export async function getPresignedUrlAction(filename: string, contentType: string) {
  try {
    if (!process.env.AWS_ACCESS_KEY_ID) {
      throw new Error("AWS credentials not configured");
    }

    // Usar uuid para evitar colisiones de archivos
    const cleanFilename = filename.replace(/[^a-zA-Z0-9.\-_]/g, "");
    const key = `knowledge-base/${uuidv4()}-${cleanFilename}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    // Crear la URL prefirmada (válida por 5 minutos)
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    return { 
      success: true, 
      url: presignedUrl, 
      key: key,
      // La URL final en S3 (antes de ser privada/expirar si fuera GET, pero aquí guardamos la referencia)
      s3Path: `s3://${BUCKET_NAME}/${key}`
    };
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return { success: false, error: "No se pudo generar el acceso a S3" };
  }
}
