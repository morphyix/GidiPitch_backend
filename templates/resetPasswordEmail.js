function generateForgotPasswordEmail(resetUrl) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your Password - GidiPitch</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: 'Segoe UI', sans-serif;">
  <div style="max-width: 600px; margin: 40px auto; padding: 32px 24px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">

    <div style="text-align: center;">
      <img src="" alt="GidiPitch Logo" style="height: 48px; margin-bottom: 24px;" />
    </div>

    <h2 style="font-size: 24px; font-weight: 700; color: #1f2937; text-align: center; margin-bottom: 8px;">
      Reset Your Password
    </h2>

    <p style="color: #4b5563; text-align: center; font-size: 16px; margin-bottom: 24px;">
      Forgot your password? It happens to the best of us. Click the button below to securely reset it.
    </p>

    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${resetUrl}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-weight: 600; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
        Reset Password
      </a>
    </div>

    <p style="color: #374151; font-size: 16px; text-align: center; margin-bottom: 24px;">
      This link is valid for the next <strong>5 minutes</strong>. If you didn’t request a password reset, you can safely ignore this email.
    </p>

    <p style="text-align: center; color: #6b7280; font-size: 14px;">
      Need help? Contact our support team at <a href="mailto:support@gidipitch.com" style="color: #4f46e5;">support@gidipitch.com</a>
    </p>
  </div>

  <footer style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 24px;">
    © ${new Date().getFullYear()} GidiPitch. All rights reserved.
  </footer>
</body>
</html>
  `;
}

module.exports = { generateForgotPasswordEmail };
