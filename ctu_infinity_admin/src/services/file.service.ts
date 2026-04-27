import privateAxios from "@/lib/axios/privateAxios";
import { IBackendRes } from "@/types/backend.type";

const uploadFileService = {
    uploadFile: (
        data: FormData
    ): Promise<IBackendRes<{ url: string; createdAt: string }>> => {
        return privateAxios.post("/file/upload", data);
    },
};

export default uploadFileService;