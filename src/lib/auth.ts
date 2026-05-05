import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import prisma from './prisma';

export const auth = betterAuth({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    async sendResetPassword(data, request) {
      const { user, url } = data;
      const { sendEmail } = await import('./email');
      await sendEmail({
        to: user.email,
        subject: 'Réinitialisation de votre mot de passe',
        html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2>Réinitialisation de votre mot de passe</h2>
                        <p>Bonjour ${user.name || 'Utilisateur'},</p>
                        <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte Finance Hub.</p>
                        <p>Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :</p>
                        <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: black; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">Réinitialiser mon mot de passe</a>
                        <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.</p>
                        <p>Ce lien expirera bientôt.</p>
                    </div>
                `,
      });
    },
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'STAFF',
        input: false,
      },
      storeId: {
        type: 'string',
        required: false, // Made optional for the signup payload so we can generate it
      },
      storeName: {
        type: 'string',
        required: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const chosenStoreName =
            typeof user.storeName === 'string' && user.storeName.trim() !== ''
              ? user.storeName
              : `Boutique de ${user.name || 'Nouveau Propriétaire'}`;

          // Create a default store for the new registrant
          const store = await prisma.store.create({
            data: {
              name: chosenStoreName,
              categories: {
                create: [
                  { name: 'Alimentation' },
                  { name: 'Boissons' },
                  { name: 'Vêtements' },
                  { name: 'Cosmétiques' },
                  { name: 'Électronique' },
                  { name: 'Services divers' },
                ],
              },
            },
          });

          return {
            data: {
              ...user,
              storeId: store.id, // Assign the newly created store to this user
              role: 'OWNER', // The creator of the account becomes the OWNER
              storeName: null, // Wipe it after use so user can use it later if needed elsewhere
            },
          };
        },
      },
    },
  },
  // Include additional fields in the session
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
});
