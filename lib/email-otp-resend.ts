/**
 * Email OTP Sending with Resend
 * Modern, simple email API with generous free tier
 * Setup: https://resend.com
 */

interface ResendResponse {
    id?: string;
    error?: {
        message: string;
    };
}

export async function sendEmailOTP(email: string, otp: string, fullName: string): Promise<boolean> {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    // If no API key, fall back to console logging
    if (!RESEND_API_KEY) {
        console.log(`\n${'='.repeat(70)}`);
        console.log(`📧 EMAIL OTP (Resend not configured - check console)`);
        console.log(`${'='.repeat(70)}`);
        console.log(`To: ${email}`);
        console.log(`Name: ${fullName}`);
        console.log(`OTP Code: ${otp}`);
        console.log(`Expires in: 5 minutes`);
        console.log(`${'='.repeat(70)}\n`);
        return false;
    }

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'Nook <onboarding@resend.dev>', // Change this after domain verification
                to: email,
                subject: 'Your Nook Verification Code',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    </head>
                    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                            <!-- Logo/Header -->
                            <div style="text-align: center; margin-bottom: 40px;">
                                <div style="display: inline-block; width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #14b8a6 0%, #10b981 50%, #f97316 100%); display: flex; align-items: center; justify-content: center;">
                                    <span style="font-size: 30px;">💬</span>
                                </div>
                                <h1 style="color: #14b8a6; margin: 20px 0 0 0; font-size: 32px; font-weight: bold;">Nook</h1>
                            </div>
                            
                            <!-- Main Content -->
                            <div style="background: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                                <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 24px;">Welcome to Your Cozy Space!</h2>
                                
                                <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                    Hello <strong>${fullName}</strong>,
                                </p>
                                
                                <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                    Your verification code is:
                                </p>
                                
                                <!-- OTP Box -->
                                <div style="background: linear-gradient(135deg, #f0fdfa 0%, #fef3c7 100%); padding: 30px; text-align: center; border-radius: 12px; margin: 0 0 30px 0; border: 2px solid #14b8a6;">
                                    <div style="font-size: 48px; font-weight: bold; letter-spacing: 12px; color: #14b8a6; font-family: 'Courier New', monospace;">
                                        ${otp}
                                    </div>
                                </div>
                                
                                <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                                    ⏰ This code will expire in <strong>5 minutes</strong>
                                </p>
                                
                                <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
                                    If you didn't request this code, please ignore this email.
                                </p>
                            </div>
                            
                            <!-- Footer -->
                            <div style="text-align: center; margin-top: 40px; color: #9ca3af; font-size: 14px;">
                                <p style="margin: 0 0 10px 0;">Connect with others in a vibrant, colorful space</p>
                                <p style="margin: 0;">© 2024 Nook. Your cozy space to connect.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `,
            }),
        });

        const data: ResendResponse = await response.json();

        if (!response.ok) {
            console.error('Resend API error:', data.error?.message);
            return false;
        }

        console.log(`✅ Email sent successfully via Resend to ${email}`);
        return true;
    } catch (error) {
        console.error('Error sending email via Resend:', error);
        return false;
    }
}

