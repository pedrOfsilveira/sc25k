import { defineStore } from 'pinia'

const SETTINGS_KEY = 'retroRun_settings'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    soundEnabled: true,
    vibrationEnabled: true
  }),

  actions: {
    load() {
      try {
        const saved = localStorage.getItem(SETTINGS_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          this.soundEnabled = parsed.soundEnabled ?? true
          this.vibrationEnabled = parsed.vibrationEnabled ?? true
        }
      } catch (_) {
        // ignore
      }
    },

    save() {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({
        soundEnabled: this.soundEnabled,
        vibrationEnabled: this.vibrationEnabled
      }))
    },

    toggleSound() {
      this.soundEnabled = !this.soundEnabled
      this.save()
    },

    toggleVibration() {
      this.vibrationEnabled = !this.vibrationEnabled
      this.save()
    }
  }
})
