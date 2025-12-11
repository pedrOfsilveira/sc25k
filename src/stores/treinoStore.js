import { defineStore } from "pinia";
import { treinos } from "src/data/treinos.js";
import { supabase } from "boot/supabase";
import { Notify } from "quasar";
import imageCompression from "browser-image-compression";

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
    completedDays: {} // { "1": [1, 2, 3], "2": [1] } etc
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

        const { data, error } = await supabase
          .from('completed_days')
          .select('week_id, day')
          .eq('user_id', user.id);

        if (error) {
          this.loadCompletedDays();
          return;
        }

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
        await supabase
          .from('completed_days')
          .upsert({
            user_id: user.id,
            week_id: weekId,
            day: day,
            completed_at: new Date().toISOString()
          }, { onConflict: 'user_id,week_id,day' });
      } catch (e) {
        // silent fail, stays in localStorage
      }
    },

    async persistCompletedWeek(weekId) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await supabase
          .from('completed_weeks')
          .upsert({
            user_id: user.id,
            week_id: weekId,
            completed_at: new Date().toISOString()
          }, { onConflict: 'user_id,week_id' });
      } catch (e) {
        // silent fail
      }
    },

    salvarEstadoLocal() {
      const estado = {
        treinoId: this.treinoAtivo?.id,
        treinoConcluido: this.treinoConcluido,
        currentWeek: this.currentWeek,
        currentDay: this.currentDay
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
          if (dados.treinoId && dados.treinoConcluido) {
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
          }
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

      this.intervalId = setInterval(() => {
        this.tick();
      }, 200);
    },

    async pausarTimer() {
      this.estaRodando = false;
      if (this.intervalId) clearInterval(this.intervalId);

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
      } else {
        this.proximoPasso();
      }
    },

    proximoPasso() {
      clearInterval(this.intervalId);

      const estrutura = this.estruturaAtual;
      if (this.passoAtualIndex < estrutura.length - 1) {
        this.tocarSomAlert();
        this.passoAtualIndex++;

        this.timer = this.passoAtual.tempo;

        const agora = Date.now();
        this.endTime = agora + (this.timer * 1000);

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
        await this.registrarHistorico('CANCELADO');
      }
      this.limparEstadoLocal();
      this.resetSessionState();
    },

    finalizarTreino() {
      this.pausarTimer();
      this.treinoConcluido = true;
      this.tocarSomVitoria();
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
        if (status === 'CONCLUÍDO') {
          pontos = 1000 + Math.floor(Math.random() * 500);
          // Mark day as completed
          this.markDayCompleted(this.currentWeek, this.currentDay);
        } else {
          pontos = Math.floor((passosFeitos / totalPassos) * 500);
        }

        const { error } = await supabase.from("historico_treinos").insert({
          user_id: user.id,
          treino_id: this.treinoAtivo.id,
          treino_day: this.currentDay,
          pontuacao: pontos,
          foto_url: fotoUrl,
          status: status,
          progresso: stringProgresso
        });

        if (error) throw error;

        if (status === 'CANCELADO') {
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

        await this.registrarHistorico('CONCLUÍDO', publicUrl);

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

    tocarSomAlert() {
      try {
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
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const now = context.currentTime;
        const notas = [523.25, 659.25, 783.99, 1046.5];

        notas.forEach((freq, i) => {
          const osc = context.createOscillator();
          const gain = context.createGain();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(freq, now + i * 0.15);

          gain.gain.setValueAtTime(0.1, now + i * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.4);

          osc.connect(gain);
          gain.connect(context.destination);

          osc.start(now + i * 0.15);
          osc.stop(now + i * 0.15 + 0.5);
        });
      } catch (e) {
        console.error("Audio Error", e);
      }
    },
  },
});
