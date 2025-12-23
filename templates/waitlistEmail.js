function getWaitlistEmailTemplate({ name = "there" } = {}) {
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1.0" />
    <title>Welcome to Decklo</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
  </head>
  <body style="margin:0; padding:0; font-family:'Poppins', Arial, Helvetica, sans-serif; background-color:#f4f4f4;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f4f4f4">
      <tr>
        <td align="center" style="padding:20px 10px;">
          <table width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="border-radius:8px; overflow:hidden;">
            <tr>
              <td align="left" style="padding:25px 30px; font-family:'Poppins', Arial, sans-serif;">
                <img src="https://files.thebigphotocontest.com/decko.png" alt="Decklo Logo" style="vertical-align:middle;" />
              </td>
            </tr>

            <tr>
              <td style="padding:10px 30px 30px 30px; font-family:'Poppins', Arial, sans-serif;">
                <h1 style="margin:0; font-size:22px; font-weight:700; color:#1d1d1d;">
                  You’re on the Decklo waitlist
                </h1>
                <p style="margin:20px 0 0; font-size:16px; color:#333333; line-height:1.6;">
                  Hi ${name},
                </p>

                <p style="margin:5px 0; font-size:15px; color:#333333; line-height:1.6;">
                  Thanks for signing up! You’re officially on the Decklo waitlist.
                  We’re building the simplest way for founders to create pitch decks,
                  resumes, and financials with AI. You’ll be the first to know when we launch.
                </p>

                <p style="margin:20px 0; font-size:15px; color:#333333; line-height:1.6;">
                  You’re in good company — thousands of founders are using Decklo to move faster and smarter.
                </p>

                <table border="0" cellspacing="0" cellpadding="0" align="center" style="margin-bottom:15px;">
                  <tr>
                    <td align="center" bgcolor="#3083DC" style="border-radius:6px;">
                      <a href="#" target="_blank" style="display:inline-block; padding:12px 30px; font-size:15px; color:#ffffff; text-decoration:none; font-weight:600; border-radius:6px; font-family:'Poppins', Arial, sans-serif;">
                        Share with a Friend
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin:10px 0 0; font-size:15px; color:#333333; line-height:1.6;">
                  Stay tuned — your startup journey is about to get faster.
                </p>
                <p style="margin:5px 0 0; font-size:15px; color:#333333; line-height:1.6;">
                  Team Decklo
                </p>
              </td>
            </tr>
          </table>

          <table width="600" cellpadding="0" cellspacing="0" border="0" style="margin-top:5px;">
            <tr>
              <td align="center" style="font-size:14px; color:#555555; padding:5px 20px; font-family:'Poppins', Arial, sans-serif;">
                <strong style="margin-bottom: 5px;">Decklo</strong><br />
                <p style="margin-top: 7px;">31 Otigba Street, Ikeja, Lagos - 08023181548</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-bottom:30px;">
                <div style="text-align:center;">
                  <a href="https://x.com/decklo" style="margin:0 5px; display:inline-block; width:36px; height:36px; background-color:#3083DC; border-radius:50%; text-align:center; line-height:36px;">
                    <i class="fa-brands fa-x-twitter" style="color:#ffffff; font-size:18px;"></i>
                  </a>
                  <a href="https://www.instagram.com/decklo/" style="margin:0 5px; display:inline-block; width:36px; height:36px; background-color:#3083DC; border-radius:50%; text-align:center; line-height:36px;">
                    <i class="fa-brands fa-instagram" style="color:#ffffff; font-size:18px;"></i>
                  </a>
                  <a href="https://www.linkedin.com/company/decklo" style="margin:0 5px; display:inline-block; width:36px; height:36px; background-color:#3083DC; border-radius:50%; text-align:center; line-height:36px;">
                    <i class="fa-brands fa-linkedin" style="color:#ffffff; font-size:18px;"></i>
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

module.exports = { getWaitlistEmailTemplate };
