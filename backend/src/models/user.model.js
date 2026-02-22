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
        default: null,
        select: false
    },
    otpExpire: {
        type: Date,
        default: null
    },
    profilePic: {
        type: String,
        default: "",
    },
    profilePicPublicId: {
        type: String,
        default: "",    
    }
}, { timestamps: true }) 


// Hash password before saving
userSchema.pre("save", async function () {

    if (this.isModified("password")) {
        const salt = await bcrypt.genSalt(10)
        this.password = await bcrypt.hash(this.password, salt)
    }

    if (this.isModified("otp") && this.otp !== null) {
        const salt = await bcrypt.genSalt(10)
        this.otp = await bcrypt.hash(this.otp, salt)
    }

})

// Compare entered password with hashed password
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password)
}

// Compare entered OTP with hashed OTP
userSchema.methods.compareOtp = async function (enteredOtp) {
    return await bcrypt.compare(enteredOtp, this.otp)
}

export default mongoose.model("User", userSchema) 
