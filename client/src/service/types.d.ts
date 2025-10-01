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
    }
}