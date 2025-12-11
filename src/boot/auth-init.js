import { boot } from 'quasar/wrappers';
import { supabase } from 'boot/supabase';
import { useTreinoStore } from 'stores/treinoStore';

export default boot(() => {
  const store = useTreinoStore();

  // Initial load once app boots (will fallback if no user)
  store.loadCompletedDaysFromDB();

  // React to auth changes (login/logout)
  supabase.auth.onAuthStateChange((_event, _session) => {
    // Re-hydrate completion data from DB when auth changes
    if (_session && _session.user) {
      store.loadCompletedDaysFromDB();
    } else {
      // On logout, clear local cached progress
      store.clearLocalData();
    }
  });
});
