import { NextResponse } from "next/server";
import { createHash } from "node:crypto";

// Secret-signed Cloudinary upload flow:
// 1. Client calls this endpoint to get signing params.
// 2. Client uploads the file directly to Cloudinary with those params.
// The API secret never leaves the server.
export async function GET() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Cloudinary is not configured on the server." },
      { status: 500 }
    );
  }

  const folder = "chatmat";
  const timestamp = String(Math.floor(Date.now() / 1000));
  // Params sent to Cloudinary other than file/cloud_name/resource_type/api_key
  // are signed, sorted, joined with '&', then SHA1'd with the API secret.
  const toSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = createHash("sha1").update(toSign).digest("hex");

  return NextResponse.json({
    cloudName,
    apiKey,
    timestamp,
    signature,
    folder,
  });
}