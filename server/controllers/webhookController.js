import { Webhook } from 'svix';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const clerkWebhook = async (req, res) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('Missing CLERK_WEBHOOK_SECRET');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Get the headers
  const svix_id = req.headers['svix-id'];
  const svix_timestamp = req.headers['svix-timestamp'];
  const svix_signature = req.headers['svix-signature'];

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({ error: 'Error occured -- no svix headers' });
  }

  // Get the body
  const payload = req.body.toString();
  const headers = {
    'svix-id': svix_id,
    'svix-timestamp': svix_timestamp,
    'svix-signature': svix_signature,
  };

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt;

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, headers);
  } catch (err) {
    console.error('Error verifying webhook:', err.message);
    return res.status(400).json({ error: 'Error occured' });
  }

  const { id } = evt.data;
  const eventType = evt.type;

  console.log(`Webhook with an ID of ${id} and type of ${eventType}`);

  try {
    if (eventType === 'user.created' || eventType === 'user.updated') {
      const email = evt.data.email_addresses[0]?.email_address;
      const firstName = evt.data.first_name;
      const lastName = evt.data.last_name;
      const profileImageUrl = evt.data.image_url;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      await prisma.user.upsert({
        where: { id },
        update: {
          email,
          firstName,
          lastName,
          profileImageUrl,
        },
        create: {
          id,
          email,
          firstName,
          lastName,
          profileImageUrl,
        },
      });

      console.log(`User ${id} saved to database`);
    } else if (eventType === 'user.deleted') {
      await prisma.user.delete({
        where: { id },
      });
      console.log(`User ${id} deleted from database`);
    }
  } catch (error) {
    console.error('Error syncing to database:', error);
    return res.status(500).json({ error: 'Error syncing user to database' });
  }

  return res.status(200).json({ success: true });
};
