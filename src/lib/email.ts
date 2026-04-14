import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const sendEmail = async ({ to, subject, html }: { to: string, subject: string, html: string }) => {
    // If no credentials, log the link instead (for development)
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('--- EMAIL MOCK ---');
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Content: ${html}`);
        console.log('------------------');
        return;
    }

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"Finance Hub" <noreply@financehub.com>',
            to,
            subject,
            html,
        });
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};
