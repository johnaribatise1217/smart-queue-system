const baseTemplate = (content: string) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Smart Queue</title>
    </head>
    <body style="margin:0;padding:0;background:#f4f4f5;font-family:'Manrope',sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
        <tr>
          <td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:560px;width:100%;">
              
              <!-- Header -->
              <tr>
                <td style="background:#3DBFA0;padding:28px 40px;text-align:center;">
                  <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                    <tr>
                      <td style="background:rgba(255,255,255,0.2);border-radius:12px;padding:10px 14px;">
                        <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">SmartQueue</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:40px;">
                  ${content}
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding:24px 40px;border-top:1px solid #f0f0f0;text-align:center;">
                  <p style="margin:0;font-size:12px;color:#9ca3af;">
                    &copy; Queue 2025 &nbsp;·&nbsp;
                    <a href="#" style="color:#3DBFA0;text-decoration:none;">Terms of Service</a>
                    &nbsp;·&nbsp;
                    <a href="#" style="color:#3DBFA0;text-decoration:none;">Help Center</a>
                  </p>
                  <p style="margin:8px 0 0;font-size:11px;color:#d1d5db;">
                    If you didn't request this email, you can safely ignore it.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
`;

export const welcomeTemplate = (name: string) => baseTemplate(`
  <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;">
    Welcome to Smart Queue, ${name}! 🎉
  </h1>
  <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
    Your account has been created successfully. You can now join queues, track your position in real time, and get notified when it's your turn.
  </p>

  <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;width:100%;">
    <tr>
      <td style="background:#f0faf7;border-radius:12px;padding:20px 24px;">
        <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">What's next?</p>
        <ul style="margin:8px 0 0;padding-left:18px;font-size:14px;color:#374151;line-height:2;">
          <li>Browse available queues</li>
          <li>Join a queue with one tap</li>
          <li>Get notified when it's your turn</li>
        </ul>
      </td>
    </tr>
  </table>

  <table cellpadding="0" cellspacing="0">
    <tr>
      <td style="background:#3DBFA0;border-radius:10px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/login"
           style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">
          Get Started
        </a>
      </td>
    </tr>
  </table>
`);

export const otpTemplate = (name: string, otp: string) => baseTemplate(`
  <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;">
    Verify your account
  </h1>
  <p style="margin:0 0 32px;font-size:15px;color:#6b7280;line-height:1.6;">
    Hi ${name}, enter the code below to verify your email address. This code expires in <strong style="color:#111827;">10 minutes</strong>.
  </p>

  <!-- OTP boxes -->
  <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
    <tr>
      ${otp.split("").map((digit) => `
        <td style="padding:0 4px;">
          <div style="width:48px;height:56px;background:#f0faf7;border:2px solid #3DBFA0;border-radius:10px;text-align:center;line-height:56px;font-size:24px;font-weight:700;color:#3DBFA0;">
            ${digit}
          </div>
        </td>
      `).join("")}
    </tr>
  </table>

  <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;">
    Didn't request this? You can safely ignore this email.
  </p>
`);

export const passwordResetTemplate = (name: string, resetUrl: string) => baseTemplate(`
  <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;">
    Reset your password
  </h1>
  <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
    Hi ${name}, we received a request to reset your password. Click the button below to choose a new one. This link expires in <strong style="color:#111827;">1 hour</strong>.
  </p>

  <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
    <tr>
      <td style="background:#3DBFA0;border-radius:10px;">
        <a href="${resetUrl}"
           style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">
          Reset Password
        </a>
      </td>
    </tr>
  </table>

  <table cellpadding="0" cellspacing="0" style="width:100%;">
    <tr>
      <td style="background:#fef9f0;border-left:3px solid #f59e0b;border-radius:0 8px 8px 0;padding:14px 18px;">
        <p style="margin:0;font-size:13px;color:#92400e;line-height:1.5;">
          If you didn't request a password reset, please secure your account immediately and contact support.
        </p>
      </td>
    </tr>
  </table>

  <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">
    Or copy this link into your browser:<br/>
    <span style="color:#3DBFA0;word-break:break-all;">${resetUrl}</span>
  </p>
`);