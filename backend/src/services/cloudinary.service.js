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


// Upload Audio  File to Cloudinary
export const uploadAudio = async (filePath, userId) => {
    const result = await cloudinary.uploader.upload(filePath, {
        resource_type: "video", 
        folder: "audio_uploads",
        public_id: `audio_${userId}_${Date.now()}`, 
        overwrite: false
    })

    return {
        url: result.secure_url,
        publicId: result.public_id,
        duration: result.duration, 
        format: result.format
    }
}


// Delete Audio / Music File from Cloudinary
export const deleteAudio = async (publicId) => {
    await cloudinary.uploader.destroy(publicId, {
        resource_type: "video" 
    })
}


// Upload Video File to Cloudinary
export const uploadVideo = async (filePath, userId) => {
    const result = await cloudinary.uploader.upload(filePath, {
        resource_type: "video",
        folder: "video_uploads",
        public_id: `video_${userId}_${Date.now()}`,
        overwrite: false,
        transformation: [
            { quality: "auto" },
            { fetch_format: "auto" }
        ]
    })

    return {
        url: result.secure_url,
        publicId: result.public_id,
        duration: result.duration,
        format: result.format,
        width: result.width,
        height: result.height
    }
}

// Delete Video File from Cloudinary
export const deleteVideo = async (publicId) => {
    await cloudinary.uploader.destroy(publicId, {
        resource_type: "video"
    })
}