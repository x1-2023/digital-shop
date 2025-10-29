// ==============================================================================
// Online Users Tracking
// ==============================================================================
// Track online users (guests + authenticated users) using in-memory storage
// Users are considered online if they sent a heartbeat in the last 5 minutes
// ==============================================================================

interface OnlineUser {
  sessionId: string;
  userId?: string; // undefined for guests
  userEmail?: string;
  lastSeen: number; // timestamp
  userAgent?: string;
}

// In-memory storage (will reset on server restart)
const onlineUsers = new Map<string, OnlineUser>();

// Constants
const ONLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes
const CLEANUP_INTERVAL_MS = 60 * 1000; // 1 minute

/**
 * Update user's last seen timestamp (heartbeat)
 */
export function updateUserHeartbeat(
  sessionId: string,
  userId?: string,
  userEmail?: string,
  userAgent?: string
): void {
  onlineUsers.set(sessionId, {
    sessionId,
    userId,
    userEmail,
    lastSeen: Date.now(),
    userAgent,
  });
}

/**
 * Remove user from tracking (on explicit logout)
 */
export function removeUserSession(sessionId: string): void {
  onlineUsers.delete(sessionId);
}

/**
 * Cleanup stale sessions (older than ONLINE_THRESHOLD_MS)
 */
function cleanupStaleSessions(): void {
  const now = Date.now();
  const staleThreshold = now - ONLINE_THRESHOLD_MS;

  for (const [sessionId, user] of onlineUsers.entries()) {
    if (user.lastSeen < staleThreshold) {
      onlineUsers.delete(sessionId);
    }
  }
}

/**
 * Get current online users count
 */
export function getOnlineUsersCount(): {
  total: number;
  guests: number;
  authenticated: number;
} {
  // Cleanup stale sessions first
  cleanupStaleSessions();

  let guests = 0;
  let authenticated = 0;

  for (const user of onlineUsers.values()) {
    if (user.userId) {
      authenticated++;
    } else {
      guests++;
    }
  }

  return {
    total: guests + authenticated,
    guests,
    authenticated,
  };
}

/**
 * Get list of online users (for admin)
 */
export function getOnlineUsersList(): OnlineUser[] {
  cleanupStaleSessions();
  return Array.from(onlineUsers.values());
}

/**
 * Start periodic cleanup
 */
let cleanupInterval: NodeJS.Timeout | null = null;

export function startOnlineTracking(): void {
  if (cleanupInterval) {
    console.log('[OnlineTracking] Already running');
    return;
  }

  cleanupInterval = setInterval(() => {
    cleanupStaleSessions();
    const stats = getOnlineUsersCount();
    console.log(`[OnlineTracking] Online: ${stats.total} (${stats.authenticated} users + ${stats.guests} guests)`);
  }, CLEANUP_INTERVAL_MS);

  console.log('[OnlineTracking] Started periodic cleanup');
}

export function stopOnlineTracking(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    console.log('[OnlineTracking] Stopped');
  }
}
