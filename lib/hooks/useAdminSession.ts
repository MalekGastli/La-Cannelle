'use client';

import { useEffect, useState } from 'react';
import { teamApi, type Me } from '../api/team';

const can = (me: Me | null, permission: string) => Boolean(me && (me.isOwner || me.permissions.includes(permission)));

/** Who is signed in to the admin area and what they may do (mirrors the server's answer). */
export function useAdminSession() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    teamApi
      .me()
      .then((data) => alive && setMe(data))
      .catch(() => {
        // Expired or revoked session: back to the sign-in page
        if (alive && typeof window !== 'undefined') {
          window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
        }
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return { me, loading, can: (permission: string) => can(me, permission) };
}
