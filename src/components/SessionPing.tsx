'use client';

import { useEffect } from 'react';
import { fetchAPI } from '@/lib/api';

export function SessionPing() {
  useEffect(() => {
    const pingInterval = setInterval(() => {
      fetchAPI('/users/me/session-ping', { method: 'POST' }).catch((err) => {
        // Silently fail if network is down or session expired
      });
    }, 60000); // Mỗi 60 giây

    return () => clearInterval(pingInterval);
  }, []);

  return null;
}
