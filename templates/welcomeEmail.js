function generateWelcomeEmail(firstName) {
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1.0" />
    <title>Welcome to GidiPitch</title>
    <!-- Google Fonts (Poppins) -->
    <link
      href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />

  </head>
  <body
    style="margin:0; padding:0; font-family:'Poppins', Arial, Helvetica, sans-serif; background-color:#f4f4f4;"
  >
    <table
      width="100%"
      border="0"
      cellspacing="0"
      cellpadding="0"
      bgcolor="#f4f4f4"
    >
      <tr>
        <td align="center" style="padding:20px 10px;">
          <!-- Main Container -->
          <table
            width="600"
            cellpadding="0"
            cellspacing="0"
            border="0"
            bgcolor="#ffffff"
            style="border-radius:8px; overflow:hidden;"
          >
            <!-- Header -->
            <tr>
              <td
                align="left"
                style="padding:25px 30px; font-family:'Poppins', Arial, sans-serif;"
              >
                <table cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td>
                      <img
                        src="https://files.thebigphotocontest.com/GidiPitch.png"
                        alt="GidiPitch Logo"
                       
                        style="vertical-align:middle;"
                      />
                    </td>
                    
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding:10px 30px 30px 30px; font-family:'Poppins', Arial, sans-serif;">
                <h1
                  style="margin:0; font-size:22px; font-weight:700; color:#1d1d1d;"
                >
                  Welcome to GidiPitch!
                </h1>
                <p
                  style="margin:20px 0 0; font-size:16px; color:#333333; line-height:1.6;"
                >
                  Hi ${firstName || 'there'},
                </p>

                <p
                  style="margin:5px 0; font-size:15px; color:#333333; line-height:1.6;"
                >
                  Welcome aboard! 🎉 You’ve just joined a community of founders
                  shaping the future.<br />
                  Inside GidiPitch, you’ll find the tools to:
                </p>

                <ul
                  style="margin:15px 0; padding-left:20px; font-size:15px; color:#333333; line-height:1.6;"
                >
                  <li>Build stunning pitch decks</li>
                  <li>Practice investor pitches with AI</li>
                  <li>Craft resumes that stand out</li>
                </ul>

                <p
                  style="margin:20px 0; font-size:15px; color:#333333; line-height:1.6;"
                >
                  You’re in good company — thousands of African founders are
                  using GidiPitch to move faster and smarter.
                </p>

                <p
                  style="margin:0 0 25px; font-size:15px; color:#333333; line-height:1.6;"
                >
                  Start building your first project now.
                </p>

                <!-- CTA Button -->
    <table border="0" cellspacing="0" cellpadding="0" align="center" style="margin-bottom:15px; display:block;">
  <tr>
    <td align="center" bgcolor="#FF5619" style="border-radius:6px;">
      <a
        href="${process.env.LIVE_URL || 'https://gidi-pitch-glow-up.vercel.app'}/dashboard"
        target="_blank"
        style="display:inline-block; padding:12px 30px; font-size:15px; color:#ffffff; text-decoration:none; font-weight:600; border-radius:6px; font-family:'Poppins', Arial, sans-serif;"
      >
        Get Started
      </a>
    </td>
  </tr>
</table>

<!-- Text directly under button -->
<p style="margin:10px 0 0; font-size:15px; color:#333333; line-height:1.6; font-family:'Poppins', Arial, sans-serif; ">
  We’re excited to see what you’ll create.
</p>
<p style="margin:5px 0 0; font-size:15px; color:#333333; line-height:1.6; font-family:'Poppins', Arial, sans-serif; ">
  Team GidiPitch
</p>

            </tr>
          </table>

          <!-- Footer -->
          <table
            width="600"
            cellpadding="0"
            cellspacing="0"
            border="0"
            style="margin-top:20px;"
          >
            <tr>
              <td
                align="center"
                style="font-size:14px; color:#555555; padding:20px; font-family:'Poppins', Arial, sans-serif;"
              >
                <strong style="margin-bottom: 2;">GidiPitch</strong><br />
                31 Otigba street Ikeja Lagos - 08023181548
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-bottom:30px;">
              <div style="text-align:center;">
  <!-- X -->
  <a href="#" style="margin:0 5px; display:inline-block; width:36px; height:36px; background-color:#FF6B35; border-radius:50%; text-align:center; line-height:36px;">
    <i class="fa-brands fa-x-twitter" style="color:#ffffff; font-size:18px;"></i>
  </a>

  <!-- Instagram -->
  <a href="#" style="margin:0 5px; display:inline-block; width:36px; height:36px; background-color:#FF6B35; border-radius:50%; text-align:center; line-height:36px;">
    <i class="fa-brands fa-instagram" style="color:#ffffff; font-size:18px;"></i>
  </a>

  <!-- LinkedIn -->
  <a href="#" style="margin:0 5px; display:inline-block; width:36px; height:36px; background-color:#FF6B35; border-radius:50%; text-align:center; line-height:36px;">
    <i class="fa-brands fa-linkedin" style="color:#ffffff; font-size:18px;"></i>
  </a>

  <!-- TikTok -->
  <a href="#" style="margin:0 5px; display:inline-block; width:36px; height:36px; background-color:#FF6B35; border-radius:50%; text-align:center; line-height:36px;">
    <i class="fa-brands fa-tiktok" style="color:#ffffff; font-size:18px;"></i>
  </a>
</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `;
}

module.exports = { generateWelcomeEmail };
