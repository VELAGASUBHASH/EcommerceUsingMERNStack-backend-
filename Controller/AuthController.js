import Auth from "../Model/AuthModel.js";
import { sendWelcomeMail, sendVerificationMail } from "../utils/SendMail.js";
import jwt, { decode } from 'jsonwebtoken';
import dotenv from 'dotenv';
import {redis} from "../Library/redis.js";


dotenv.config();
// Function to generate 6-digit code
const generate6DigitCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const generateToken = (userId)=>{
    const accestoken = jwt.sign({userId}, process.env.ACCESS_TOKEN,{
        expiresIn: "15m",
    });
    const refreshtoken = jwt.sign({userId}, process.env.REFRESH_TOKEN,{
        expiresIn: "7d",
    }); 
    return {accestoken,refreshtoken}

};
const verificationCode = generate6DigitCode();

const storeRefreshToken = async(userId,refreshtoken)=>{
    await redis.set(`refresh_token:${userId}`,refreshtoken,"EX",7*24*60*60);
}

res.cookie("accessToken", accessToken, {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  maxAge: 15 * 60 * 1000,
});

res.cookie("refreshToken", refreshToken, {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});





export const signup = async (req, res) => {
  const { email, password, name } = req.body;

  try {
    const userexist = await Auth.findOne({ email });

    if (userexist) {
      return res.status(400).json({ message: "User Already Exist" });
    }

    const verificationCode = generate6DigitCode(); 

    const user = await Auth.create({ email, password, name, isVerified: false });


    // Store verification code in Redis for 10 minutes
    await redis.set(`verify_code:${email}`, verificationCode, "EX", 10 * 60);

    // Send verification mail with 6-digit code
    await sendVerificationMail(email, name, verificationCode);

    const { accestoken, refreshtoken } = generateToken(user._id);
    await storeRefreshToken(user._id, refreshtoken);
    setCookie(res, accestoken, refreshtoken);

    res.status(201).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      message: "User Created Successfully. Please check your email for verification code.",
    });
  } catch (error) {
    console.log("Error In Create User", error);
    res.status(500).json({ message: "Unable To SignUp Right Now" });
  }
};

export const verifyEmail = async (req, res) => {
  const { email, code } = req.body;

  try {
    const savedCode = await redis.get(`verify_code:${email}`);
    if (!savedCode || savedCode !== code) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    const user = await Auth.findOneAndUpdate(
      { email },
      { isVerified: true },
      { new: true }
    );

    await redis.del(`verify_code:${email}`);

    // ✅ Send welcome email now
    await sendWelcomeMail(email, user.name);

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    console.log("Error verifying email", error);
    res.status(500).json({ message: "Unable to verify email" });
  }
};


export const login = async (req,res)=>{
    try {
      const {email,password} = req.body
      const user = await Auth.findOne({email});

      if(user &&(await user.comparepassword(password))){
        const{accestoken,refreshtoken} = generateToken(user._id)

        await storeRefreshToken(user._id,refreshtoken)
        setCookie(res,accestoken,refreshtoken)

        res.json({
          _id:user._id,
          name:user.name,
          email:user.email,
          role:user.role
      });
      }else{
        res.status(401).json({message:"Invaild Login Details"});
      }
    } catch (error) {
      res.status(500).json({message:"Server Error - Please try Again Later",error: error.message});
    }
}
export const logout = async (req,res)=>{
    try {
      const refreshToken=req.cookies.refreshToken;
      if(refreshToken){
        const decoded = jwt.verify(refreshToken,process.env.REFRESH_TOKEN);
        await redis.del(`refresh_token:${decoded.userId}`);
      }
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      res.json({message:"Logout Successfully"});
    } catch (error) {
      res.status(500).json({message:"Server Erroe - Please try Again Later",error: error.message});
      
    }
}

export const refreshToken = async(req,res)=>{
  try {
    const refreshtoken = req.cookies.refreshToken;
    if(!refreshtoken){
      return res.status(401).json({message:"No Refresh Token"});
    }
    const decoded = jwt.verify(refreshtoken,process.env.REFRESH_TOKEN);
    const StoredToken = await redis.get(`refresh_token:${decoded.userId}`);

    if(StoredToken !== refreshtoken){
      return res.status(401).json({message:"Invaild Refresh Token"});
    }

    const accessToken = jwt.sign({userId: decoded.userId}, process.env.ACCESS_TOKEN,{expiresIn:"10m"});
    res.cookie("accessToken",accessToken,{
      httpOnly:true,
      secure:process.env.NODE_ENV==="production",
      sameSite:"strict",
      maxAge:10*60*1000,
    });
    res.json({message:"Token Refreshed Succesfully"});
  } catch (error) {
    console.log("Error in refreshing Token",error.message);
    res.status(500).json({message:"Server Error",error:error.message});
  }
} 

export const getProfile = async(req,res)=>{
  try {
    res.json(req.user);
  } catch (error) {
    res.status(500).json({message:"Server Error",error:error.message});
  }

}
