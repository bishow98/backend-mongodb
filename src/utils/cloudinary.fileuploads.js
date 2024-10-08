import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
});
//
// upload file in cloudinary
const uploadInCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    //upload the file in cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // file has been uploaded
    console.log("file has been uploaded ", response.url);
    console.log(`Height: ${response.height} width: ${response.width}`);
    console.log(`Format: ${response.format} and displayname: ${response.original_filename}`);
    console.log(response);
    fs.unlinkSync(localFilePath); // file lai local path bata unlink matlab delete gardinxa aba file upload garda 

    return response;
  } catch (error) {
    //remove the locally saved temporary file as the upload operation got failed
    fs.unlinkSync(localFilePath);
    return null;
  }
};

export { uploadInCloudinary };
