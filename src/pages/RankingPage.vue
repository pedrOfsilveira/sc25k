<script setup>
import { ref, onMounted, computed } from 'vue'
import { Notify } from 'quasar'
import { supabase } from 'boot/supabase'
import { treinos } from 'src/data/treinos.js'
import StarBackground from 'src/components/StarBackground.vue'

const loading = ref(true)
const rows = ref([])

const totalChallengeDays = computed(() => {
  return (treinos || []).reduce((sum, week) => sum + (Array.isArray(week.dias) ? week.dias.length : 0), 0)
})

const safePercent = (completedCount) => {
  const total = totalChallengeDays.value
  if (!total) return 0
  return Math.max(0, Math.min(100, Math.round((completedCount / total) * 100)))
}

const isUuid = (value) => {
  if (typeof value !== 'string') return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.trim())
}

const loadRanking = async () => {
  loading.value = true

  try {
    // Ensure user is authenticated (route guard should already do this)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    // Try to infer org scope for the ranking (new profiles schema has org_id)
    const metaOrgId =
      session.user?.user_metadata?.org_id ||
      session.user?.user_metadata?.orgId ||
      session.user?.user_metadata?.organization_id ||
      session.user?.app_metadata?.org_id ||
      session.user?.app_metadata?.orgId ||
      session.user?.app_metadata?.organization_id ||
      null

    let orgId = isUuid(metaOrgId) ? metaOrgId : null

    // Prefer org_id stored in profiles (if RLS allows it)
    const { data: myProfile, error: myProfileError } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', session.user.id)
      .maybeSingle()

    if (!myProfileError && isUuid(myProfile?.org_id)) orgId = myProfile.org_id

    let profilesQuery = supabase.from('profiles').select('id, name, avatar_url, org_id')
    if (orgId) profilesQuery = profilesQuery.eq('org_id', orgId)
    const { data: profiles, error: profilesError } = await profilesQuery
    if (profilesError) throw profilesError

    const profileIds = (profiles || []).map(p => p.id).filter(Boolean)
    if (profileIds.length === 0) {
      rows.value = []
      return
    }

    const { data: completed, error: completedError } = await supabase
      .from('completed_days')
      .select('user_id, week_id, day')
      .in('user_id', profileIds)

    if (completedError) throw completedError

    const completionByUser = new Map() // userId -> Set("weekId-day")
    for (const row of completed || []) {
      if (!row?.user_id) continue
      const key = `${row.week_id}-${row.day}`
      if (!completionByUser.has(row.user_id)) completionByUser.set(row.user_id, new Set())
      completionByUser.get(row.user_id).add(key)
    }

    const knownProfiles = new Map()
    for (const p of profiles || []) {
      if (p?.id) knownProfiles.set(p.id, p)
    }

    // Do not include users outside the visible org scope

    const totalDays = totalChallengeDays.value

    const computedRows = Array.from(knownProfiles.values()).map((p) => {
      const completedCount = completionByUser.get(p.id)?.size || 0
      return {
        id: p.id,
        name: (p.name || 'unknown').toString(),
        avatar_url: p.avatar_url || '',
        completedCount,
        totalDays,
        percent: safePercent(completedCount)
      }
    })

    computedRows.sort((a, b) => {
      if (b.percent !== a.percent) return b.percent - a.percent
      if (b.completedCount !== a.completedCount) return b.completedCount - a.completedCount
      return a.name.localeCompare(b.name)
    })

    rows.value = computedRows
  } catch (error) {
    console.error('Error loading ranking:', error)
    Notify.create({
      message: 'Failed to load ranking',
      color: 'negative',
      position: 'top'
    })
  } finally {
    loading.value = false
  }
}

onMounted(loadRanking)
</script>

<template>
  <q-page class="page-container q-pa-md">
    <StarBackground />

    <div class="content-wrapper q-px-md">
      <div class="text-center q-mb-md">
        <h2 class="text-h4 star-font text-accent snes-blink" style="text-shadow: 4px 4px 0 #000; margin-bottom: 10px;">
          RANKING
        </h2>
        <div class="alien-font text-grey-5" style="font-size: 10px">
          BASED ON CHALLENGE COMPLETION
        </div>
      </div>

      <q-card class="profile-card q-mb-md">
        <div class="profile-card-body">
          <div class="row items-center justify-between">
            <div>
              <div class="alien-font text-grey-5" style="font-size: 10px">TOTAL STAGES</div>
              <div class="star-font text-white">{{ totalChallengeDays }}</div>
            </div>
            <q-btn
              flat
              dense
              icon="refresh"
              color="accent"
              class="border-btn alien-font"
              @click="loadRanking"
            />
          </div>
        </div>
      </q-card>

      <div v-if="loading" class="text-center text-white alien-font snes-blink q-mt-xl">
        LOADING RANKING...
      </div>

      <div v-else>
        <q-list dark class="retro-list ranking-list">
          <q-item
            v-for="(r, idx) in rows"
            :key="r.id"
            class="ranking-item runner-card"
            :class="idx === 0 ? 'runner-gold' : idx === 1 ? 'runner-silver' : idx === 2 ? 'runner-bronze' : ''"
          >
            <q-item-section avatar>
              <div class="rank-badge star-font" :class="idx === 0 ? 'rank-gold' : idx === 1 ? 'rank-silver' : idx === 2 ? 'rank-bronze' : 'rank-normal'">
                #{{ idx + 1 }}
              </div>
            </q-item-section>

            <q-item-section avatar>
              <q-avatar
                square
                size="42px"
                :class="[
                  'runner-avatar',
                  idx === 0 ? 'avatar-gold' : idx === 1 ? 'avatar-silver' : idx === 2 ? 'avatar-bronze' : ''
                ]"
              >
                <img v-if="r.avatar_url" :src="r.avatar_url" class="runner-avatar-img" />
                <q-icon v-else name="person" color="grey-6" class="runner-avatar-icon" />
              </q-avatar>
            </q-item-section>

            <q-item-section class="runner-main">
              <div class="runner-header">
                <q-btn
                  flat
                  dense
                  no-caps
                  class="runner-name-btn"
                  :aria-label="`Show full name for ${r.name}`"
                >
                  <span class="star-font text-white ellipsis runner-name">{{ r.name }}</span>
                  <q-popup-proxy transition-show="jump-down" transition-hide="jump-up">
                    <div class="name-tooltip-card">
                      <div class="alien-font text-grey-5 name-tooltip-label">RUNNER</div>
                      <div class="star-font text-white name-tooltip-value">{{ r.name }}</div>
                    </div>
                  </q-popup-proxy>
                </q-btn>
                <div class="star-font text-accent runner-percent">{{ r.percent }}%</div>
              </div>

              <div class="alien-font text-grey-5" style="font-size: 10px">
                {{ r.completedCount }} / {{ r.totalDays }} COMPLETED
              </div>

              <q-linear-progress
                :value="r.totalDays ? r.completedCount / r.totalDays : 0"
                size="10px"
                class="retro-bar q-mt-xs"
                color="accent"
              />
            </q-item-section>
          </q-item>

          <div v-if="rows.length === 0" class="empty-state q-pa-lg text-center">
            <q-icon name="emoji_events" color="grey-6" size="48px" class="q-mb-md" />
            <div class="alien-font text-grey-5" style="font-size: 10px; line-height: 20px;">
              NO RUNNERS FOUND.
            </div>
          </div>
        </q-list>
      </div>
    </div>
  </q-page>
</template>

<style scoped lang="scss">
.page-container {
  display: flex;
  justify-content: center;
  min-height: 100vh;
}

.content-wrapper {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

// Profile-like card styles (kept local because ProfilePage styles are scoped)
.profile-card {
  background-color: #090a0f;
  border: 2px solid #fff;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.8);
}

.profile-card-body {
  padding: 12px;
}

.ranking-item {
  padding: 18px 16px;
}

.ranking-list {
  width: 100%;
}

// Match Profile "stat-card" look for each row
.runner-card {
  width: 100%;
  background-color: #090a0f;
  border: 2px solid #fff;
  border-radius: 4px;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.8);
  margin-bottom: 12px;
  overflow: hidden;
}

.runner-card:last-child {
  margin-bottom: 0;
}

.runner-gold {
  border-color: var(--retro-accent);
}

.runner-silver {
  border-color: var(--snes-light);
}

.runner-bronze {
  border-color: var(--snes-red);
}

.runner-name {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.runner-name-btn {
  padding: 0;
  min-width: 0;
  max-width: 100%;
  text-align: left;
  justify-content: flex-start;
}

.runner-main {
  min-width: 0;
}

.runner-header {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-width: 0;
}

.runner-percent {
  flex: 0 0 auto;
  white-space: nowrap;
  margin-left: auto;
}

.name-tooltip-card {
  background-color: #090a0f;
  border: 2px solid #fff;
  border-radius: 4px;
  padding: 10px 12px;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.8);
  max-width: min(320px, 80vw);
}

.name-tooltip-label {
  font-size: 10px;
  letter-spacing: 1px;
  margin-bottom: 4px;
}

.name-tooltip-value {
  font-size: 14px;
  line-height: 1.1;
  word-break: break-word;
}

.rank-badge {
  min-width: 52px;
  text-align: center;
  padding: 6px 8px;
  border: 2px solid #fff;
  background-color: #090a0f;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.8);
  font-size: 12px;
}

.rank-gold {
  color: var(--retro-accent);
  border-color: var(--retro-accent);
}

.rank-silver {
  color: var(--snes-light);
  border-color: var(--snes-light);
}

.rank-bronze {
  color: var(--snes-red);
  border-color: var(--snes-red);
}

.rank-normal {
  color: #fff;
}

.runner-avatar {
  border: 2px solid #fff;
  border-radius: 0 !important;
  background-color: rgba(0, 0, 0, 0.5);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-gold {
  border-color: var(--retro-accent);
}

.avatar-silver {
  border-color: var(--snes-light);
}

.avatar-bronze {
  border-color: var(--snes-red);
}

.runner-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.runner-avatar-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.border-btn {
  border: 2px solid currentColor;
  border-radius: 0;
}
</style>
