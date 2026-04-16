import { useCallback, useState } from 'react';
import { supabase } from '@gamehub/domain';
import { RSVPStatus } from '@gamehub/domain';

async function triggerTeamSnapWriteback(eventId: string, status: RSVPStatus, accessToken: string) {
  const supabaseUrl = process.env['EXPO_PUBLIC_SUPABASE_URL'] ?? '';
  if (!supabaseUrl) return;
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/rsvp-writeback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ eventId, status }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.warn('[RSVP writeback] failed:', data);
    } else {
      const data = await res.json();
      console.log('[RSVP writeback] success, wroteBack:', data.wroteBack);
    }
  } catch (err) {
    console.warn('[RSVP writeback] network error:', err);
  }
}

// Maps our three canonical statuses to each provider's terminology.
// Used when writing back to the source app (future implementation).
export const PROVIDER_RSVP_MAP: Record<string, Record<RSVPStatus, string>> = {
  teamsnap:             { ATTENDING: 'yes',      NOT_ATTENDING: 'no',         MAYBE: 'maybe',     PENDING: 'unknown'  },
  sportsengine:         { ATTENDING: 'going',    NOT_ATTENDING: 'not_going',  MAYBE: 'maybe',     PENDING: 'unknown'  },
  sportsengine_tourney: { ATTENDING: 'going',    NOT_ATTENDING: 'not_going',  MAYBE: 'maybe',     PENDING: 'unknown'  },
  gamechanger:          { ATTENDING: 'yes',      NOT_ATTENDING: 'no',         MAYBE: 'maybe',     PENDING: 'unknown'  },
  playmetrics:          { ATTENDING: 'yes',      NOT_ATTENDING: 'no',         MAYBE: 'maybe',     PENDING: 'unknown'  },
  leagueapps:           { ATTENDING: 'accepted', NOT_ATTENDING: 'declined',   MAYBE: 'tentative', PENDING: 'pending'  },
  heja:                 { ATTENDING: 'yes',      NOT_ATTENDING: 'no',         MAYBE: 'maybe',     PENDING: 'unknown'  },
  band:                 { ATTENDING: 'going',    NOT_ATTENDING: 'not_going',  MAYBE: 'maybe',     PENDING: 'unknown'  },
  crossbar:             { ATTENDING: 'yes',      NOT_ATTENDING: 'no',         MAYBE: 'maybe',     PENDING: 'unknown'  },
  ics:                  { ATTENDING: 'ACCEPTED', NOT_ATTENDING: 'DECLINED',   MAYBE: 'TENTATIVE', PENDING: 'NEEDS-ACTION' },
  manual:               { ATTENDING: 'ATTENDING', NOT_ATTENDING: 'NOT_ATTENDING', MAYBE: 'MAYBE', PENDING: 'PENDING'  },
  email_import:         { ATTENDING: 'ATTENDING', NOT_ATTENDING: 'NOT_ATTENDING', MAYBE: 'MAYBE', PENDING: 'PENDING'  },
};

export function useRSVP() {
  const [loadingEventId, setLoadingEventId] = useState<string | null>(null);

  const updateRSVP = useCallback(async (
    eventId: string,
    status: RSVPStatus,
    options?: { childProfileId?: string; providerId?: string },
  ): Promise<boolean> => {
    setLoadingEventId(eventId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const providerValue = options?.providerId && PROVIDER_RSVP_MAP[options.providerId]
        ? PROVIDER_RSVP_MAP[options.providerId][status]
        : status;

      console.log(`[RSVP] ${status} → "${providerValue}" for provider "${options?.providerId ?? 'none'}"`);

      // Delete-then-insert avoids the NULL child_profile_id conflict:
      // PostgreSQL treats NULL != NULL so upsert never resolves (event,user,NULL) conflicts.
      await supabase
        .from('attendances')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id);

      const { error } = await supabase.from('attendances').insert({
        event_id: eventId,
        user_id: user.id,
        child_profile_id: options?.childProfileId ?? null,
        status,
        local_intent: status,
        wrote_back: false,
        mismatch_detected: false,
        updated_at: new Date().toISOString(),
      });

      if (!error && options?.providerId === 'teamsnap') {
        const session = (await supabase.auth.getSession()).data.session;
        if (session) {
          // Fire-and-forget — UI already reflects the local status.
          triggerTeamSnapWriteback(eventId, status, session.access_token);
        }
      }

      return !error;
    } catch {
      return false;
    } finally {
      setLoadingEventId(null);
    }
  }, []);

  return { updateRSVP, loadingEventId };
}
