interface UploadURLResponse {
    message: string;
    data: {
        avatar:{
            upload_url: string;
            key: string;
        },
        outfit:{
            upload_url: string;
            key: string;
        }
    }
}


interface ConfirmUploadResponse {
    message: string;
    data: {
        avatar_url: string;
        outfit_url: string;
        job_id: string;
    }
}

interface JobStatusResponse {
    message: string;
    data: {
        job_id: string;
        status: "pending" | "processing" | "completed" | "failed";
        result_url?: string;
    }
    detail?: string;

}