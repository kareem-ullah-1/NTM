import {
  httpClient,
  getStoredToken,
  clearAdminAuthAndRedirect,
  ApiRequestError,
  type ApiEnvelope
} from "./client";

export type UploadedImage = { url: string; key: string };

export async function uploadImageToR2(
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  const token = getStoredToken();
  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await httpClient.post<ApiEnvelope<UploadedImage>>("/admin/uploads/image", formData, {

      headers: {
        "Content-Type": undefined,
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      onUploadProgress: (event) => {
        if (!onProgress || !event.total) return;
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });

    if (!response.data?.success) {
      throw new ApiRequestError(response.status, response.data?.message ?? "Image upload failed. Please try again.");
    }

    return response.data.data.url;
  } catch (error) {
    if (error instanceof ApiRequestError) {
      if (error.status === 401) clearAdminAuthAndRedirect();
      throw error;
    }
    if (isAxiosErrorWithResponse(error)) {
      const status = error.response?.status ?? 0;
      if (status === 401) clearAdminAuthAndRedirect();
      const message = error.response?.data?.message;
      throw new ApiRequestError(status, message ?? "Image upload failed. Please try again.");
    }
    throw new ApiRequestError(0, "Image upload failed. Please try again.");
  }
}

export async function uploadMediaToR2(
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  const token = getStoredToken();
  const formData = new FormData();
  formData.append("media", file);

  try {
    const response = await httpClient.post<ApiEnvelope<UploadedImage>>("/admin/uploads/media", formData, {
      headers: {
        "Content-Type": undefined,
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      onUploadProgress: (event) => {
        if (!onProgress || !event.total) return;
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });

    if (!response.data?.success) {
      throw new ApiRequestError(response.status, response.data?.message ?? "Media upload failed. Please try again.");
    }

    return response.data.data.url;
  } catch (error) {
    if (error instanceof ApiRequestError) {
      if (error.status === 401) clearAdminAuthAndRedirect();
      throw error;
    }
    if (isAxiosErrorWithResponse(error)) {
      const status = error.response?.status ?? 0;
      if (status === 401) clearAdminAuthAndRedirect();
      const message = error.response?.data?.message;
      throw new ApiRequestError(status, message ?? "Media upload failed. Please try again.");
    }
    throw new ApiRequestError(0, "Media upload failed. Please try again.");
  }
}

export async function deleteImageFromR2(url: string): Promise<void> {
  const token = getStoredToken();
  try {
    await httpClient.delete("/admin/uploads/image", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      data: { url }
    });
  } catch (err) {

    console.warn("Failed to delete image from R2:", err);
  }
}

function isAxiosErrorWithResponse(
  error: unknown
): error is { response?: { status?: number; data?: { message?: string } } } {
  return typeof error === "object" && error !== null && "response" in error;
}
