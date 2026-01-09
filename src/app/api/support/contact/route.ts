import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/resend';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, email, subject, message } = body;

        if (!name || !email || !subject || !message) {
            return NextResponse.json(
                { error: "All fields are required" },
                { status: 400 }
            );
        }

        // Send support email to team with reply-to set to user's email
        await sendEmail({
            to: process.env.SUPPORT_EMAIL || 'support@projournx.com',
            subject: `[ProJournX Support] ${subject}`,
            replyTo: email,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
                        New Support Request
                    </h2>
                    
                    <div style="margin: 20px 0;">
                        <p><strong>From:</strong> ${name}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Subject:</strong> ${subject}</p>
                    </div>
                    
                    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #333;">Message:</h3>
                        <p style="white-space: pre-wrap; color: #555;">${message}</p>
                    </div>
                    
                    <div style="color: #888; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                        <p>This message was sent from the ProJournX Support page.</p>
                        <p>Received at: ${new Date().toLocaleString()}</p>
                    </div>
                </div>
            `
        });
        
        // Send confirmation to user
        try {
            await sendEmail({
                to: email,
                subject: `We received your support request - ProJournX`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Thank you for contacting us!</h2>
                        
                        <p>Hi ${name},</p>
                        
                        <p>We've received your support request and will get back to you as soon as possible, typically within 24 hours.</p>
                        
                        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0; color: #333;">Your message:</h3>
                            <p><strong>Subject:</strong> ${subject}</p>
                            <p style="white-space: pre-wrap; color: #555;">${message}</p>
                        </div>
                        
                        <p>If you have any additional information to share, simply reply to this email.</p>
                        
                        <p>Best regards,<br>The ProJournX Team</p>
                    </div>
                `
            });
        } catch (confirmError) {
            console.log("Could not send confirmation email:", confirmError);
        }

        return NextResponse.json({ message: "Support request sent successfully" });

    } catch (error) {
        console.error("Support contact error:", error);
        return NextResponse.json(
            { error: "Failed to send support request" },
            { status: 500 }
        );
    }
}
