import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  // Use direct API key if available (for full access including contacts)
  if (process.env.RESEND_API_KEY) {
    return {
      apiKey: process.env.RESEND_API_KEY,
      fromEmail: 'ProJournX <noreply@projournx.com>'
    };
  }
  
  // Fall back to Replit connector
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
  
  const { data, error } = await client.emails.send(emailPayload);
  
  if (error) {
    console.error('[Resend] Email send failed:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
  
  console.log(`[Resend] Email sent successfully to ${to}`);
  return { data, error: null };
}

const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;

export interface ContactSubscriptionData {
  subscription_status?: 'trial' | 'active' | 'expired' | 'cancelled' | 'none';
  is_subscribed?: boolean;
  trial_ends_at?: string;
  registered_at?: string;
}

export async function addContactToAudience({
  email,
  firstName,
  lastName,
  unsubscribed = false,
  subscriptionData
}: {
  email: string;
  firstName?: string;
  lastName?: string;
  unsubscribed?: boolean;
  subscriptionData?: ContactSubscriptionData;
}) {
  if (!AUDIENCE_ID) {
    console.warn('[Resend] RESEND_AUDIENCE_ID not configured, skipping contact sync');
    return null;
  }
  
  const { client, } = await getResendClient();
  const { apiKey } = await getCredentials();
  
  try {
    const { data, error } = await client.contacts.create({
      email,
      firstName: firstName || '',
      lastName: lastName || '',
      unsubscribed,
      audienceId: AUDIENCE_ID
    });
    
    if (error) {
      if (error.message?.includes('already exists')) {
        console.log(`[Resend] Contact already exists: ${email}`);
        return { data: null, error: null };
      }
      console.error(`[Resend] API error for ${email}:`, error);
      throw new Error(error.message || 'Failed to create contact');
    }
    
    console.log(`[Resend] Contact added: ${email}`);
    
    // Apply subscription data properties if provided
    if (subscriptionData && data?.id) {
      try {
        const updatePayload: any = {
          properties: {
            subscription_status: subscriptionData.subscription_status || 'none',
            is_subscribed: String(subscriptionData.is_subscribed || false),
            trial_ends_at: subscriptionData.trial_ends_at || '',
            registered_at: subscriptionData.registered_at || ''
          }
        };
        
        await fetch(
          `https://api.resend.com/audiences/${AUDIENCE_ID}/contacts/${data.id}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatePayload)
          }
        );
        console.log(`[Resend] Subscription data applied: ${email} (${subscriptionData.subscription_status})`);
      } catch (updateError) {
        console.error(`[Resend] Failed to apply subscription data for ${email}:`, updateError);
      }
    }
    
    return { data, error: null };
  } catch (error: any) {
    if (error?.message?.includes('already exists')) {
      console.log(`[Resend] Contact already exists: ${email}`);
      return { data: null, error: null };
    }
    console.error(`[Resend] Failed to add contact ${email}:`, error);
    throw error;
  }
}

export async function updateContactInAudience({
  email,
  firstName,
  lastName,
  unsubscribed,
  subscriptionData,
  retryCount = 0
}: {
  email: string;
  firstName?: string;
  lastName?: string;
  unsubscribed?: boolean;
  subscriptionData?: ContactSubscriptionData;
  retryCount?: number;
}) {
  if (!AUDIENCE_ID) {
    console.warn('[Resend] RESEND_AUDIENCE_ID not configured, skipping contact update');
    return null;
  }
  
  const { apiKey } = await getCredentials();
  const MAX_RETRIES = 3;
  
  try {
    // Update contact by email using the new API endpoint
    const updatePayload: any = {
      audience_id: AUDIENCE_ID
    };
    if (firstName !== undefined) updatePayload.first_name = firstName;
    if (lastName !== undefined) updatePayload.last_name = lastName;
    if (unsubscribed !== undefined) updatePayload.unsubscribed = unsubscribed;
    
    // Add custom properties for subscription data
    if (subscriptionData) {
      updatePayload.properties = {
        subscription_status: subscriptionData.subscription_status || 'none',
        is_subscribed: String(subscriptionData.is_subscribed || false),
        trial_ends_at: subscriptionData.trial_ends_at || '',
        registered_at: subscriptionData.registered_at || ''
      };
    }
    
    const updateResponse = await fetch(
      `https://api.resend.com/audiences/${AUDIENCE_ID}/contacts/${encodeURIComponent(email)}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatePayload)
      }
    );
    
    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      
      // Handle rate limiting with exponential backoff
      if (updateResponse.status === 429 && retryCount < MAX_RETRIES) {
        const waitTime = Math.pow(2, retryCount) * 1000;
        console.log(`[Resend] Rate limited, retrying ${email} in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return updateContactInAudience({ email, firstName, lastName, unsubscribed, subscriptionData, retryCount: retryCount + 1 });
      }
      
      // If contact not found, create it
      if (updateResponse.status === 404) {
        console.log(`[Resend] Contact not found, creating: ${email}`);
        return addContactToAudience({ email, firstName, lastName, unsubscribed, subscriptionData });
      }
      console.error(`[Resend] Failed to update contact ${email}:`, errorData);
      throw new Error(errorData.message || 'Failed to update contact');
    }
    
    console.log(`[Resend] Contact updated: ${email}`, subscriptionData ? `(${subscriptionData.subscription_status})` : '');
    return { data: await updateResponse.json(), error: null };
  } catch (error: any) {
    console.error(`[Resend] Failed to update contact ${email}:`, error);
    throw error;
  }
}

export async function syncContactWithSubscription(user: {
  email: string;
  fullName?: string;
  subscription?: {
    isSubscribed?: boolean;
    subscriptionStatus?: string;
    trialEndsAt?: Date | string;
    trialUsed?: boolean;
  };
  date?: Date | string;
}) {
  const nameParts = (user.fullName || '').split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  
  // Determine subscription status for Resend
  let subscriptionStatus: ContactSubscriptionData['subscription_status'] = 'none';
  const isSubscribed = user.subscription?.isSubscribed || false;
  const subStatus = user.subscription?.subscriptionStatus;
  const trialEndsAt = user.subscription?.trialEndsAt;
  const trialUsed = user.subscription?.trialUsed;
  
  if (isSubscribed && subStatus === 'active') {
    subscriptionStatus = 'active';
  } else if (subStatus === 'cancelled') {
    subscriptionStatus = 'cancelled';
  } else if (subStatus === 'expired') {
    subscriptionStatus = 'expired';
  } else if (trialEndsAt && !trialUsed) {
    // Active trial
    const trialEnd = new Date(trialEndsAt);
    if (trialEnd > new Date()) {
      subscriptionStatus = 'trial';
    } else {
      subscriptionStatus = 'expired';
    }
  } else if (trialUsed && !isSubscribed) {
    subscriptionStatus = 'expired';
  }
  
  const subscriptionData: ContactSubscriptionData = {
    subscription_status: subscriptionStatus,
    is_subscribed: isSubscribed,
    trial_ends_at: trialEndsAt ? new Date(trialEndsAt).toISOString() : undefined,
    registered_at: user.date ? new Date(user.date).toISOString() : undefined
  };
  
  return updateContactInAudience({
    email: user.email,
    firstName,
    lastName,
    subscriptionData
  });
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
