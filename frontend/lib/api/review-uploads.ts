import { httpClient, getStoredToken, ApiRequestError, type ApiEnvelope } from "./client";

type UploadedImage = { url: string; key: string };

export async function uploadReviewImage(file: File, onProgress?: (percent: number) => void): Promise<string> {
  const token = getStoredToken();
  const formData = new FormData();
  formData.append("images", file);

  try {
    const response = await httpClient.post<ApiEnvelope<{ images: UploadedImage[] }>>(
      "/reviews/uploads/images",
      formData,
      {

        headers: {
          "Content-Type": undefined,
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        onUploadProgress: (event) => {
          if (!onProgress || !event.total) return;
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      }
    );

    if (!response.data?.success) {
      throw new ApiRequestError(response.status, response.data?.message ?? "Photo upload failed. Please try again.");
    }

    return response.data.data.images[0].url;
  } catch (error) {
    if (error instanceof ApiRequestError) throw error;
    if (isAxiosErrorWithResponse(error)) {
      const message = error.response?.data?.message;
      throw new ApiRequestError(error.response?.status ?? 0, message ?? "Photo upload failed. Please try again.");
    }
    throw new ApiRequestError(0, "Photo upload failed. Please try again.");
  }
}

function isAxiosErrorWithResponse(
  error: unknown
): error is { response?: { status?: number; data?: { message?: string } } } {
  return typeof error === "object" && error !== null && "response" in error;
}
