import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { name, email, subject, message } = body ?? {};

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { message: 'Please fill in all fields.' },
        { status: 400 }
      );
    }

    // Validate email format basic check to simulate user/recipient validation
    if (!email.includes('@')) {
      console.warn('[Contact Form - Validation Failure] Invalid email address format:', email);
      return NextResponse.json(
        { message: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const recipient = 'sales.thebitvista@gmail.com';
    const emailText = [
      `Name: ${String(name)}`,
      `Email: ${String(email)}`,
      `Subject: ${String(subject)}`,
      '',
      `Message:`,
      String(message),
    ].join('\n');

    // 1. Send main message to Sales
    const salesEmail = await resend.emails.send({
      from: 'MAJ Boutique Contact <onboarding@resend.dev>',
      to: recipient,
      subject: `New Contact Submission: ${String(subject)}`,
      text: emailText,
      replyTo: email,
    });

    if (salesEmail.error) {
      console.error('[Resend Sales Email Error]', salesEmail.error);
      throw new Error(salesEmail.error.message || 'Failed to send notification email to boutique.');
    }

    console.log('[Contact Form] Notification sent to sales successfully:', salesEmail.data);

    // 2. Send confirmation email to the user
    try {
      const confirmationEmail = await resend.emails.send({
        from: 'MAJ Boutique <onboarding@resend.dev>',
        to: email,
        subject: 'Message Successfully Sent - MAJ Boutique',
        text: `Dear ${String(name)},\n\nThank you for reaching out to MAJ Boutique! This is to confirm that your message has been successfully sent to our team.\n\nHere is a copy of your message:\n---\nSubject: ${String(subject)}\n${String(message)}\n---\n\nWe will get back to you shortly.\n\nBest regards,\nThe MAJ Boutique Team`,
      });

      if (confirmationEmail.error) {
        console.warn('[Resend User Confirmation Warning] Could not send confirmation to user (likely due to unverified Resend domain):', confirmationEmail.error);
      } else {
        console.log('[Contact Form] Confirmation sent to user successfully:', confirmationEmail.data);
      }
    } catch (confError) {
      console.warn('[Resend User Confirmation Error]', confError);
    }

    return NextResponse.json(
      {
        message: 'Thank you! Your message has been received. We will respond shortly.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Contact Form Error]', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'We could not process your request right now.' },
      { status: 500 }
    );
  }
}

