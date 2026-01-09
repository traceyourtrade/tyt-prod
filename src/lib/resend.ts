import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {
    apiKey: connectionSettings.settings.api_key, 
    fromEmail: connectionSettings.settings.from_email
  };
}

export async function getResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail
  };
}

export async function sendEmail({
  to,
  subject,
  html,
  from,
  replyTo
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}) {
  const { client, fromEmail } = await getResendClient();
  
  const emailPayload: {
    from: string;
    to: string;
    subject: string;
    html: string;
    reply_to?: string;
  } = {
    from: from || fromEmail || 'ProJournX <noreply@projournx.com>',
    to,
    subject,
    html
  };
  
  if (replyTo) {
    emailPayload.reply_to = replyTo;
  }
  
  const result = await client.emails.send(emailPayload);
  
  return result;
}

const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;

export async function addContactToAudience({
  email,
  firstName,
  lastName,
  unsubscribed = false
}: {
  email: string;
  firstName?: string;
  lastName?: string;
  unsubscribed?: boolean;
}) {
  if (!AUDIENCE_ID) {
    console.warn('[Resend] RESEND_AUDIENCE_ID not configured, skipping contact sync');
    return null;
  }
  
  const { client } = await getResendClient();
  
  try {
    const result = await client.contacts.create({
      email,
      firstName: firstName || '',
      lastName: lastName || '',
      unsubscribed,
      audienceId: AUDIENCE_ID
    });
    
    console.log(`[Resend] Contact added: ${email}`);
    return result;
  } catch (error: any) {
    if (error?.message?.includes('already exists')) {
      console.log(`[Resend] Contact already exists: ${email}`);
      return { data: null, error: null };
    }
    console.error(`[Resend] Failed to add contact ${email}:`, error);
    throw error;
  }
}

export async function removeContactFromAudience(email: string) {
  if (!AUDIENCE_ID) {
    console.warn('[Resend] RESEND_AUDIENCE_ID not configured, skipping contact removal');
    return null;
  }
  
  const { client } = await getResendClient();
  
  try {
    const result = await client.contacts.remove({
      email,
      audienceId: AUDIENCE_ID
    });
    
    console.log(`[Resend] Contact removed: ${email}`);
    return result;
  } catch (error) {
    console.error(`[Resend] Failed to remove contact ${email}:`, error);
    throw error;
  }
}
