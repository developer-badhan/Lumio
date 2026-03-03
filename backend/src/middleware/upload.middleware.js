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
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  }
})

// Image only — for profile routes
const imageOnlyFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) return cb(null, true)
  cb(new Error("Only image files are allowed"), false)
}

// All media — for chat routes
const allMediaFilter = (req, file, cb) => {
  const allowed = [/^image\//, /^audio\//, /^video\//]
  const isAllowed = allowed.some(type => type.test(file.mimetype))
  if (!isAllowed) return cb(new Error("Only image, audio, and video files are allowed"), false)
  cb(null, true)
}

// Wraps any multer upload fn — handles MulterError and unknown errors uniformly
const withErrorHandling = (uploadFn) => (req, res, next) => {
  uploadFn(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: err.message })
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message })
    }
    next()
  })
}

// Profile upload instance — image only, 5MB cap, strict field name
const profileUploader = multer({
  storage,
  fileFilter: imageOnlyFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
})

// Chat upload instance — all media, 50MB cap, any field name
const chatUploader = multer({
  storage,
  fileFilter: allMediaFilter,
  limits: { fileSize: 50 * 1024 * 1024 }
})

// For: POST /register, PATCH /change-profile-pic
// Field name must be "profilePic"
export const profileMediaUpload = withErrorHandling(
  profileUploader.single("profilePic")
)

// For: POST /message
// Accepts any field name (file, audio, video, image — whatever client sends)
// Normalizes to req.file for controller
export const chatMediaUpload = withErrorHandling(
  (req, res, next) => {
    chatUploader.any()(req, res, (err) => {
      if (err) return next(err)
      if (req.files && req.files.length > 0) {
        req.file = req.files[0]  // normalize — controller reads req.file
      }
      next()
    })
  }
)