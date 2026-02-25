import { defineStore } from "pinia";
import { treinos } from "src/data/treinos.js";
import { supabase } from "boot/supabase";
import { Notify } from "quasar";
import imageCompression from "browser-image-compression";
import {
  fetchCompletedDaysByUser,
  upsertCompletedDay,
  upsertCompletedWeek,
  insertTrainingHistory
} from "src/services/trainingService";
import { useSettingsStore } from "src/stores/settingsStore";

const TRAINING_STATUS = {
  COMPLETED: "COMPLETED",
  CANCELED: "CANCELED"
};

export const useTreinoStore = defineStore("treino", {
  state: () => ({
    treinoAtivo: null,
    passoAtualIndex: 0,
    timer: 0,
    estaRodando: false,
    treinoConcluido: false,
    salvando: false,
    intervalId: null,
    endTime: null,
    wakeLock: null,
    currentWeek: null,
    currentDay: null,
    lastLocalPersistAt: 0,
    completedDays: {}, // { "1": [1, 2, 3], "2": [1] } etc
    lastEarnedXP: 0
  }),

  getters: {
    estruturaAtual: (state) => {
      if (!state.treinoAtivo) return [];
      const dias = state.treinoAtivo.dias;
      const dayIndex = Math.max(0, (state.currentDay || 1) - 1);
      return Array.isArray(dias) && dias[dayIndex] ? dias[dayIndex].estrutura : [];
    },

    passoAtual: (state) => {
      const estrutura = (state.treinoAtivo && state.treinoAtivo.dias)
        ? (state.treinoAtivo.dias[Math.max(0, (state.currentDay || 1) - 1)]?.estrutura || [])
        : (state.treinoAtivo?.estrutura || []);
      return estrutura[state.passoAtualIndex] || null;
    },

    tempoFormatado: (state) => {
      const minutos = Math.floor(state.timer / 60);
      const segundos = state.timer % 60;
      return `${minutos.toString().padStart(2, "0")}:${segundos
        .toString()
        .padStart(2, "0")}`;
    },

    progressoGeral: (state) => {
      const estrutura = (state.treinoAtivo && state.treinoAtivo.dias)
        ? (state.treinoAtivo.dias[Math.max(0, (state.currentDay || 1) - 1)]?.estrutura || [])
        : (state.treinoAtivo?.estrutura || []);
      const totalPassos = estrutura.length || 1;
      return state.passoAtualIndex / totalPassos;
    },

    corAtual: (state) => {
      const estrutura = (state.treinoAtivo && state.treinoAtivo.dias)
        ? (state.treinoAtivo.dias[Math.max(0, (state.currentDay || 1) - 1)]?.estrutura || [])
        : (state.treinoAtivo?.estrutura || []);
      const passo = estrutura[state.passoAtualIndex];
      if (!passo) return "grey";
      if (passo.tipo === "corrida") return "negative";
      if (passo.tipo === "caminhada") return "primary";
      return "warning";
    },
  },

  actions: {
    resetSessionState() {
      const preservedCompleted = { ...this.completedDays };
      const preservedWeek = this.currentWeek;
      this.treinoAtivo = null;
      this.passoAtualIndex = 0;
      this.timer = 0;
      this.estaRodando = false;
      this.treinoConcluido = false;
      this.salvando = false;
      this.intervalId = null;
      this.endTime = null;
      this.wakeLock = null;
      this.currentDay = null;
      this.currentWeek = preservedWeek;
      this.completedDays = preservedCompleted;
      this.lastEarnedXP = 0;
    },
    clearLocalData() {
      try {
        localStorage.removeItem('retroRun_completedDays');
        localStorage.removeItem('retroRun_save');
      } catch (_) {
        // ignore
      }
      this.completedDays = {};
      this.currentWeek = null;
      this.currentDay = null;
    },
    async loadCompletedDaysFromDB() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          this.loadCompletedDays();
          return;
        }

        const data = await fetchCompletedDaysByUser(user.id);

        const aggregated = {};
        (data || []).forEach(row => {
          if (!aggregated[row.week_id]) aggregated[row.week_id] = [];
          if (!aggregated[row.week_id].includes(row.day)) aggregated[row.week_id].push(row.day);
        });
        this.completedDays = aggregated;
        this.saveCompletedDays();
      } catch (e) {
        this.loadCompletedDays();
      }
    },
    loadCompletedDays() {
      const saved = localStorage.getItem('retroRun_completedDays');
      if (saved) {
        try {
          this.completedDays = JSON.parse(saved);
        } catch (e) {
          this.completedDays = {};
        }
      }
    },

    saveCompletedDays() {
      localStorage.setItem('retroRun_completedDays', JSON.stringify(this.completedDays));
    },

    isWeekCompleted(weekId) {
      const days = this.completedDays[weekId] || [];
      return days.length === 3;
    },

    getDayStatus(weekId, day) {
      const days = this.completedDays[weekId] || [];
      return days.includes(day) ? 'completed' : 'available';
    },

    markDayCompleted(weekId, day) {
      if (!this.completedDays[weekId]) {
        this.completedDays[weekId] = [];
      }
      if (!this.completedDays[weekId].includes(day)) {
        this.completedDays[weekId].push(day);
        this.saveCompletedDays();
        this.persistCompletedDay(weekId, day);
        if (this.isWeekCompleted(weekId)) {
          this.persistCompletedWeek(weekId);
        }
      }
    },

    async persistCompletedDay(weekId, day) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await upsertCompletedDay({
          user_id: user.id,
          week_id: weekId,
          day: day,
          completed_at: new Date().toISOString()
        });
      } catch (e) {
        // silent fail, stays in localStorage
      }
    },

    async persistCompletedWeek(weekId) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await upsertCompletedWeek({
          user_id: user.id,
          week_id: weekId,
          completed_at: new Date().toISOString()
        });
      } catch (e) {
        // silent fail
      }
    },

    salvarEstadoLocal() {
      const estado = {
        treinoId: this.treinoAtivo?.id,
        treinoConcluido: this.treinoConcluido,
        currentWeek: this.currentWeek,
        currentDay: this.currentDay,
        passoAtualIndex: this.passoAtualIndex,
        timer: this.timer,
        // We intentionally restore as paused to avoid time drift on refresh
        estaRodando: this.estaRodando,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('retroRun_save', JSON.stringify(estado));
    },

    limparEstadoLocal() {
      localStorage.removeItem('retroRun_save');
    },

    verificarCrash() {
      this.loadCompletedDays();
      const save = localStorage.getItem('retroRun_save');
      if (save) {
        try {
          const dados = JSON.parse(save);
          if (!dados?.treinoId) return;

          // Restore finished run (awaiting evidence)
          if (dados.treinoConcluido) {
            this.carregarTreino(dados.treinoId, dados.currentDay || 1);
            this.treinoConcluido = true;
            this.timer = 0;
            this.passoAtualIndex = this.estruturaAtual.length - 1;

            Notify.create({
              message: 'GAME RESTORED! UPLOAD YOUR PHOTO.',
              color: 'warning',
              icon: 'restore',
              position: 'top',
              classes: 'retro-font'
            });
            return;
          }

          // Restore in-progress run (paused)
          this.carregarTreino(dados.treinoId, dados.currentDay || 1);

          const estrutura = this.estruturaAtual;
          const maxIndex = Math.max(0, (estrutura?.length || 1) - 1);
          const restoredIndex = Math.max(0, Math.min(Number(dados.passoAtualIndex ?? 0), maxIndex));
          this.passoAtualIndex = restoredIndex;
          this.timer = Math.max(0, Number(dados.timer ?? this.timer) || 0);
          this.treinoConcluido = false;

          // Always restore paused to avoid skipping steps on refresh
          this.estaRodando = false;
          this.endTime = null;
          if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
          }

          Notify.create({
            message: 'RUN RESTORED! TAP PLAY TO CONTINUE.',
            color: 'info',
            icon: 'restore',
            position: 'top',
            classes: 'retro-font'
          });
        } catch (e) {
          this.limparEstadoLocal();
        }
      }
    },

    carregarTreino(id, day = 1) {
      const treinoSelecionado = treinos.find((t) => t.id === id);
      if (treinoSelecionado) {
        this.treinoAtivo = treinoSelecionado;
        this.currentWeek = id;
        this.currentDay = day;
        this.passoAtualIndex = 0;
        this.treinoConcluido = false;
        const estrutura = (treinoSelecionado.dias?.[Math.max(0, day-1)]?.estrutura) || [];
        this.timer = estrutura[0]?.tempo || 0;
        this.estaRodando = false;
        this.endTime = null;
        this.salvarEstadoLocal();
      }
    },

    async iniciarTimer() {
      if (this.estaRodando) return;

      this.estaRodando = true;

      try {
        if ('wakeLock' in navigator) {
          this.wakeLock = await navigator.wakeLock.request('screen');
        }
      } catch (err) {
        console.log("WakeLock indisponível");
      }

      const agora = Date.now();
      this.endTime = agora + (this.timer * 1000);

      this.salvarEstadoLocal();

      this.intervalId = setInterval(() => {
        this.tick();
      }, 200);
    },

    async pausarTimer() {
      this.estaRodando = false;
      if (this.intervalId) clearInterval(this.intervalId);
      this.salvarEstadoLocal();

      if (this.wakeLock) {
        try {
          await this.wakeLock.release();
          this.wakeLock = null;
        } catch (e) { }
      }
    },

    tick() {
      const agora = Date.now();
      const segundosRestantes = Math.ceil((this.endTime - agora) / 1000);

      if (segundosRestantes >= 0) {
        this.timer = segundosRestantes;

        // Persist at most once per second
        if (!this.lastLocalPersistAt || (agora - this.lastLocalPersistAt) >= 1000) {
          this.lastLocalPersistAt = agora;
          this.salvarEstadoLocal();
        }
      } else {
        this.proximoPasso();
      }
    },

    proximoPasso() {
      clearInterval(this.intervalId);

      const estrutura = this.estruturaAtual;
      if (this.passoAtualIndex < estrutura.length - 1) {
        this.tocarSomAlert();
        this.vibrar([100, 50, 100]);
        this.passoAtualIndex++;

        this.timer = this.passoAtual.tempo;

        const agora = Date.now();
        this.endTime = agora + (this.timer * 1000);

        this.salvarEstadoLocal();

        this.intervalId = setInterval(() => {
          this.tick();
        }, 200);

      } else {
        this.finalizarTreino();
      }
    },

    async cancelarTreino() {
      this.pausarTimer();
      // If quit in the first cycle (warmup + first run), ignore the run
      if (this.passoAtualIndex <= 1) {
        Notify.create({
          message: 'RUN DISREGARDED (quit too early).',
          color: 'warning',
          icon: 'cancel',
          position: 'top',
          classes: 'retro-font'
        });
      } else {
        await this.registrarHistorico(TRAINING_STATUS.CANCELED);
      }
      this.limparEstadoLocal();
      this.resetSessionState();
    },

    finalizarTreino() {
      this.pausarTimer();
      this.treinoConcluido = true;
      this.tocarSomVitoria();
      this.vibrar([200, 100, 200, 100, 400]);
      this.salvarEstadoLocal();
    },

    async registrarHistorico(status, fotoUrl = null) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const totalPassos = this.estruturaAtual.length;
        const passosFeitos = this.passoAtualIndex + 1;
        const stringProgresso = `${passosFeitos}/${totalPassos}`;

        let pontos = 0;
        if (status === TRAINING_STATUS.COMPLETED) {
          pontos = 1000 + Math.floor(Math.random() * 500);
          // If this day was already completed, give 50% XP (repeat run)
          const alreadyDone = (this.completedDays[this.currentWeek] || []).includes(this.currentDay);
          if (alreadyDone) {
            pontos = Math.floor(pontos * 0.5);
          }
          // Mark day as completed
          this.markDayCompleted(this.currentWeek, this.currentDay);
        } else {
          pontos = Math.floor((passosFeitos / totalPassos) * 500);
        }
        this.lastEarnedXP = pontos;

        await insertTrainingHistory({
          user_id: user.id,
          treino_id: this.treinoAtivo.id,
          treino_day: this.currentDay,
          pontuacao: pontos,
          foto_url: fotoUrl,
          status: status,
          progresso: stringProgresso
        });

        if (status === TRAINING_STATUS.CANCELED) {
           Notify.create({
            message: `GAME OVER. SAVED ${pontos} PTS.`,
            color: "warning",
            position: "top",
            classes: "retro-font"
          });
        }

      } catch (err) {
        console.error(err);
        Notify.create({ message: "Save Failed", color: "negative" });
      }
    },

    async enviarComprovante(arquivoFoto) {
      this.salvando = true;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Sessão perdida.");

        const options = {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 800,
          useWebWorker: false,
          fileType: 'image/jpeg',
          initialQuality: 0.6
        };

        const compressedFile = await imageCompression(arquivoFoto, options);
        const nomeArquivo = `${user.id}/${Date.now()}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from("comprovantes")
          .upload(nomeArquivo, compressedFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: 'image/jpeg'
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("comprovantes")
          .getPublicUrl(nomeArquivo);

        await this.registrarHistorico(TRAINING_STATUS.COMPLETED, publicUrl);

        Notify.create({
          message: `MISSION COMPLETE!`,
          color: "positive",
          icon: "emoji_events",
          position: "top",
          classes: "retro-font",
          timeout: 4000,
        });

        this.limparEstadoLocal();
        this.resetSessionState();

      } catch (error) {
        console.error(error);
        Notify.create({
          message: "ERRO: " + error.message,
          color: "negative",
          position: "top",
        });
      } finally {
        this.salvando = false;
      }
    },

    vibrar(pattern) {
      try {
        const settings = useSettingsStore();
        if (settings.vibrationEnabled && navigator.vibrate) {
          navigator.vibrate(pattern);
        }
      } catch (_) {
        // ignore
      }
    },

    tocarSomAlert() {
      try {
        const settings = useSettingsStore();
        if (!settings.soundEnabled) return;

        const context = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = context.createOscillator();
        const gain = context.createGain();

        oscillator.type = "square";
        oscillator.frequency.setValueAtTime(440, context.currentTime);
        gain.gain.setValueAtTime(0.1, context.currentTime);

        oscillator.connect(gain);
        gain.connect(context.destination);

        oscillator.start();
        oscillator.stop(context.currentTime + 0.15);
      } catch (e) {
        console.error("Audio Error", e);
      }
    },

    tocarSomVitoria() {
      try {
        const settings = useSettingsStore();
        if (!settings.soundEnabled) return;

        const context = new (window.AudioContext || window.webkitAudioContext)();
        const now = context.currentTime;

        // Richer 8-bit victory fanfare: two arpeggiated phrases
        const phrase1 = [
          { freq: 523.25, time: 0,    dur: 0.12 }, // C5
          { freq: 659.25, time: 0.12, dur: 0.12 }, // E5
          { freq: 783.99, time: 0.24, dur: 0.12 }, // G5
          { freq: 1046.5, time: 0.36, dur: 0.25 }, // C6 (hold)
        ];
        const phrase2 = [
          { freq: 587.33, time: 0.70, dur: 0.10 }, // D5
          { freq: 739.99, time: 0.80, dur: 0.10 }, // F#5
          { freq: 880.00, time: 0.90, dur: 0.10 }, // A5
          { freq: 1174.7, time: 1.00, dur: 0.35 }, // D6 (hold)
        ];
        const notes = [...phrase1, ...phrase2];

        notes.forEach(({ freq, time, dur }) => {
          const osc = context.createOscillator();
          const gain = context.createGain();
          osc.type = "square";
          osc.frequency.setValueAtTime(freq, now + time);

          gain.gain.setValueAtTime(0.08, now + time);
          gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur + 0.15);

          osc.connect(gain);
          gain.connect(context.destination);

          osc.start(now + time);
          osc.stop(now + time + dur + 0.2);
        });

        // Add a bass note for weight
        const bass = context.createOscillator();
        const bassGain = context.createGain();
        bass.type = "triangle";
        bass.frequency.setValueAtTime(130.81, now + 0.36); // C3
        bassGain.gain.setValueAtTime(0.06, now + 0.36);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
        bass.connect(bassGain);
        bassGain.connect(context.destination);
        bass.start(now + 0.36);
        bass.stop(now + 1.6);
      } catch (e) {
        console.error("Audio Error", e);
      }
    },
  },
});
