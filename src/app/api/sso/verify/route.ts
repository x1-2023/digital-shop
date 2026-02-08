import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/jwt-session';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/sso/verify
 * SSO Token Verification Endpoint
 * 
 * Accepts a JWT token and verifies it against the shared secret.
 * Returns user info if valid, including token_version check.
 * Used by AWF-MAIL to verify Shop-issued tokens.
 */
export async function POST(request: NextRequest) {
    try {
        const { token } = await request.json();

        if (!token || typeof token !== 'string') {
            return NextResponse.json(
                { valid: false, error: 'Token required' },
                { status: 400 }
            );
        }

        // Verify JWT signature and claims
        const decoded = verifySessionToken(token);
        if (!decoded) {
            return NextResponse.json(
                { valid: false, error: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        // Verify token_version against database (revocation check)
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                role: true,
                tokenVersion: true,
                status: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { valid: false, error: 'User not found' },
                { status: 404 }
            );
        }

        // Check if user is banned
        if (user.status === 'BANNED') {
            return NextResponse.json(
                { valid: false, error: 'User is banned' },
                { status: 403 }
            );
        }

        // Check token_version for revocation
        if (decoded.token_version !== undefined && decoded.token_version < user.tokenVersion) {
            return NextResponse.json(
                { valid: false, error: 'Token has been revoked' },
                { status: 401 }
            );
        }

        return NextResponse.json({
            valid: true,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                token_version: user.tokenVersion,
            },
        });
    } catch (error) {
        console.error('[SSO Verify] Error:', error);
        return NextResponse.json(
            { valid: false, error: 'Verification failed' },
            { status: 500 }
        );
    }
}
