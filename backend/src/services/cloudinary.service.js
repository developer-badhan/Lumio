import { v2 as cloudinary } from "cloudinary"
import dotenv from "dotenv"
dotenv.config()


// Configure cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})


// Upload profile image to Cloudinary
export const uploadProfileImg = async (filePath, userId) => {
    const result = await cloudinary.uploader.upload(filePath, {
        folder: "profile_pictures",
        public_id: `user_${userId}`,
        overwrite: true,
        transformation: [
            { width: 300, height: 300, crop: "fill", gravity: "face" },
            { quality: "auto", fetch_format: "auto" }
        ]
    })

    return {
        url: result.secure_url,
        publicId: result.public_id
    }
}


// Delete profile image from Cloudinary
export const deleteProfileImg = async (publicId) => {

    await cloudinary.uploader.destroy(publicId)

}