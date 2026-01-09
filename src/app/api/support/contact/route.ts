import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/resend';
import SupportNotificationEmail from '@/emails/SupportNotificationEmail';
import SupportConfirmationEmail from '@/emails/SupportConfirmationEmail';

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
            react: SupportNotificationEmail({ 
                name, 
                email, 
                subject, 
                message, 
                timestamp: new Date().toLocaleString() 
            }),
        });
        
        // Send confirmation to user
        try {
            await sendEmail({
                to: email,
                subject: `We received your support request - ProJournX`,
                react: SupportConfirmationEmail({ name, subject, message }),
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
