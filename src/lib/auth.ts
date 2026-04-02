import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: false,
                defaultValue: "STAFF",
                input: false
            },
            storeId: {
                type: "string",
                required: false, // Made optional for the signup payload so we can generate it
            }
        }
    },
    databaseHooks: {
        user: {
            create: {
                before: async (user) => {
                    // Create a default store for the new registrant
                    const store = await prisma.store.create({
                        data: {
                            name: `Boutique de ${user.name || 'Nouveau Propriétaire'}`,
                        }
                    });
                    
                    return {
                        data: {
                            ...user,
                            storeId: store.id,   // Assign the newly created store to this user
                            role: 'OWNER',       // The creator of the account becomes the OWNER
                        }
                    };
                }
            }
        }
    },
    // Include additional fields in the session
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60, // 5 minutes
        }
    }
});
