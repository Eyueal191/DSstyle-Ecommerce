import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: false,
        unique: false,
        lowercase: true,
        trim: true,
    },
    bio:{
          type: String
    },
    password: {
        type: String,
        required: false,
    },
    role:{
        type:String,
        enum:["Admin","Seller","User"],
        default:"User"
    },
    telegramId: {
        type: String,
        unique: true,
        sparse: true,
        index: true,
    },
    telegramUsername: {
        type: String,
        sparse: true,
    },
    verified: {
        type: Boolean,
        default: false,
    },
    verifyEmailOTP: {
        type: Number,
    },
    verifyEmailOTPExpiry: {
        type: Date,
    },
    verifyPasswordOTP: {
        type: Number,
    },
    verifyPasswordOTPExpiry: {
        type: Date,
    },
    accessToken: {
        type: String,
    },
    refreshToken: {
        type: String,
    },
    profileImage: {
        type: String,
        default: "", // optional
    },
    phone: {
        type: String,
        default: "",
        index: true,
    },
    orders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Orders", // reference to Orders collection
    }, ],
    cart: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cart", // reference to Cart collection
    },
    // User Personal Theme & Brand Preference
    themeMode: {
        type: String,
        enum: ["light", "dark", "system"],
    },
    primaryColor: {
        type: String,
    },
    accentPalette: {
        type: String,
    },
}, {
    timestamps: true, // adds createdAt & updatedAt automatically
});

const User = mongoose.model("User", userSchema);

export default User;