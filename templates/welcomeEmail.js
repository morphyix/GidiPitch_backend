function generateWelcomeEmail(firstName, verifyUrl) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Kartalist</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: 'Segoe UI', sans-serif;">
  <div style="max-width: 600px; margin: 40px auto; padding: 32px 24px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
    
    <div style="text-align: center;">
      <img src="" alt="GidiPitch Logo" style="height: 48px; margin-bottom: 24px;" />
    </div>

    <h2 style="font-size: 24px; font-weight: 700; color: #1f2937; text-align: center; margin-bottom: 8px;">
      Welcome to GidiPitch, ${firstName || "there"}!
    </h2>
    
    <p style="color: #4b5563; text-align: center; font-size: 16px; margin-bottom: 24px;">
      We're excited to have you join our community of founders across Africa.
    </p>

    <div style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      <p>As a welcome gift, you’ll receive <strong>Free Points</strong>to create your pitch deck and resume.</p>
      <p style="margin-top: 12px;">To Complete Registration,<strong>click the button below</strong>To verify your email<strong>and complete your registration</strong>.</p>
    </div>

    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${verifyUrl}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-weight: 600; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
        Complete Registration
      </a>
    </div>

    <p style="text-align: center; color: #6b7280; font-size: 14px;">
      If you didn't sign up for GidiPitch, you can safely ignore this email.
    </p>
  </div>

  <footer style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 24px;">
    © ${new Date().getFullYear()} GidiPitch. All rights reserved.
  </footer>
</body>
</html>
  `;
}
module.exports = { generateWelcomeEmail };
// This function generates a welcome email template for new users