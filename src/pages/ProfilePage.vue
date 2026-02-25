<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from 'boot/supabase'
import { useRouter } from 'vue-router'
import { Notify } from 'quasar'
import imageCompression from 'browser-image-compression'
import StarBackground from 'src/components/StarBackground.vue'
import { computed } from 'vue'
import { useTreinoStore } from 'stores/treinoStore'
import { useSettingsStore } from 'stores/settingsStore'
import html2canvas from 'html2canvas'

const router = useRouter()
const treinoStore = useTreinoStore()
const settingsStore = useSettingsStore()
const user = ref(null)
const name = ref('')
const email = ref('')
const avatarUrl = ref('')
const editingName = ref(false)
const newName = ref('')
const loading = ref(true)
const uploadingAvatar = ref(false)
const profileShareRef = ref(null)

const appendVersionToAvatarUrl = (url, version) => {
  if (!url) return ''
  if (!version) return url

  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}v=${version}`
}

const applyUserToLocalState = (currentUser) => {
  if (!currentUser) return

  user.value = currentUser
  name.value = currentUser.user_metadata?.name || currentUser.email
  email.value = currentUser.email

  const avatarBaseUrl = currentUser.user_metadata?.avatar_url || ''
  const avatarVersion = currentUser.user_metadata?.avatar_version
  avatarUrl.value = appendVersionToAvatarUrl(avatarBaseUrl, avatarVersion)
}

const refreshAuthSessionAndApplyUser = async () => {
  const { data, error } = await supabase.auth.refreshSession()
  if (error) throw error

  const refreshedUser = data?.user || data?.session?.user || null
  if (refreshedUser) applyUserToLocalState(refreshedUser)
}

const stats = ref({
  totalRuns: 0,
  completedRuns: 0,
  totalXP: 0,
  itemsCreated: 0,
  itemsBought: 0
})

// Weekly summary data
const weeklySummary = ref({
  runsThisWeek: 0,
  xpThisWeek: 0,
  currentStreak: 0
})

// Expanded badges: ~11 meaningful milestones
const earnedBadges = computed(() => {
  const badges = []
  const runs = stats.value.completedRuns
  const xp = stats.value.totalXP
  const weeks = Object.keys(treinoStore.completedDays || {}).filter(
    k => (treinoStore.completedDays[k] || []).length === 3
  ).length

  // Run milestones
  if (runs >= 1)  badges.push({ key: 'first_run',  label: 'FIRST RUN',   icon: 'sports_score',    color: 'accent' })
  if (runs >= 5)  badges.push({ key: 'runner_5',   label: '5 RUNS',      icon: 'directions_walk', color: 'cyan' })
  if (runs >= 10) badges.push({ key: 'runner_10',  label: '10 RUNS',     icon: 'directions_run',  color: 'info' })
  if (runs >= 20) badges.push({ key: 'runner_20',  label: '20 RUNS',     icon: 'sprint',          color: 'positive' })
  if (runs >= 27) badges.push({ key: 'all_clear',  label: 'ALL CLEAR',   icon: 'military_tech',   color: 'warning' })

  // XP milestones
  if (xp >= 5000)  badges.push({ key: 'xp_5k',   label: '5K XP',  icon: 'stars',        color: 'accent' })
  if (xp >= 10000) badges.push({ key: 'xp_10k',  label: '10K XP', icon: 'auto_awesome', color: 'orange' })
  if (xp >= 25000) badges.push({ key: 'xp_25k',  label: '25K XP', icon: 'diamond',      color: 'purple' })

  // Progress milestones
  if (weeks >= 5) badges.push({ key: 'halfway', label: 'HALFWAY',  icon: 'flag',  color: 'info' })
  if (weeklySummary.value.currentStreak >= 3) badges.push({ key: 'streak_3', label: 'STREAK 3', icon: 'local_fire_department', color: 'negative' })

  // Shop milestones
  if (stats.value.itemsCreated >= 1) badges.push({ key: 'merchant', label: 'MERCHANT', icon: 'sell', color: 'warning' })

  return badges
})

onMounted(async () => {
  await loadUserData()
})

const loadUserData = async () => {
  loading.value = true
  try {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) {
      router.push('/login')
      return
    }

    applyUserToLocalState(currentUser)

    // Get training stats
    const { data: historico } = await supabase
      .from('historico_treinos')
      .select('*')
      .eq('user_id', currentUser.id)

    if (historico) {
      stats.value.totalRuns = historico.length
      stats.value.completedRuns = historico.filter(h => h.status !== 'CANCELED').length
      stats.value.totalXP = historico.reduce((sum, h) => sum + (h.pontuacao || 0), 0)

      // Compute weekly summary (runs & XP in the last 7 days)
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const recentRuns = historico.filter(h => {
        const d = new Date(h.created_at)
        return d >= weekAgo && h.status !== 'CANCELED'
      })
      weeklySummary.value.runsThisWeek = recentRuns.length
      weeklySummary.value.xpThisWeek = recentRuns.reduce((sum, h) => sum + (h.pontuacao || 0), 0)
    }

    // Compute streak from completedDays in treinoStore
    const completedDays = treinoStore.completedDays || {}
    const weekIds = Object.keys(completedDays)
      .map(Number)
      .filter(id => (completedDays[id] || []).length > 0)
      .sort((a, b) => a - b)
    let streak = 0
    if (weekIds.length > 0) {
      let expected = weekIds[weekIds.length - 1]
      for (let i = weekIds.length - 1; i >= 0; i--) {
        if (weekIds[i] !== expected) break
        streak++
        expected--
      }
    }
    weeklySummary.value.currentStreak = streak

    // Get shop stats
    const { data: ofertas } = await supabase
      .from('loja_ofertas')
      .select('*')
      .eq('criador_id', currentUser.id)

    if (ofertas) {
      stats.value.itemsCreated = ofertas.length
      stats.value.itemsBought = ofertas.filter(o => o.comprado).length
    }

  } catch (error) {
    console.error('Error loading profile:', error)
    Notify.create({ message: 'Failed to load profile', color: 'negative' })
  } finally {
    loading.value = false
  }
}

const startEditingName = () => {
  newName.value = name.value
  editingName.value = true
}

const updateName = async () => {
  const trimmedName = newName.value.trim()

  if (!trimmedName) {
    Notify.create({ message: 'Name cannot be empty', color: 'warning' })
    return
  }

  const previousName = name.value
  name.value = trimmedName
  editingName.value = false

  try {
    const { data: updatedUserData, error } = await supabase.auth.updateUser({
      data: { name: trimmedName }
    })

    if (error) throw error

    if (updatedUserData?.user) {
      applyUserToLocalState(updatedUserData.user)
    } else {
      name.value = trimmedName
    }

    // Keep DB profile in sync (new schema: profiles.name)
    try {
      await supabase
        .from('profiles')
        .update({
          name: trimmedName.toLowerCase(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.value.id)
    } catch (_) {
      // ignore: auth metadata still updated
    }

    try {
      await refreshAuthSessionAndApplyUser()
    } catch (_) {
      // local optimistic update already applied
    }

    name.value = trimmedName

    Notify.create({
      message: 'NAME UPDATED! VISIBLE ON RANKING & SHOP.',
      color: 'positive',
      icon: 'check_circle',
      classes: 'snes-font'
    })
  } catch (error) {
    console.error('Error updating name:', error)
    name.value = previousName
    editingName.value = true
    Notify.create({ message: 'Failed to update name', color: 'negative' })
  } finally {
    if (name.value === trimmedName) {
      editingName.value = false
    }
  }
}

const extractStoragePathFromPublicAvatarUrl = (url) => {
  if (!url || typeof url !== 'string') return null

  const markers = [
    '/storage/v1/object/public/profile-pictures/',
    '/storage/v1/object/sign/profile-pictures/'
  ]

  const marker = markers.find(m => url.includes(m))
  if (!marker) return null

  const after = url.split(marker)[1]
  if (!after) return null

  const path = after.split('?')[0]
  try {
    return decodeURIComponent(path)
  } catch (_) {
    return path
  }
}

const uploadAvatar = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    Notify.create({ message: 'Please select an image file', color: 'warning' })
    return
  }

  // Allow a larger source image; we'll compress before upload.
  if (file.size > 10 * 1024 * 1024) {
    Notify.create({ message: 'Image must be less than 10MB', color: 'warning' })
    return
  }

  uploadingAvatar.value = true

  try {
    const previousAvatarUrl = avatarUrl.value
    const previousStoragePath = extractStoragePathFromPublicAvatarUrl(previousAvatarUrl)
    const avatarVersion = Date.now()

    const compressedFile = await imageCompression(file, {
      maxSizeMB: 0.25,
      maxWidthOrHeight: 512,
      useWebWorker: true,
      fileType: 'image/jpeg',
      initialQuality: 0.8
    })

    if (compressedFile.size > 2 * 1024 * 1024) {
      throw new Error('Compressed image is still too large')
    }

    // Use a deterministic path so users don't accumulate old files.
    const filePath = `${user.value.id}.jpg`

    // Check if bucket exists and try to upload
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(filePath, compressedFile, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'image/jpeg'
      })

    if (uploadError) {
      console.error('Upload error details:', uploadError)
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(filePath)

    if (!urlData || !urlData.publicUrl) {
      throw new Error('Failed to get public URL')
    }

    // Update user metadata
    const { data: updatedUserData, error: updateError } = await supabase.auth.updateUser({
      data: {
        avatar_url: urlData.publicUrl,
        avatar_version: avatarVersion
      }
    })

    if (updateError) {
      console.error('Update error details:', updateError)
      throw new Error(`Update failed: ${updateError.message}`)
    }

    if (updatedUserData?.user) {
      applyUserToLocalState(updatedUserData.user)
    } else {
      avatarUrl.value = appendVersionToAvatarUrl(urlData.publicUrl, avatarVersion)
    }

    // Best-effort: delete old avatar object if it was stored in our bucket
    if (previousStoragePath && previousStoragePath !== filePath) {
      try {
        await supabase.storage
          .from('profile-pictures')
          .remove([previousStoragePath])
      } catch (_) {
        // ignore: not critical
      }
    }

    // Keep DB profile in sync (new schema: profiles.avatar_url)
    try {
      await supabase
        .from('profiles')
        .update({
          avatar_url: urlData.publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.value.id)
    } catch (_) {
      // ignore: metadata already updated
    }

    try {
      await refreshAuthSessionAndApplyUser()
    } catch (_) {
      // local optimistic update already applied
    }

    Notify.create({
      message: 'AVATAR UPDATED! OTHERS WILL SEE IT ON RANKING.',
      color: 'positive',
      icon: 'check_circle',
      classes: 'snes-font'
    })
  } catch (error) {
    console.error('Error uploading avatar:', error)
    Notify.create({
      message: error.message || 'Failed to upload avatar. Check storage bucket setup.',
      color: 'negative',
      timeout: 5000
    })
  } finally {
    uploadingAvatar.value = false
    // Reset the input so the same file can be selected again
    event.target.value = ''
  }
}

const logout = async () => {
  await supabase.auth.signOut()
  // local data will be cleared by auth-init boot hook
  router.push('/login')
}

const goToRanking = () => {
  router.push('/ranking')
}

async function shareProfile() {
  try {
    const el = profileShareRef.value
    if (!el) return
    const canvas = await html2canvas(el, {
      backgroundColor: '#090a0f',
      scale: 2,
      logging: false
    })
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
    if (!blob) return

    if (navigator.share && navigator.canShare) {
      const file = new File([blob], 'sc25k-profile.png', { type: 'image/png' })
      const shareData = { files: [file], title: 'SC25K Profile', text: `Check out my SC25K stats! ${stats.value.totalXP} XP earned.` }
      if (navigator.canShare(shareData)) {
        await navigator.share(shareData)
        return
      }
    }

    // Fallback: download
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sc25k-profile.png'
    a.click()
    URL.revokeObjectURL(url)
    Notify.create({ message: 'IMAGE SAVED!', color: 'positive', position: 'top', classes: 'retro-font' })
  } catch (e) {
    console.error('Share error:', e)
  }
}

async function shareBadge(badge) {
  try {
    const el = document.querySelector(`[data-badge-key="${badge.key}"]`)
    if (!el) return
    const canvas = await html2canvas(el, {
      backgroundColor: '#090a0f',
      scale: 3,
      logging: false
    })
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
    if (!blob) return

    if (navigator.share && navigator.canShare) {
      const file = new File([blob], `sc25k-badge-${badge.key}.png`, { type: 'image/png' })
      const shareData = { files: [file], title: `SC25K Badge: ${badge.label}`, text: `I unlocked the ${badge.label} badge on SC25K!` }
      if (navigator.canShare(shareData)) {
        await navigator.share(shareData)
        return
      }
    }

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sc25k-badge-${badge.key}.png`
    a.click()
    URL.revokeObjectURL(url)
    Notify.create({ message: 'BADGE IMAGE SAVED!', color: 'positive', position: 'top', classes: 'retro-font' })
  } catch (e) {
    console.error('Share badge error:', e)
  }
}
</script>

<template>
  <q-page class="page-container q-pa-md">
    <StarBackground />

    <div class="content-wrapper q-px-md">
      <div class="text-center q-mb-md">
        <h2 class="text-h4 star-font text-accent snes-blink" style="text-shadow: 4px 4px 0 #000; margin-bottom: 10px;">
          PROFILE
        </h2>
      </div>

      <div v-if="loading" class="q-mt-md">
        <q-card class="profile-card q-mb-md">
          <div class="profile-card-header">
            <q-skeleton type="circle" size="72px" dark />
            <div class="column q-gutter-y-sm" style="flex:1">
              <q-skeleton type="text" width="60px" dark />
              <q-skeleton type="text" width="140px" dark />
            </div>
          </div>
        </q-card>
        <div class="stats-grid q-mb-md">
          <q-skeleton v-for="n in 6" :key="n" height="100px" dark class="stat-card" />
        </div>
        <q-skeleton height="80px" dark class="q-mb-md" />
      </div>

      <template v-else>
        <!-- User Info Card -->
        <q-card class="profile-card q-mb-md">
          <div class="profile-card-header">
            <div class="profile-avatar-wrapper">
              <div class="profile-avatar">
                <img v-if="avatarUrl" :src="avatarUrl" class="avatar-img" />
                <q-icon v-else name="person" color="accent" size="48px" />
              </div>
              <label for="avatar-upload" class="avatar-upload-btn">
                <q-icon name="edit" color="black" size="xs" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  @change="uploadAvatar"
                  style="display: none;"
                />
              </label>
              <q-spinner v-if="uploadingAvatar" color="accent" size="sm" class="avatar-spinner" />
            </div>
            <div class="profile-info">
              <span class="alien-font text-grey-5">RUNNER</span>
              <div v-if="!editingName" class="row items-center no-wrap">
                <span class="star-font text-accent user-name">{{ name }}</span>
                <q-btn
                  flat
                  dense
                  icon="edit"
                  color="accent"
                  size="sm"
                  class="edit-name-btn border-btn"
                  @click="startEditingName"
                />
              </div>
              <div v-else class="edit-name-container">
                <q-input
                  v-model="newName"
                  dark
                  outlined
                  dense
                  class="retro-input alien-font name-input"
                  color="warning"
                  placeholder="Enter new name"
                  @keyup.enter="updateName"
                  @keyup.esc="editingName = false"
                />
                <div class="edit-buttons">
                  <q-btn
                    flat
                    dense
                    icon="check"
                    color="positive"
                    class="border-btn confirm-btn"
                    @click="updateName"
                  />
                  <q-btn
                    flat
                    dense
                    icon="close"
                    color="negative"
                    class="border-btn cancel-btn"
                    @click="editingName = false"
                  />
                </div>
              </div>
            </div>
          </div>
          <div class="profile-card-body">
            <div class="email-row">
              <span class="alien-font text-grey-5">EMAIL</span>
              <span class="star-font text-white">{{ email }}</span>
            </div>
          </div>
        </q-card>

        <!-- Stats Grid -->
        <div class="text-grey alien-font q-mb-sm" style="font-size: 10px">STATS:</div>
        <div class="stats-grid q-mb-md">
          <div class="stat-card q-pa-md">
            <div class="stat-icon">
              <q-icon name="directions_run" color="cyan" size="32px" />
            </div>
            <div class="stat-value star-font text-cyan">{{ stats.totalRuns }}</div>
            <div class="stat-label alien-font text-grey-5">TOTAL RUNS</div>
          </div>

          <div class="stat-card q-pa-md">
            <div class="stat-icon">
              <q-icon name="check_circle" color="green" size="32px" />
            </div>
            <div class="stat-value star-font text-green">{{ stats.completedRuns }}</div>
            <div class="stat-label alien-font text-grey-5">COMPLETED</div>
          </div>

          <div class="stat-card q-pa-md">
            <div class="stat-icon">
              <q-icon name="stars" color="accent" size="32px" />
            </div>
            <div class="stat-value star-font text-accent">{{ stats.totalXP }}</div>
            <div class="stat-label alien-font text-grey-5">TOTAL XP</div>
          </div>

          <div class="stat-card q-pa-md">
            <div class="stat-icon">
              <q-icon name="shopping_bag" color="purple" size="32px" />
            </div>
            <div class="stat-value star-font text-purple">{{ stats.itemsCreated }}</div>
            <div class="stat-label alien-font text-grey-5">ITEMS LISTED</div>
          </div>

          <div class="stat-card q-pa-md">
            <div class="stat-icon">
              <q-icon name="shopping_cart" color="orange" size="32px" />
            </div>
            <div class="stat-value star-font text-orange">{{ stats.itemsBought }}</div>
            <div class="stat-label alien-font text-grey-5">ITEMS SOLD</div>
          </div>

          <div class="stat-card q-pa-md">
            <div class="stat-icon">
              <q-icon name="percent" color="warning" size="32px" />
            </div>
            <div class="stat-value star-font text-warning">
              {{ stats.totalRuns > 0 ? Math.round((stats.completedRuns / stats.totalRuns) * 100) : 0 }}%
            </div>
            <div class="stat-label alien-font text-grey-5">SUCCESS RATE</div>
          </div>
        </div>

        <!-- Weekly Progress Summary Card -->
        <div class="text-grey alien-font q-mb-sm" style="font-size: 10px">THIS WEEK:</div>
        <div ref="profileShareRef" class="weekly-summary-grid q-mb-md">
          <div class="weekly-stat-card">
            <q-icon name="directions_run" color="info" size="22px" />
            <div class="star-font text-info weekly-stat-val">{{ weeklySummary.runsThisWeek }}</div>
            <div class="alien-font text-grey-5" style="font-size: 9px">RUNS</div>
          </div>
          <div class="weekly-stat-card">
            <q-icon name="stars" color="accent" size="22px" />
            <div class="star-font text-accent weekly-stat-val">{{ weeklySummary.xpThisWeek }}</div>
            <div class="alien-font text-grey-5" style="font-size: 9px">XP EARNED</div>
          </div>
          <div class="weekly-stat-card">
            <q-icon name="local_fire_department" color="negative" size="22px" />
            <div class="star-font text-negative weekly-stat-val">{{ weeklySummary.currentStreak }}</div>
            <div class="alien-font text-grey-5" style="font-size: 9px">WEEK STREAK</div>
          </div>
        </div>
        <div class="text-center q-mb-md">
          <q-btn flat dense icon="share" label="SHARE STATS" color="info" class="alien-font border-btn" style="font-size: 10px" @click="shareProfile" />
        </div>

        <!-- Badges (expanded ~11 milestones) -->
        <div class="text-grey alien-font q-mb-sm" style="font-size: 10px">BADGES:</div>
        <q-card class="profile-card q-mb-md">
          <div class="profile-card-body">
            <div v-if="earnedBadges.length === 0" class="alien-font text-grey-5" style="font-size: 10px">
              COMPLETE RUNS AND EARN XP TO UNLOCK BADGES.
            </div>
            <div v-else class="badges-grid">
              <div
                v-for="badge in earnedBadges"
                :key="badge.key"
                :data-badge-key="badge.key"
                class="badge-chip"
                @click="shareBadge(badge)"
              >
                <q-icon :name="badge.icon" :color="badge.color || 'accent'" size="18px" />
                <span class="alien-font badge-label">{{ badge.label }}</span>
                <q-icon name="share" color="grey-6" size="12px" class="badge-share-icon" />
              </div>
            </div>
            <div v-if="earnedBadges.length > 0" class="alien-font text-grey-6 q-mt-sm" style="font-size: 9px">
              TAP A BADGE TO SHARE IT
            </div>
          </div>
        </q-card>

        <!-- Settings -->
        <div class="text-grey alien-font q-mb-sm" style="font-size: 10px">SETTINGS:</div>
        <q-card class="profile-card q-mb-md">
          <div class="profile-card-body">
            <div class="settings-row">
              <div class="settings-label">
                <q-icon name="volume_up" color="info" size="20px" />
                <span class="alien-font text-white" style="font-size: 11px">SOUND EFFECTS</span>
              </div>
              <q-toggle
                :model-value="settingsStore.soundEnabled"
                @update:model-value="settingsStore.toggleSound()"
                color="accent"
                dark
                dense
              />
            </div>
            <q-separator color="grey-9" class="q-my-sm" />
            <div class="settings-row">
              <div class="settings-label">
                <q-icon name="vibration" color="info" size="20px" />
                <span class="alien-font text-white" style="font-size: 11px">VIBRATION</span>
              </div>
              <q-toggle
                :model-value="settingsStore.vibrationEnabled"
                @update:model-value="settingsStore.toggleVibration()"
                color="accent"
                dark
                dense
              />
            </div>
          </div>
        </q-card>

        <!-- Actions -->
        <q-card class="action-card">
          <div class="action-card-body">
            <q-btn
              flat
              label="RANKING"
              icon="emoji_events"
              color="accent"
              class="alien-font border-btn full-width q-mb-sm"
              @click="goToRanking"
            />
            <q-btn
              flat
              label="LOGOUT"
              icon="logout"
              color="negative"
              class="alien-font border-btn full-width"
              @click="logout"
            />
          </div>
        </q-card>
      </template>
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
  display: flex;
  flex-direction: column;
}

.retro-screen-card {
  background-color: #090a0f;
  border: 2px solid #fff;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.8);
  border-radius: 4px;
}

// Profile card styles
.profile-card {
  background-color: #090a0f;
  border: 2px solid #fff;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.8);
}

.profile-card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 100%);
  border-bottom: 1px solid #222;
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;

  > span:first-child {
    font-size: 10px;
    letter-spacing: 1px;
  }
}

.profile-card-body {
  padding: 16px;
}

.badges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 8px;
}

.badge-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 2px solid #fff;
  border-radius: 4px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.35);
}

.badge-label {
  color: #fff;
  font-size: 10px;
}

.email-row {
  display: flex;
  flex-direction: column;
  gap: 4px;

  span:first-child {
    font-size: 10px;
    letter-spacing: 1px;
  }

  span:last-child {
    font-size: 12px;
  }
}

// Stat card styles
.stat-card {
  background-color: #090a0f;
  border: 2px solid #fff;
  border-radius: 4px;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.8);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100px;
  padding: 10px;
}

// Action card styles
.action-card {
  background-color: #090a0f;
  border: 2px solid #fff;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.8);
}

.action-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 100%);
  border-bottom: 1px solid #222;

  span {
    font-size: 10px;
    letter-spacing: 1px;
  }
}

.action-card-body {
  padding: 12px;
}

.profile-avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.profile-avatar {
  width: 72px;
  height: 72px;
  border: 2px solid #fff;
  border-radius: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-upload-btn {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 24px;
  height: 24px;
  background-color: #fff;
  border: 2px solid #000;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.1);
  }

  .q-icon {
    font-size: 12px;
  }
}

.avatar-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.stat-icon {
  margin-bottom: 6px;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 10px;
  text-transform: uppercase;
}

:deep(.retro-input .q-field__control) {
  border-radius: 0 !important;
  border: 2px solid #fff;
  background-color: rgba(0, 0, 0, 0.5);
}

:deep(.retro-input .q-field__native) {
  color: #fff;
  font-size: 14px;
}

:deep(.retro-input.q-field--outlined .q-field__control:before) {
  border: none;
}

:deep(.retro-input.q-field--outlined.q-field--focused .q-field__control) {
  border-color: #ffd700;
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
}

.user-name {
  font-size: 18px;
  margin-right: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.edit-name-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.name-input {
  width: 100%;
}

.edit-buttons {
  display: flex;
  gap: 6px;
}

.edit-name-btn {
  transition: all 0.2s;
  padding: 4px;
  min-width: 32px;
  margin-left: 4px;

  &:hover {
    background-color: rgba(255, 215, 0, 0.2);
    transform: scale(1.05);
  }
}

.confirm-btn,
.cancel-btn {
  flex: 1;
  padding: 8px 12px;
  font-size: 11px;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  }
}

// --- Weekly Summary ---
.weekly-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.weekly-stat-card {
  background-color: #090a0f;
  border: 2px solid #fff;
  border-radius: 4px;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.8);
  text-align: center;
  padding: 10px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.weekly-stat-val {
  font-size: 18px;
  line-height: 1;
}

// --- Settings ---
.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
}

.settings-label {
  display: flex;
  align-items: center;
  gap: 10px;
}

// --- Badge share icon ---
.badge-chip {
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  position: relative;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  }
}

.badge-share-icon {
  margin-left: auto;
  opacity: 0.4;
}
</style>
