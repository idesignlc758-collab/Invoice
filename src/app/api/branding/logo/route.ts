import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";

export const runtime = "nodejs";

const MAX_LOGO_BYTES = 20 * 1024 * 1024;
const ALLOWED_TYPES = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const form = await request.formData();
  const file = form.get("logo");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose a logo file to upload." }, { status: 400 });
  }

  if (file.size > MAX_LOGO_BYTES) {
    return NextResponse.json({ error: "Logo must be 20 MB or smaller." }, { status: 400 });
  }

  const extension = ALLOWED_TYPES.get(file.type);
  if (!extension) {
    return NextResponse.json(
      { error: "Upload a PNG, JPG, WebP, or GIF logo." },
      { status: 400 }
    );
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "branding");
  await mkdir(uploadDir, { recursive: true });

  const safeUserId = user.id.replace(/[^a-zA-Z0-9_-]/g, "");
  const filename = `${safeUserId}-${Date.now()}.${extension}`;
  const diskPath = path.join(uploadDir, filename);
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(diskPath, bytes);

  return NextResponse.json({ logoUrl: `/uploads/branding/${filename}` });
}
