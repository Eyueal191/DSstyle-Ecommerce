import User from "../models/user.js";
import {
    hashPassword,
    comparePassword
} from "../utility/bcrypt.js";
import sendEmail from "../config/resend.js";
import {
    generateAccessToken,
    generateRefreshToken
} from "../utility/generateToken.js";
import otpTemplate from "../utility/otpTemplate.js";
import dotenv from "dotenv"
import jwt from "jsonwebtoken";
dotenv.config()// to make enviromental variable to be accessible.
// 1. Sign Up Controller
const signUpController = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        message: "Email has already registered",
        error: true,
        success: false,
      });
    }

    // Hash password and create new user
    const hashedPassword = await hashPassword(password);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    if (email === process.env.ADMIN_EMAIL) {
      newUser.role = "ADMIN";
    }

    // Save new user first to get ID
    const savedUser = await newUser.save();
    const userId = savedUser._id;

    // Generate tokens
    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);

    // Generate OTP and expiry
    const verifyEmailOTP = Math.floor(Math.random() * 9000 + 1000);
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Save OTP and tokens in DB first (like Forgot Password)
    await User.findByIdAndUpdate(userId, {
      accessToken,
      refreshToken,
      verifyEmailOTP,
      verifyEmailOTPExpiry: otpExpiry,
    });

    // Send OTP email
    try {
      await sendEmail({
        to: email,
        subject: "Verify Your Email",
        html: otpTemplate(verifyEmailOTP),
      });
      console.log("OTP sent to email:", email);
    } catch (err) {
      console.error("Failed to send OTP email:", err);
      return res.status(500).json({
        message: "Failed to send OTP email",
        error: true,
        success: false,
      });
    }

    // Respond success
    res.status(201).json({
      message: "Registered successfully, OTP sent to email",
      error: false,
      success: true,
      email,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

// 2. Log In Controller
const logInController = async (req, res) => {
  try {
    const { email, password, phone } = req.body;
    const identifier = (phone || email || "").trim();

    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { phone: identifier },
      ],
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found with this email or phone",
        error: true,
        success: false,
      });
    }
    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({
        message: "Incorrect Password",
        error: true,
        success: false,
      });
    }

    // ✅ Generate fresh tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Optionally store refreshToken in DB (so you can revoke later)
    user.refreshToken = refreshToken;
    await user.save();
    const cookieOptions = {
      httpOnly: true,
      secure: true, // true if HTTPS
      sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };
    // ✅ Set the refresh token cookie
    res.cookie("refreshToken", refreshToken, cookieOptions);
    // ✅ Return fresh access token to frontend
    res.status(200).json({
      message: "Logged in successfully",
      error: false,
      success: true,
      accessToken,
      userId: user._id.toString(),
      userEmail: user.email,
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({
      message: error.message || "Internal Server Error",
    });
  }
};
const verifyEmailOTPController = async (req, res) => {
    console.log("Request received for OTP verification");

    try {
        const {
            email,
            otp
        } = req.body || {};
        if (!email || !otp) {
            return res.status(400).json({
                message: "Email and OTP are required"
            });
        }
        console.log("Received email:", email);
        console.log("Received OTP:", otp);

        const user = await User.findOne({
            email
        });
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                error: true,
                success: false,
            });
        }

        // Check if OTP matches
        if (Number(user.verifyEmailOTP) !== Number(otp)) {
            return res.status(400).json({
                message: "Invalid OTP",
                error: true,
                success: false,
            });
        }

        // Check if OTP is expired
        if (user.verifyEmailOTPExpiry && user.verifyEmailOTPExpiry < Date.now()) {
            return res.status(400).json({
                message: "OTP expired",
                error: true,
                success: false,
            });
        }

        // Mark email as verified
        user.verified = true;
        user.verifyEmailOTP = undefined; // clear OTP
        user.verifyEmailOTPExpiry = undefined;
        await user.save();

        return res.status(200).json({
            message: "Email verified successfully",
            error: false,
            success: true,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message || "Internal Server Error",
            error: true,
            success: false,
        });
    }
};
// 4. Verify Password OTP
const verifyPasswordOTPController = async (req, res) => {
    try {
        let { email, otp } = req.body;
         console.log("Email", email);
         console.log("OTP", otp);
        if (!email || !otp) {
            return res.status(400).json({
                message: "Email and OTP are required",
                error: true,
                success: false
            });
        }

        otp = Number(otp);
        if (isNaN(otp)) {
            return res.status(400).json({
                message: "Invalid OTP format",
                error: true,
                success: false
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                error: true,
                success: false
            });
        }

        if (!user.verifyPasswordOTP || !user.verifyPasswordOTPExpiry || user.verifyPasswordOTPExpiry < new Date()) {
            return res.status(400).json({
                message: "OTP expired or invalid",
                error: true,
                success: false
            });
        };
        if (user.verifyPasswordOTP !== Number(otp)) {
            return res.status(400).json({
                message: "Invalid verification code",
                error: true,
                success: false
            });
        }

        // OTP verified successfully — clear OTP
        user.verifyPasswordOTP = undefined;
        user.verifyPasswordOTPExpiry = undefined;
        await user.save();

        return res.status(200).json({
            message: "Verified successfully",
            error: false,
            success: true
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || "Internal Server Error"
        });
    }
};
// 5. Forgot Password
const forgotPasswordController = async (req, res) => {
    try {
        const {
            email
        } = req.body;
        const user = await User.findOne({
            email
        });

        if (!user) {
            return res.status(404).json({
                message: "Unregistered",
                error: true,
                success: false
            });
        }
        const otp = Math.floor(Math.random() * 9000 + 1000);
        const otpExpiry = Date.now() + 10 * 60 * 1000;

        user.verifyPasswordOTP = otp;
        user.verifyPasswordOTPExpiry = otpExpiry;
        await user.save();

        await sendEmail({
            to: email,
            subject: "Password Reset Code",
            html: otpTemplate(otp)
        });

        res.status(200).json({
            message: "Password reset code sent to your email",
            error: false,
            success: true,
            code:otp
        });
    } catch (error) {
        res.status(500).json({
            message: error.message || "Internal Server Error"
        });
    }
};
// 6. RefreshAccessTokenController 
const refreshAccessTokenController = async (req, res) => {
  try {
    const { refreshToken } = req.cookies; // refresh token stored in httpOnly cookie

    // No refresh token present
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "No refresh token provided.",
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.SECRET_KEY_REFRESH_TOKEN);

    // Find the user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);

    // Update user tokens in DB
    user.accessToken = newAccessToken;
    user.refreshToken = newRefreshToken;
    await user.save();

    // Define cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: true, // true if HTTPS
      sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    // Set new refresh token cookie
    res.cookie("refreshToken", newRefreshToken, cookieOptions);

    // Send response
    return res.status(200).json({
      success: true,
      message: "Access token has been refreshed successfully",
      error: false,
      accessToken: newAccessToken,
    });

  } catch (error) {
    console.error("Refresh token error:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Refresh token expired. Please log in again.",
      });
    }

    return res.status(403).json({
      success: false,
      message: "Invalid or expired refresh token.",
      error: error.message,
    });
  }
};
// 7. Reset Password
const resetPasswordController = async (req, res) => {
    try {
        const {email,
            password
        } = req.body;
        let user = await User.findOne({email:email});
        if (!user) {
            return res.status(404).json({
                message: "Unregisted user",
                error: true,
                success: false
            });
        }
        user.password = await hashPassword(password);
        await user.save();
        res.status(200).json({
            message: "Password has been reset successfully",
            error: false,
            success: true
        });
    } catch (error) {
        res.status(500).json({
            message: error.message || "Internal Server Error"
        });
    }
};
// 8. Resend Password OTP
const resendPasswordOtpController = async (req, res) => {
    try {
        const {
            email
        } = req.body;
        const user = await User.findOne({
            email
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                error: true,
                success: false
            });
        }

        const otp = Math.floor(Math.random() * 9000 + 1000);
        const otpExpiry = Date.now() + 10 * 60 * 1000;

        user.verifyPasswordOTP = otp;
        user.verifyPasswordOTPExpiry = otpExpiry;
        await user.save();

        await sendEmail({
            to: email,
            subject: "Password Reset Code",
            html: otpTemplate(otp)
        });

        res.status(200).json({
            message: "Password reset code sent to your email",
            error: false,
            success: true
        });
    } catch (error) {
        res.status(500).json({
            message: error.message || "Internal Server Error"
        });
    }
};
// 9. Resend Verify Email OTP
const resendVerifyEmailOtpController = async (req, res) => {
    try {
        const {
            email
        } = req.body;
        const user = await User.findOne({
            email
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                error: true,
                success: false
            });
        }

        const otp = Math.floor(Math.random() * 9000 + 1000);
        const otpExpiry = Date.now() + 10 * 60 * 1000;

        user.verifyEmailOTP = otp;
        user.verifyEmailOTPExpiry = otpExpiry;
        await user.save();

        await sendEmail({
            to: email,
            subject: "Verify Email Code",
            html: otpTemplate(otp)
        });

        res.status(200).json({
            message: "Verify email code sent to your email",
            error: false,
            success: true
        });
    } catch (error) {
        res.status(500).json({
            message: error.message || "Internal Server Error"
        });
    }
};
// 10. Logout Controller
const logOutController = async (req, res) => {
    try {
        const {
            email
        } = req.body;
        const user = await User.findOne({
            email
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                error: true,
                success: false
            });
        }

        user.accessToken = "";
        user.refreshToken = "";
        await user.save();

        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
        });
        res.status(200).json({
            message: "Logged out successfully",
            error: false,
            success: true
        });
    } catch (error) {
        res.status(500).json({
            message: error.message || "Internal Server Error"
        });
    }
};
const getUserByUserId = async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findOne({ _id: userId }).lean();

        if (!user) 
            return res.status.json(404).json({ 
                message: "User not found", 
                success: true, 
                error: false 
            });

        return res.status(200).json({ 
            message: "user data has been retrieved successfully", 
            error: false, 
            success: true, 
            user 
        });
    } catch (error) {
        res.status(500).json({
            message: error.message || "Internal Server Error"
        });
    }
};
const updateUserDataByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    const userUpdate = JSON.parse(req.body.data);

    // Save profile image path if uploaded
    let profileImage;
    if (req.file) {
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const normalizedPath = req.file.path.replace(/\\/g, "/");
      profileImage = `${baseUrl}/${normalizedPath}`;
    }

    // Fetch user
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
        error: true,
      });
    }

    // Merge updates
    Object.assign(user, userUpdate);
    if (profileImage) {
      user.profileImage = profileImage;
    }

    // Save updated user
    const updatedUser = await user.save();

    return res.status(200).json({
      message: "User data has been updated successfully",
      error: false,
      success: true,
      updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Internal Server Error",
      success: false,
      error: true,
    });
  }
};

// 11. Telegram Sync Controller
const telegramSyncController = async (req, res) => {
  try {
    const { telegramId, name, username, phone } = req.body;
    if (!telegramId) {
      return res.status(400).json({ success: false, message: "telegramId is required" });
    }

    // Check if user exists by telegramId
    let user = await User.findOne({ telegramId: String(telegramId) });
    if (!user) {
      // Check admin list from environment
      const adminList = (process.env.ADMIN_TELEGRAM_IDS || "")
        .split(",")
        .map((s) => s.trim().toLowerCase());
      const isAdmin =
        adminList.includes(String(telegramId).toLowerCase()) ||
        (username && adminList.includes(String(username).toLowerCase().replace(/^@/, "")));

      user = await User.create({
        name: name || (username ? `@${username}` : `Customer #${telegramId}`),
        telegramId: String(telegramId),
        telegramUsername: username || "",
        phone: phone || "",
        role: isAdmin ? "Admin" : "User",
        verified: true,
      });
    } else {
      let changed = false;
      if (name && user.name !== name) {
        user.name = name;
        changed = true;
      }
      if (username && user.telegramUsername !== username) {
        user.telegramUsername = username;
        changed = true;
      }
      if (changed) {
        await user.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "Telegram user synced successfully",
      user: {
        _id: user._id,
        name: user.name,
        telegramId: user.telegramId,
        telegramUsername: user.telegramUsername,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to sync telegram user",
    });
  }
};

// Update user theme preference in User model
const updateUserThemeController = async (req, res) => {
  try {
    const { userId } = req.params;
    const { themeMode, primaryColor, accentPalette } = req.body;

    const updateFields = {};
    if (themeMode) updateFields.themeMode = themeMode;
    if (primaryColor) updateFields.primaryColor = primaryColor;
    if (accentPalette) updateFields.accentPalette = accentPalette;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true }
    ).select("-password -accessToken -refreshToken");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      error: false,
      message: "User theme preference saved successfully",
      data: {
        themeMode: user.themeMode,
        primaryColor: user.primaryColor,
        accentPalette: user.accentPalette,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || "Failed to save user theme preference",
    });
  }
};

export {
    updateUserThemeController,
    telegramSyncController,
    updateUserDataByUserId,
    getUserByUserId,
    signUpController,
    logInController,
    verifyEmailOTPController,
    verifyPasswordOTPController,
    forgotPasswordController,
    refreshAccessTokenController,
    resetPasswordController,
    resendPasswordOtpController,
    resendVerifyEmailOtpController,
    logOutController,
};