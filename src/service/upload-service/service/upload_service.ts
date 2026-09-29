import { UploadApiResponse } from "cloudinary";

import  cloudinary  from "../../../config/cloudinary.js";

export default class UploadService {
  static async UploadMediaService(
    file: Express.Multer.File,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream =
        cloudinary.uploader.upload_stream(
          {
            resource_type: "auto",
          },
          (error:any, result:any) => {
            if (error) {
              reject(error);
              return;
            }

            if (!result) {
              reject(
                new Error("Cloudinary upload failed"),
              );
              return;
            }

            resolve(result);
          },
        );

      uploadStream.end(file.buffer);
    });
  }
}