export interface CloudinaryUpload {
  url: string;
  resourceType: string;
}

interface SigningParams {
  cloudName: string;
  apiKey: string;
  timestamp: string;
  signature: string;
  folder: string;
}

/**
 * Uploads a file (image, video, or any other type) to Cloudinary using a
 * server-signed request (the API secret never reaches the browser). Returns
 * the permanent HTTPS URL.
 */
export async function uploadToCloudinary(
  file: File,
  onProgress?: (percent: number) => void
): Promise<CloudinaryUpload> {
  const signRes = await fetch("/api/cloudinary/sign");
  if (!signRes.ok) {
    throw new Error(
      "Cloudinary is not configured. Check server environment variables."
    );
  }
  const params = (await signRes.json()) as SigningParams;

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", params.apiKey);
  form.append("timestamp", params.timestamp);
  form.append("signature", params.signature);
  form.append("folder", params.folder);
  form.append("resource_type", "auto");

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${params.cloudName}/auto/upload`
    );
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress?.(
          Math.round((event.loaded / event.total) * 100)
        );
      }
    };
    xhr.onload = () => {
      try {
        const result = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && result.secure_url) {
          resolve({
            url: result.secure_url,
            resourceType: result.resource_type,
          });
        } else {
          reject(new Error(result.error?.message || "Cloudinary upload failed."));
        }
      } catch {
        reject(new Error("Cloudinary upload failed."));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.send(form);
  });
}