import { sendEmail } from '../src/lib/resend';

async function main() {
  console.log('Sending test email...');
  
  try {
    const result = await sendEmail({
      to: 'himanshuparwal123@gmail.com',
      subject: 'Test Email from ProJournX - Resend Integration',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Test Email</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #040404; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #040404;">
            <tr>
              <td align="center" style="padding: 60px 20px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 440px; background-color: #0c0c0c; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);">
                  <tr>
                    <td height="4" style="background: linear-gradient(90deg, #3b82f6, #10b981, #3b82f6); background-color: #3b82f6;"></td>
                  </tr>
                  <tr>
                    <td style="padding: 40px 32px; text-align: center;">
                      <div style="margin-bottom: 32px;">
                        <img src="https://www.projournx.com/images/logo-dark.png" alt="ProJournX Logo" style="height: 40px; display: block; margin: 0 auto;">
                      </div>
                      <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0 0 16px 0; letter-spacing: -0.5px;">Test Email Successful!</h1>
                      <p style="color: #a1a1aa; font-size: 15px; line-height: 1.6; margin: 0 0 32px 0;">
                        This is a test email to confirm that the Resend email integration is working correctly.
                      </p>
                      <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                        <p style="color: #3b82f6; font-size: 14px; margin: 0;">
                          Sent at: ${new Date().toLocaleString()}
                        </p>
                      </div>
                      <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid rgba(255, 255, 255, 0.05);">
                        <p style="color: #52525b; font-size: 13px; line-height: 1.5; margin: 0;">
                          If you received this email, your Resend integration is working properly!
                        </p>
                      </div>
                    </td>
                  </tr>
                </table>
                <p style="margin: 24px 0 0 0; color: #52525b; font-size: 12px;">
                  Need help? Contact <a href="mailto:support@projournx.com" style="color: #3b82f6; text-decoration: none;">support@projournx.com</a>
                </p>
                <p style="margin: 8px 0 0 0; color: #3f3f46; font-size: 11px;">
                  © 2026 ProJournX. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    });
    
    console.log('Email sent successfully!');
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Failed to send email:', error);
    process.exit(1);
  }
}

main();
