function generateOtpEmail(firstName, otpCode) {
  return `
<!DOCTYPE html>
<html><head>
    <meta charset="UTF-8">
    <title>Verify Email</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&amp;display=swap" rel="stylesheet">
  </head>
  <body style="margin:0; padding:0; background-color:#f9f9f9; font-family:'Poppins', Arial, sans-serif;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="padding:30px 0;">
      <tbody><tr>
        <td align="center">
          <table border="0" cellpadding="0" cellspacing="0" width="500" style="background:#ffffff; border-radius:16px; padding:10px 30px 30px 30px; box-shadow:0 2px 6px rgba(0,0,0,0.05);">
            
            <tbody><tr>
              <td align="left" style="padding:0px 0px 25px ; font-family:'Poppins', Arial, sans-serif;">
                  <table cellpadding="0" cellspacing="0" border="0">
                  <tbody><tr>
                    <td>
                      <img src="https://files.thebigphotocontest.com/decko.png" alt="Decklo Logo" width="90%" height="90%" style="vertical-align:middle;">
                    </td></tr>
                </tbody></table>
              </td>
            </tr>
            <tr>
              <td style="font-size:20px; font-weight:600; color:#111; padding-bottom:20px;">
                Confirm Verification Code
              </td>
            </tr>

            <tr>
              <td style="font-size:14px; color:#333; padding-bottom:12px;">
                Hi ${firstName || 'there'},
              </td>
            </tr>

            <tr>
              <td style="font-size:14px; color:#555; line-height:1.6; padding-bottom:20px;">
                Thanks for signing up for Decklo. Before we get started, please confirm your email address.
              </td>
            </tr>

            <tr>
              <td style="font-size:14px; color:#333; padding-bottom:12px;">
                Here’s your verification code:
              </td>
            </tr>

            <tr>
              <td style="padding-bottom:24px;">
                <table border="0" cellpadding="0" cellspacing="0">
                  <tbody><tr>
                    <td style="background:#f5f5f5; font-size:20px; font-weight:600; color:#111; text-align:center; padding:14px 20px; border-radius:8px; margin-right:10px;">${otpCode[0]}</td>
                    <td width="10"></td>
                    <td style="background:#f5f5f5; font-size:20px; font-weight:600; color:#111; text-align:center; padding:14px 20px; border-radius:8px;">${otpCode[1]}</td>
                    <td width="10"></td>
                    <td style="background:#f5f5f5; font-size:20px; font-weight:600; color:#111; text-align:center; padding:14px 20px; border-radius:8px;">${otpCode[2]}</td>
                    <td width="10"></td>
                    <td style="background:#f5f5f5; font-size:20px; font-weight:600; color:#111; text-align:center; padding:14px 20px; border-radius:8px;">${otpCode[3]}</td>
                    <td width="10"></td>
                    <td style="background:#f5f5f5; font-size:20px; font-weight:600; color:#111; text-align:center; padding:14px 20px; border-radius:8px;">${otpCode[4]}</td>
                    <td width="10"></td>
                    <td style="background:#f5f5f5; font-size:20px; font-weight:600; color:#111; text-align:center; padding:14px 20px; border-radius:8px;">${otpCode[5]}</td>
                  </tr>
                </tbody></table>
              </td>
            </tr>

            <tr>
              <td style="font-size:14px; color:#555; padding-bottom:20px; ">
                Or verify directly by clicking below:
              </td>
            </tr>

            <tr>
              <td style="padding-bottom:24px;">
                <a href="#" style="background:#3083DC; color:#ffffff; font-size:14px; font-weight:600; text-decoration:none; padding:14px 36px; border-radius:8px; display:inline-block;">
                  Verify Email
                </a>
              </td>
            </tr>

            <tr>
              <td style="font-size:12px; color:#666; line-height:1.6; padding-bottom:20px;">
                This code and link will expire in 30 minutes. If you didn’t sign up, please ignore this email.
              </td>
            </tr>

            <tr>
              <td style="font-size:14px; color:#333; padding-bottom:4px;">
                We’re excited to see what you’ll create.
              </td>
            </tr>

            <tr>
              <td style="font-size:14px; font-weight:600; color:#333;">
                Team Decklo
              </td>
            </tr>
          </tbody></table>
          </td>
      </tr>
    </tbody></table>
</body></html>
  `;
}

module.exports = { generateOtpEmail };
