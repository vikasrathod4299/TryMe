import axiosClient from "@/lib/axios-client"

export const generateUploadURL = async({avatar_filename, outfit_filename}:{avatar_filename: string, outfit_filename: string}):Promise<UploadURLResponse> => {
    const result = await axiosClient.post("/upload/generate-upload-urls", {
        avatar_filename,
        outfit_filename
    });
    return result.data;
}

export const uploadToS3 = async({upload_url, file}:{upload_url: string, file: File}) => {
    const res = await fetch(upload_url, {
        method: "PUT",
        body: file,
        headers: {
            "Content-Type": file.type
        }
    });

    if (!res.ok) {
        throw new Error("Failed to upload file to S3");
    }
    return res;
}

export const confirmUpload = async({avatar_key, outfit_key}:{avatar_key: string, outfit_key: string}): Promise<ConfirmUploadResponse> => {
    const formData = new FormData();
    formData.append("avatar_key", avatar_key);
    formData.append("outfit_key", outfit_key);
    const result = await axiosClient.post("/upload/confirm-upload", formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    });
    return result.data;
}       