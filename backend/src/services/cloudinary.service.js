import { v2 as cloudinary } from "cloudinary"
import fs from "fs"
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


// Upload media to Cloudinary
export const uploadMedia = async (file, userId) => {
  const { path: filePath, mimetype, size } = file

  let folder = ""
  let resourceType = "auto"

  if (mimetype.startsWith("image/")) {
    folder = "chat_images"
  } 
  else if (mimetype.startsWith("audio/")) {
    folder = "audio_uploads"
    resourceType = "video" 
  } 
  else if (mimetype.startsWith("video/")) {
    folder = "video_uploads"
    resourceType = "video"
  } 
  else {
    throw new Error("Unsupported media type")
  }
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: resourceType,
    public_id: `${folder}_${userId}_${Date.now()}`,
    overwrite: false,
    transformation: [
      { quality: "auto" },
      { fetch_format: "auto" }
    ]
  })

  // Remove temp file after upload
  fs.unlinkSync(filePath)
  return {
    url: result.secure_url,
    publicId: result.public_id,
    format: result.format,
    size,
    duration: result.duration || null,
    width: result.width || null,
    height: result.height || null
  }
}

// Delete media from Cloudinary
export const deleteMedia = async (publicId, resourceType = "auto") => {
  await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType
  })
}
