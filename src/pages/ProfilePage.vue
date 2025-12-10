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
        <h2 class="text-h4 street-font text-yellow snes-blink" style="text-shadow: 4px 4px 0 #000; margin-bottom: 10px;">
          PROFILE
        </h2>
      </div>

      <div v-if="loading" class="text-center text-white snes-font snes-blink q-mt-xl">
        LOADING DATA...
      </div>

      <template v-else>
        <!-- User Info Card -->
        <q-card class="retro-screen-card q-pa-md q-mb-md">
          <div class="row items-center q-mb-md">
            <div class="col-auto q-mr-md">
              <div class="profile-avatar-wrapper">
                <div class="profile-avatar">
                  <img v-if="avatarUrl" :src="avatarUrl" class="avatar-img" />
                  <q-icon v-else name="person" color="yellow" size="48px" />
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
                <q-spinner v-if="uploadingAvatar" color="yellow" size="sm" class="avatar-spinner" />
              </div>
            </div>
            <div class="col">
              <div v-if="!editingName" class="row items-center">
                <div class="text-h6 text-yellow snes-font">{{ name }}</div>
                <q-btn
                  flat
                  dense
                  round
                  icon="edit"
                  color="grey-5"
                  size="sm"
                  class="q-ml-sm"
                  @click="startEditingName"
                />
              </div>
              <div v-else class="row items-center q-gutter-x-sm">
                <q-input
                  v-model="newName"
                  dark
                  outlined
                  dense
                  class="retro-input snes-font"
                  color="yellow"
                  style="max-width: 200px;"
                />
                <q-btn
                  flat
                  dense
                  round
                  icon="check"
                  color="green"
                  size="sm"
                  @click="updateName"
                />
                <q-btn
                  flat
                  dense
                  round
                  icon="close"
                  color="red"
                  size="sm"
                  @click="editingName = false"
                />
              </div>
              <div class="text-grey-5 snes-font" style="font-size: 10px; margin-top: 4px;">
                {{ email }}
              </div>
            </div>
          </div>
        </q-card>

        <!-- Stats Grid -->
        <div class="stats-grid q-mb-md">
          <div class="stat-card retro-screen-card q-pa-md">
            <div class="stat-icon">
              <q-icon name="directions_run" color="cyan" size="32px" />
            </div>
            <div class="stat-value text-cyan snes-font">{{ stats.totalRuns }}</div>
            <div class="stat-label text-grey-5 snes-font">TOTAL RUNS</div>
          </div>

          <div class="stat-card retro-screen-card q-pa-md">
            <div class="stat-icon">
              <q-icon name="check_circle" color="green" size="32px" />
            </div>
            <div class="stat-value text-green snes-font">{{ stats.completedRuns }}</div>
            <div class="stat-label text-grey-5 snes-font">COMPLETED</div>
          </div>

          <div class="stat-card retro-screen-card q-pa-md">
            <div class="stat-icon">
              <q-icon name="stars" color="yellow" size="32px" />
            </div>
            <div class="stat-value text-yellow snes-font">{{ stats.totalXP }}</div>
            <div class="stat-label text-grey-5 snes-font">TOTAL XP</div>
          </div>

          <div class="stat-card retro-screen-card q-pa-md">
            <div class="stat-icon">
              <q-icon name="shopping_bag" color="purple" size="32px" />
            </div>
            <div class="stat-value text-purple snes-font">{{ stats.itemsCreated }}</div>
            <div class="stat-label text-grey-5 snes-font">ITEMS LISTED</div>
          </div>

          <div class="stat-card retro-screen-card q-pa-md">
            <div class="stat-icon">
              <q-icon name="shopping_cart" color="orange" size="32px" />
            </div>
            <div class="stat-value text-orange snes-font">{{ stats.itemsBought }}</div>
            <div class="stat-label text-grey-5 snes-font">ITEMS SOLD</div>
          </div>

          <div class="stat-card retro-screen-card q-pa-md">
            <div class="stat-icon">
              <q-icon name="percent" color="warning" size="32px" />
            </div>
            <div class="stat-value text-warning snes-font">
              {{ stats.totalRuns > 0 ? Math.round((stats.completedRuns / stats.totalRuns) * 100) : 0 }}%
            </div>
            <div class="stat-label text-grey-5 snes-font">SUCCESS RATE</div>
          </div>
        </div>

        <!-- Actions -->
        <q-card class="retro-screen-card q-pa-md">
          <div class="text-white snes-font q-mb-md text-center" style="font-size: 12px;">
            ACTIONS
          </div>

          <q-btn
            flat
            label="LOGOUT"
            icon="logout"
            color="red"
            class="snes-font border-btn full-width"
            @click="logout"
          />
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

.profile-avatar-wrapper {
  position: relative;
}

.profile-avatar {
  width: 80px;
  height: 80px;
  border: 2px solid #fff;
  border-radius: 8px;
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
  width: 28px;
  height: 28px;
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
  gap: 12px;
}

.stat-card {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 120px;
}

.stat-icon {
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 9px;
  text-transform: uppercase;
}

:deep(.retro-input .q-field__control) {
  border-radius: 0 !important;
  border: 2px solid #555;
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
