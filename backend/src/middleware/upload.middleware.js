import multer from "multer"
import path from "path"
import fs from "fs"

// Ensure uploads folder exists
const uploadPath = "uploads/"
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath)
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  }
})

// Allowed mime types
const allowedMimeTypes = [
  /^image\//,
  /^audio\//,
  /^video\//
]

// Dynamic file filter
const fileFilter = (req, file, cb) => {
  const isAllowed = allowedMimeTypes.some(type => type.test(file.mimetype))

  if (!isAllowed) {
    return cb(new Error("Only image, audio, and video files are allowed"), false)
  }

  cb(null, true)
}

// Dynamic size control middleware
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // Hard cap 50MB (video max)
  }
})

export const mediaUpload = upload.single("file")