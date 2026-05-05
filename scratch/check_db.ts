import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const expense = await (prisma as any).expense.findFirst();
    console.log('Expense found:', expense);
    console.log('Has paymentMethod:', expense ? 'paymentMethod' in expense : 'N/A');
  } catch (e) {
    console.error('Error checking expense:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
