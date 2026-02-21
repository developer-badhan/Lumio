import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required for creating an account"],
        trim: true
    },
    email: {
        type: String,
        required: [true, "Email is required for creating a user"],
        unique: true, 
        trim: true,
        lowercase: true,
        match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Invalid Email address"]
    },
    password: {
        type: String,
        required: [true, "Password is required for creating an account"],
        minlength: [8, "Password should contain at least 8 characters"],
        select: false 
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    otp: {
        type: String,
        default: null
    },
    otpExpire: {
        type: Date,
        default: null
    },
    profilePic: {
        type: String,
        default: "",
    }
}, { timestamps: true }) 


userSchema.pre("save", async function (next) {
    
    if (!this.isModified("password")) {
        return next() 
    }

    try {
        const salt = await bcrypt.genSalt(10) 
        this.password = await bcrypt.hash(this.password, salt) 
        next() 
    } catch (error) {
        next(error) 
    }
}) 

userSchema.methods.comparePassword = async function (enteredPassword) {

    return await bcrypt.compare(enteredPassword, this.password) 
} 

export default mongoose.model("User", userSchema) 
