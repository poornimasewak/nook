/**
 * Email OTP Sending Utility
 * In production, integrate with email service like SendGrid, AWS SES, or Nodemailer
 */

export async function sendEmailOTP(email: string, otp: string, fullName: string): Promise<boolean> {
    try {
        // In development mode, we'll just log the OTP
        if (process.env.NODE_ENV === 'development') {
            console.log(`\n${'='.repeat(70)}`);
            console.log(`📧 EMAIL OTP VERIFICATION`);
            console.log(`${'='.repeat(70)}`);
            console.log(`To: ${email}`);
            console.log(`Name: ${fullName}`);
            console.log(`OTP Code: ${otp}`);
            console.log(`Expires in: 5 minutes`);
            console.log(`${'='.repeat(70)}\n`);
            return true;
        }

        // TODO: Integrate with actual email service in production
        // Example with SendGrid:
        /*
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        
        const msg = {
            to: email,
            from: 'noreply@nook.com',
            subject: 'Your Nook Verification Code',
            text: `Hello ${fullName},\n\nYour verification code is: ${otp}\n\nThis code will expire in 5 minutes.\n\nIf you didn't request this code, please ignore this email.`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #14b8a6;">Welcome to Nook!</h2>
                    <p>Hello ${fullName},</p>
                    <p>Your verification code is:</p>
                    <div style="background: #f0fdfa; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                        <h1 style="color: #14b8a6; font-size: 36px; margin: 0; letter-spacing: 8px;">${otp}</h1>
                    </div>
                    <p>This code will expire in 5 minutes.</p>
                    <p style="color: #666; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
                </div>
            `,
        };
        
        await sgMail.send(msg);
        return true;
        */

        // Example with Nodemailer:
        /*
        const nodemailer = require('nodemailer');
        
        const transporter = nodemailer.createTransporter({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
        
        await transporter.sendMail({
            from: '"Nook" <noreply@nook.com>',
            to: email,
            subject: 'Your Nook Verification Code',
            html: `...` // Same HTML as above
        });
        
        return true;
        */

        // For now, return false to indicate email sending is not configured
        // This will trigger the console log in the API handler
        return false;
    } catch (error) {
        console.error('Error sending email OTP:', error);
        return false;
    }
}


