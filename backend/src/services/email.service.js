import nodemailer from "nodemailer"

// Retrive from .env and use nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.CLIENT_EMAIL,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.CLIENT_REFRESH_TOKEN,
  },
})

// Verify the connection configuration
transporter.verify((error, success) => {
    if (error) {
        console.error('Error connecting to email server:', error);
    } else {
        console.log('Email server is ready to send messages');
    }
})

export const sendOtpEmail = async (email, name, otp) => {
  const subject = "Verify your Lumio Account"
  const html = `
    <h2>Hello ${name}</h2>
    <p>Your OTP for Lumio verification is:</p>
    <h1>${otp}</h1>
    <p>This OTP expires in 10 minutes.</p>
  `

  await transporter.sendMail({
    from: `"Lumio Chat App" <${process.env.CLIENT_EMAIL}>`,
    to: email,
    subject,
    html,
  })
}

export const sendWelcomeEmail = async (email, name) => {
  const subject = "Welcome to Lumio 🎉"
  const html = `
    <h2>Welcome ${name}!</h2>
    <p>Your account has been successfully verified.</p>
    <p>Start chatting now 🚀</p>
  `

  await transporter.sendMail({
    from: `"Lumio Chat App" <${process.env.CLIENT_EMAIL}>`,
    to: email,
    subject,
    html,
  })
}

export const sendLoginNotificationEmail = async (email, name) => {
  const subject = "New Login to Your Lumio Account 🔐"
  const html = `
    <h2>Hello ${name},</h2>
    <p>We noticed a new login to your Lumio account.</p>
    <p>If this was you, you can safely ignore this email.</p>
    <p>If you did not log in, please secure your account immediately by resetting your password.</p>
    <br/>
    <p>Stay safe,</p>
    <p><strong>The Lumio Team</strong></p>
  `

  await transporter.sendMail({
    from: `"Lumio Chat App" <${process.env.CLIENT_EMAIL}>`,
    to: email,
    subject,
    html,
  })
}

