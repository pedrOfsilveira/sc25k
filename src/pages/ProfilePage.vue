<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from 'boot/supabase'
import { useRouter } from 'vue-router'
import { Notify } from 'quasar'

const router = useRouter()
const user = ref(null)
const name = ref('')
const email = ref('')
const avatarUrl = ref('')
const editingName = ref(false)
const newName = ref('')
const loading = ref(true)
const uploadingAvatar = ref(false)

const stats = ref({
  totalRuns: 0,
  completedRuns: 0,
  totalXP: 0,
  itemsCreated: 0,
  itemsBought: 0
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

    user.value = currentUser
    name.value = currentUser.user_metadata?.name || currentUser.email
    email.value = currentUser.email
    avatarUrl.value = currentUser.user_metadata?.avatar_url || ''

    // Get training stats
    const { data: historico } = await supabase
      .from('historico_treinos')
      .select('*')
      .eq('user_id', currentUser.id)

    if (historico) {
      stats.value.totalRuns = historico.length
      stats.value.completedRuns = historico.filter(h => h.status !== 'CANCELADO').length
      stats.value.totalXP = historico.reduce((sum, h) => sum + (h.pontuacao || 0), 0)
    }

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
  if (!newName.value.trim()) {
    Notify.create({ message: 'Name cannot be empty', color: 'warning' })
    return
  }

  try {
    const { error } = await supabase.auth.updateUser({
      data: { name: newName.value.trim() }
    })

    if (error) throw error

    name.value = newName.value.trim()
    editingName.value = false

    Notify.create({
      message: 'NAME UPDATED!',
      color: 'positive',
      icon: 'check_circle',
      classes: 'snes-font'
    })
  } catch (error) {
    console.error('Error updating name:', error)
    Notify.create({ message: 'Failed to update name', color: 'negative' })
  }
}

const uploadAvatar = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    Notify.create({ message: 'Please select an image file', color: 'warning' })
    return
  }

  if (file.size > 2 * 1024 * 1024) {
    Notify.create({ message: 'Image must be less than 2MB', color: 'warning' })
    return
  }

  uploadingAvatar.value = true

  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.value.id}-${Date.now()}.${fileExt}`
    const filePath = `${fileName}` // Simplified path - no subfolder

    // Check if bucket exists and try to upload
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
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
    const { error: updateError } = await supabase.auth.updateUser({
      data: { avatar_url: urlData.publicUrl }
    })

    if (updateError) {
      console.error('Update error details:', updateError)
      throw new Error(`Update failed: ${updateError.message}`)
    }

    avatarUrl.value = urlData.publicUrl

    Notify.create({
      message: 'AVATAR UPDATED!',
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
  router.push('/login')
}
</script>

<template>
  <q-page class="page-container q-pa-md">
    <div class="star-background">
      <div id="stars"></div>
      <div id="stars2"></div>
      <div id="stars3"></div>
    </div>

    <div class="content-wrapper q-px-md">
      <div class="text-center q-mb-md">
        <h2 class="text-h4 star-font text-accent snes-blink" style="text-shadow: 4px 4px 0 #000; margin-bottom: 10px;">
          PROFILE
        </h2>
      </div>

      <div v-if="loading" class="text-center text-white alien-font snes-blink q-mt-xl">
        LOADING DATA...
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

        <!-- Actions -->
        <q-card class="action-card">
          <div class="action-card-body">
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
@function multiple-box-shadow($n) {
  $value: "#{random(2000)}px #{random(2000)}px #FFF";
  @for $i from 2 through $n {
    $value: "#{$value} , #{random(2000)}px #{random(2000)}px #FFF";
  }
  @return unquote($value);
}

$shadows-small: multiple-box-shadow(700);
$shadows-medium: multiple-box-shadow(200);
$shadows-big: multiple-box-shadow(100);

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

.star-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%);
  z-index: 0;
  overflow: hidden;
}

#stars {
  width: 1px;
  height: 1px;
  background: transparent;
  box-shadow: $shadows-small;
  animation: animStar 50s linear infinite;
  &:after {
    content: " ";
    position: absolute;
    top: 2000px;
    width: 1px;
    height: 1px;
    background: transparent;
    box-shadow: $shadows-small;
  }
}

#stars2 {
  width: 2px;
  height: 2px;
  background: transparent;
  box-shadow: $shadows-medium;
  animation: animStar 100s linear infinite;
  &:after {
    content: " ";
    position: absolute;
    top: 2000px;
    width: 2px;
    height: 2px;
    background: transparent;
    box-shadow: $shadows-medium;
  }
}

#stars3 {
  width: 3px;
  height: 3px;
  background: transparent;
  box-shadow: $shadows-big;
  animation: animStar 150s linear infinite;
  &:after {
    content: " ";
    position: absolute;
    top: 2000px;
    width: 3px;
    height: 3px;
    background: transparent;
    box-shadow: $shadows-big;
  }
}

@keyframes animStar {
  from { transform: translateY(0px); }
  to { transform: translateY(-2000px); }
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

.border-btn {
  border: 2px solid currentColor;
  border-radius: 0;
}

.snes-blink {
  animation: retro-blink 2s infinite;
}

@keyframes retro-blink {
  0%, 4% { opacity: 1; }
  5%, 9% { opacity: 0; }
  10%, 14% { opacity: 1; }
  15%, 19% { opacity: 0; }
  20%, 24% { opacity: 1; }
  25%, 29% { opacity: 0; }
  30%, 100% { opacity: 1; }
}
</style>
