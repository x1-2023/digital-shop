import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/jwt-session';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/sso/me
 * SSO User Info Endpoint
 * 
 * Returns current user info from session cookie or Bearer token.
 * Used by AWF-MAIL frontend to check if user is logged in.
 */
export async function GET(request: NextRequest) {
    try {
        // Try cookie first, then Bearer token
        let token = request.cookies.get('session')?.value;

        if (!token) {
            const authHeader = request.headers.get('Authorization');
            if (authHeader?.startsWith('Bearer ')) {
                token = authHeader.replace('Bearer ', '');
            }
        }

        if (!token) {
            return NextResponse.json(
                { authenticated: false },
                { status: 401 }
            );
        }

        const decoded = verifySessionToken(token);
        if (!decoded) {
            return NextResponse.json(
                { authenticated: false },
                { status: 401 }
            );
        }

        // Get fresh user data from DB
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                username: true,
                role: true,
                tokenVersion: true,
                status: true,
                createdAt: true,
            },
        });

        if (!user || user.status === 'BANNED') {
            return NextResponse.json(
                { authenticated: false },
                { status: 401 }
            );
        }

        // Check token_version
        if (decoded.token_version !== undefined && decoded.token_version < user.tokenVersion) {
            return NextResponse.json(
                { authenticated: false, error: 'Token revoked' },
                { status: 401 }
            );
        }

        return NextResponse.json({
            authenticated: true,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        console.error('[SSO Me] Error:', error);
        return NextResponse.json(
            { authenticated: false },
            { status: 500 }
        );
    }
}
