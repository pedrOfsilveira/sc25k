import { boot } from 'quasar/wrappers';
import { supabase } from 'boot/supabase';
import { useTreinoStore } from 'stores/treinoStore';
import { useShopStore } from 'stores/shopStore';

export default boot(() => {
  const store = useTreinoStore();
  const shopStore = useShopStore();

  // Initial load once app boots (will fallback if no user)
  store.loadCompletedDaysFromDB();

  // React to auth changes (login/logout)
  supabase.auth.onAuthStateChange(async (_event, _session) => {
    // Re-hydrate completion data from DB when auth changes
    if (_session && _session.user) {
      // Upsert user profile for public lookup (offers targeting)
      const u = _session.user;
      const name = u.user_metadata?.name || u.email;
      const avatar_url = u.user_metadata?.avatar_url || null;
      try {
        // Use store method to enforce uniqueness and lowercase storage
        await shopStore.createUserProfile(u.id, name, avatar_url);
      } catch (_) {}

      store.loadCompletedDaysFromDB();
    } else {
      // On logout, clear local cached progress
      store.clearLocalData();
    }
  });
});
