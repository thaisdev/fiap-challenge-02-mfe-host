import { listMockUsers } from '@/app/lib/mock-auth';

export async function GET() {
  const [currentUser] = listMockUsers();

  if (!currentUser) {
    return Response.json(
      { message: 'Nenhuma conta mockada encontrada.' },
      { status: 404 }
    );
  }

  return Response.json({
    accountBalanceInCents: currentUser.accountBalanceInCents,
    currency: 'BRL',
  });
}
