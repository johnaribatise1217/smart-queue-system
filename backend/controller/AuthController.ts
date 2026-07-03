import { catchAsyncErrors } from "backend/middleware/catchAsyncErrors";
import { OTP } from "backend/model/otp";
import { User } from "backend/model/user";
import { NextRequest, NextResponse } from "next/server";
import { generateOtp } from "backend/utils/otpGenerator";
import { emailQueue } from "backend/queue/email/email.worker";

//register new user: /api/auth/register
export const registerUser = catchAsyncErrors(
  async (req: NextRequest) => {
    try {
      const body = await req.json()
      const {name, email, password, phoneNumber, businessName, businessAddress, role} = body

      const existingUser = await User.findOne({ email })
      if (existingUser) {
        return NextResponse.json(
          { success: false, message: "Email is already registered" },
          { status: 400 }
        )
      }

      const sessionId = crypto.randomUUID()

      await User.create({
        name, email, password, phoneNumber, businessName, businessAddress, role, sessionId: sessionId.toString()
      })

      const otpCode = generateOtp()
      const existingOtp = await OTP.findOne({ email })
      existingOtp && await existingOtp.deleteOne()

      await OTP.create(
        { email, code: otpCode, expireAt: new Date(Date.now() + 10 * 60 * 1000) })

      // Queue jobs instead of awaiting
      await emailQueue.add('welcome', { email, name })
      await emailQueue.add('otp', { email, name, otpCode })

      return NextResponse.json(
        {success: true, message: "User registered successfully"}, 
        {status: 201})
    } catch (error) {
      throw error
    }
  }
)

export const verifyOtp = catchAsyncErrors(
  async (req: NextRequest) => {
    const { email, code } = await req.json()

    const otp = await OTP.findOne({ email })

    if (!otp) {
      return NextResponse.json(
        { success: false, message: "OTP not found or has expired" },
        { status: 404 }
      )
    }

    if (otp.code !== code) {
      return NextResponse.json(
        { success: false, message: "Invalid OTP code" },
        { status: 400 }
      )
    }

    if (otp.expireAt < new Date()) {
      await otp.deleteOne()
      return NextResponse.json(
        { success: false, message: "OTP has expired, please request a new one" },
        { status: 400 }
      )
    }

    await otp.deleteOne()

    await User.findOneAndUpdate(
      { email },
      { isVerified: true },
      { new: true }
    )

    return NextResponse.json(
      { success: true, message: "Account verified successfully" },
      { status: 200 }
    )
  }
)

export const resendOtp = catchAsyncErrors(
  async (req: NextRequest) => {
    const { email } = await req.json()

    const user = await User.findOne({ email })

    if (!user) {
      return NextResponse.json(
        { success: false, message: "No account found with that email" },
        { status: 404 }
      )
    }

    if (user.isVerified) {
      return NextResponse.json(
        { success: false, message: "Account is already verified" },
        { status: 400 }
      )
    }

    const existingOtp = await OTP.findOne({ email })
    existingOtp && await existingOtp.deleteOne()

    const otpCode = generateOtp()

    await OTP.create({
      email,
      code: otpCode,
      expireAt: new Date(Date.now() + 10 * 60 * 1000),
    })

    await emailQueue.add('otp', { email, name: user.name, otpCode })

    return NextResponse.json(
      { success: true, message: "OTP sent successfully" },
      { status: 200 }
    )
  }
)

//update profile: /api/auth/update-profile
export const updateUserProfile = catchAsyncErrors(
  async (req: NextRequest) => {
    const body = await req.json()
    await User.findByIdAndUpdate(req.user._id, {
      ...body
    }, {new: true})
    return NextResponse.json(
      {success: true, message: "User updated successfully"},
      {status: 200}
    ) 
  }
)

//find user by session id: /api/auth/session/:sessionId
export const getUserBySessionId = catchAsyncErrors(
  async (
    req: NextRequest,
     { params }: { params: { sessionId: string } }
  ) => {
    const { sessionId } = params
    const user = await User.findOne({ sessionId }).select('-password')
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { success: true, user },
      { status: 200 }
    )
  }
)