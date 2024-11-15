// controllers/authController.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "./../../../DB/models/user/User.model.js";
import randomstring from "randomstring";
import tokenModel from "../../../DB/models/token/Token.model.js";
import sendEmailService from "../utils/sendEmails.js";

export const registerUser = async (req, res, next) => {
  const { name, email, mobile, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({
      name,
      email,
      mobile,
      password: hashedPassword
  });

  await newUser.save();

  res.status(201).json({ message: 'User registered successfully' });
};

export const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  const isUser = await User.findOne({ email });
  if (!isUser) {
    return next(new Error("invalid email or password"));
  }
  const comparePassword = bcrypt.compareSync(password, isUser.password);
  if (!comparePassword) {
    return next(new Error("invalid email or password"));
  }

  const payload = {
    role: isUser.role,
  };
  const token = jwt.sign(
    { email, id: isUser._id },
    process.env.JWT_SECRET
    /* , {
      expiresIn: "1d",
    } */
  );
  await tokenModel.create({ token, user: isUser._id });
  isUser.isDeleted = false;
  await isUser.save();
  return res.json({
    success: true,
    message: "you logged in successfully",
    token,
    payload,
  });
};


export const logout = async (req, res, next) => {
  const { token } = req.headers;

  // Check if the token is provided
  if (!token) {
    return res.status(400).json({ message: "Token is required." });
  }

  try {
    // Find the token and check if it's valid
    const tokenRecord = await tokenModel.findOne({ token });

    // If no token is found
    if (!tokenRecord) {
      return res.status(404).json({ message: "Token not found." });
    }

    // If the token is already invalid, return an appropriate message
    if (!tokenRecord.isValid) {
      return res.status(400).json({ message: "User is already logged out." });
    }

    // Mark the token as invalid
    const updatedToken = await tokenModel.findOneAndUpdate(
      { token, isValid: true },
      { isValid: false },
      { new: true }
    );

    return res.status(200).json({ message: "Logged out successfully." });
  } catch (error) {
    console.error("Error during logout:", error);
    return res
      .status(500)
      .json({ message: "An error occurred during logout." });
  }
};

export const sendForgetCode = async (req, res, next) => {
  //check user

  const user = await User.findOne({ email: req.body.email });
  if (!user) return next(new Error("user not found"));
  //generate code

  const code = randomstring.generate({ length: 5, charset: "numeric" });

  // save code in databse
  user.forgetCode = code;
  await user.save();

  // send email
  const msgSent = await sendEmailService({
    to: user.email,
    subject: "Reset Password(No Reply)",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code Display Email</title>
    <style>
        /* Basic reset */
        body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            background-color: #121212; /* Dark background */
            color: #e0e0e0; /* Light text color for contrast */
        }
        .email-wrapper {
            width: 100%;
            table-layout: fixed;
            background-color: #121212; /* Dark background */
            padding: 20px;
        }
        .email-container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background: #1e1e1e; /* Slightly lighter dark background */
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.5);
        }
        .header {
            background-color: #333; /* Dark grey background for the header */
            color: #fff; /* White text for header */
            text-align: center;
            padding: 15px;
            font-size: 1.25rem;
            font-weight: bold;
            border-radius: 8px 8px 0 0;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 10px; /* Space between logo and text */
        }
        .header img {
            height: 40px; /* Adjust the size of the logo */
            width: auto;
            vertical-align: middle;
        }
        .content {
            padding: 20px;
            text-align: center;
        }
        .code-header {
            font-size: 1.5rem;
            font-weight: bold;
            color: #e0e0e0; /* Light text color */
            background-color: #343a40; /* Dark background for header */
            border: 1px solid #495057; /* Light border */
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 20px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
            text-transform: uppercase; /* Uppercase text for emphasis */
        }
        .code-box {
            background-color: #2c2c2c; /* Dark grey background for code box */
            border: 1px solid #444; /* Slightly lighter border */
            border-radius: 8px;
            padding: 15px;
            font-size: 1.125rem;
            color: #e0e0e0; /* Light text color */
            font-weight: bold;
            display: inline-block;
            word-break: break-word;
            max-width: 100%;
            box-sizing: border-box;
        }
        .footer {
            background-color: #121212; /* Same dark background as body */
            padding: 15px;
            text-align: center;
        }
        .social-icons img {
            width: 24px;
            height: 24px;
            margin: 0 10px;
            vertical-align: middle;
        }
        @media (max-width: 600px) {
            .header {
                font-size: 1rem;
                padding: 10px;
            }
            .code-header {
                font-size: 1.25rem;
                padding: 10px;
            }
            .code-box {
                font-size: 1rem;
                padding: 10px;
            }
            .social-icons img {
                width: 20px;
                height: 20px;
                margin: 0 8px;
            }
        }
    </style>
</head>
<body>
    <table class="email-wrapper">
        <tr>
            <td>
                <table class="email-container">
                  
                    <tr>
                        <td class="content">
                            <div class="code-header">
                                Your Code
                            </div>
                            <div class="code-box">
                                <span id="code">${code}</span>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>

`,
  });

  if (!msgSent) {
    return res.status(500).json({
      success: false,
      message: "Failed to send email",
    });
  }

  return res.status(200).json({
    success: true,
    message: "You can reset your password now",
  });
};
export const resetPassword = async (req, res, next) => {
  //check user
  const user = await User.findOne({ email: req.body.email });
  if (!user) return next(new Error("user not found"));

  //check code
  if (user.forgetCode !== req.body.code)
    return next(new Error("Code is invalid"));

  //delete forget code
  await User.findOneAndUpdate(
    { email: req.body.email },
    { $unset: { forgetCode: 1 } }
  );

  user.password = bcrypt.hashSync(req.body.password, 6);

  await user.save();

  const tokens = await tokenModel.find({ user: user._id });

  tokens.forEach(async (token) => {
    token.isValid = false;
    await token.save();
  });

  return res.json({ success: true, message: "Try to login now" });
};
