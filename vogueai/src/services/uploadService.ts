import { protectedApi } from "../lib/axios";

// Types
export interface UploadURLResponse {
  message: string;
  data: {
    avatar: {
      upload_url: string;
      key: string;
    };
    outfit: {
      upload_url: string;
      key: string;
    };
  };
}

export interface ConfirmUploadResponse {
  message: string;
  data: {
    avatar_url: string;
    outfit_url: string;
    job_id: string;
  };
}

export interface JobStatusResponse {
  message: string;
  data: {
    job_id: string;
    status: "pending" | "processing" | "completed" | "failed";
    result_url?: string;
  };
  detail?: string;
}

// Generate pre-signed upload URLs
export const generateUploadURL = async ({
  avatar_filename,
  outfit_filename,
}: {
  avatar_filename: string;
  outfit_filename: string;
}): Promise<UploadURLResponse> => {
  const result = await protectedApi.post("/upload/generate-upload-urls", {
    avatar_filename,
    outfit_filename,
  });
  return result.data;
};

// Upload file directly to S3
export const uploadToS3 = async ({
  upload_url,
  file,
}: {
  upload_url: string;
  file: File;
}) => {
  const res = await fetch(upload_url, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to upload file to S3");
  }
  return res;
};

// Confirm upload and start processing
export const confirmUpload = async ({
  avatar_key,
  outfit_key,
}: {
  avatar_key: string;
  outfit_key: string;
}): Promise<ConfirmUploadResponse> => {
  const formData = new FormData();
  formData.append("avatar_key", avatar_key);
  formData.append("outfit_key", outfit_key);
  const result = await protectedApi.post("/upload/confirm-upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return result.data;
};

// Get job processing status
export const getJobStatus = async (job_id: string): Promise<JobStatusResponse> => {
  const result = await protectedApi.get(`/upload/job/${job_id}`);
  return result.data;
};

// Poll job status until completion
export const pollJobStatus = async (
  jobId: string,
  onProgress?: (status: string) => void
): Promise<string | null> => {
  let loading = true;
  while (loading) {
    const res = await getJobStatus(jobId);
    const { data } = res;

    onProgress?.(data.status);

    if (data.status === "completed") {
      loading = false;
      return data.result_url || null;
    } else if (data.status === "failed") {
      loading = false;
      throw new Error("Job failed, please try again.");
    } else {
      await new Promise((r) => setTimeout(r, 3000)); // wait 3s
    }
  }
  return null;
};
