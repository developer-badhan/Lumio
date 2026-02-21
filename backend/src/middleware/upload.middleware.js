import multer from "multer"
import path from "path"

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB

// Sanitize the  storage 
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/") // temp folder, create this at root
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`
        cb(null, uniqueName)
    }
})

// Filter the image
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/
    const isValidExt = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const isValidMime = allowedTypes.test(file.mimetype)

    if (isValidExt && isValidMime) {
        cb(null, true)
    } else {
        cb(new Error("Only jpeg, jpg, png, and webp images are allowed"), false)
    }
}

export const upload = multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter
})