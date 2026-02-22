import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_USE_TLS,
  auth: {
    user: process.env.EMAIL_HOST_USER,      
    pass: process.env.EMAIL_HOST_PASSWORD, 
  },
})

// Verify the transpoter
transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP connection failed:", error);
  } else {
    console.log("SMTP server is ready");
  }
});

// Generic email sender
export const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"Lumio Chat App" <${process.env.EMAIL_HOST_USER}>`,
      to,
      subject,
      html,
    });
    return info;
  } catch (error) {
    console.error("Email sending failed:", error)
    throw new Error("Email could not be sent")
  }
};

// For OTP Verification
export const sendOtpEmail = async (email, name, otp) => {
  const subject = "Verify your Lumio Account"

  const html = `
    <h2>Hello ${name}</h2>
    <p>Your OTP for Lumio verification is:</p>
    <h1>${otp}</h1>
    <p>This OTP expires in 10 minutes.</p>
  `

  return await sendEmail({
    to: email,
    subject,
    html,
  })
}

// Welcome message
export const sendWelcomeEmail = async (email, name) => {
  const subject = "Welcome to Lumio 🎉"

  const html = `
    <h2>Welcome ${name}!</h2>
    <p>Your account has been successfully verified.</p>
    <p>Start chatting now 🚀</p>
  `

  return await sendEmail({
    to: email,
    subject,
    html,
  })
}

// For Loggin message
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
  `;

  return await sendEmail({
    to: email,
    subject,
    html,
  })
}
