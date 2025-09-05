function generateOtpEmail(firstName, otpCode) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Email Verification - GidiPitch</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fff7f0; font-family: 'Segoe UI', sans-serif;">
  <div style="max-width: 600px; margin: 40px auto; padding: 32px 24px; background-color: #ffffff; border-radius: 12px; border: 1px solid #fde7d9; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
    
    <div style="text-align: center;">
      <img src="" alt="GidiPitch Logo" style="height: 48px; margin-bottom: 24px;" />
    </div>

    <h2 style="font-size: 24px; font-weight: 700; color: #ea580c; text-align: center; margin-bottom: 12px;">
      Welcome to GidiPitch, ${firstName || "there"}!
    </h2>
    
    <p style="color: #374151; text-align: center; font-size: 16px; margin-bottom: 24px;">
      We're excited to have you join our community of founders across Africa.
    </p>

    <div style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px; text-align: center;">
      <p>To complete your registration, please use the following one-time password (OTP):</p>
    </div>

    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; background-color: #ea580c; color: #ffffff; font-weight: 700; font-size: 24px; letter-spacing: 4px; padding: 16px 32px; border-radius: 8px;">
        ${otpCode}
      </div>
    </div>

    <p style="text-align: center; color: #6b7280; font-size: 14px; margin-bottom: 12px;">
      This OTP will expire in <strong>30 minutes</strong>.
    </p>

    <p style="text-align: center; color: #9ca3af; font-size: 12px;">
      If you didn’t sign up for GidiPitch, you can safely ignore this email.
    </p>
  </div>

  <footer style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 24px;">
    © ${new Date().getFullYear()} GidiPitch. All rights reserved.
  </footer>
</body>
</html>
  `;
}

module.exports = { generateOtpEmail };
