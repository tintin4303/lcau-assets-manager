import { NextResponse } from 'next/server';
import { getAccounts } from '@/lib/holder-storage';
import { verifyPassword } from '@/lib/auth-passwords';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const accounts = getAccounts();
    const user = accounts.find((a) => a.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email.' },
        { status: 401 }
      );
    }

    if (user.status === 'disabled') {
      return NextResponse.json(
        { error: 'This account has been disabled. Please contact LCVP.' },
        { status: 403 }
      );
    }

    // Verify password with bcrypt
    if (user.password) {
      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid password. Please check your credentials.' },
          { status: 401 }
        );
      }
    } else {
      // Default initial password fallback
      const isValid = password === 'LCAU2026!' || password === 'Alyssa@LCAU2026' || password === 'Tin@LCAU2026';
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid password.' },
          { status: 401 }
        );
      }
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      assignedCategory: user.assignedCategory,
      timestamp: Date.now(),
    };

    const token = 'custom:' + Buffer.from(JSON.stringify(tokenPayload)).toString('base64');

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        assignedCategory: user.assignedCategory,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Login failed' },
      { status: 500 }
    );
  }
}
