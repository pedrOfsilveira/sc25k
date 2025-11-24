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
    wakeLock: null
  }),

  getters: {
    passoAtual: (state) => {
      if (!state.treinoAtivo) return null;
      return state.treinoAtivo.estrutura[state.passoAtualIndex];
    },

    tempoFormatado: (state) => {
      const minutos = Math.floor(state.timer / 60);
      const segundos = state.timer % 60;
      return `${minutos.toString().padStart(2, "0")}:${segundos
        .toString()
        .padStart(2, "0")}`;
    },

    progressoGeral: (state) => {
      if (!state.treinoAtivo) return 0;
      const totalPassos = state.treinoAtivo.estrutura.length;
      return state.passoAtualIndex / totalPassos;
    },

    corAtual: (state) => {
      const passo = state.treinoAtivo?.estrutura[state.passoAtualIndex];
      if (!passo) return "grey";
      if (passo.tipo === "corrida") return "negative";
      if (passo.tipo === "caminhada") return "primary";
      return "warning";
    },
  },

  actions: {
    salvarEstadoLocal() {
      const estado = {
        treinoId: this.treinoAtivo?.id,
        treinoConcluido: this.treinoConcluido
      };
      localStorage.setItem('retroRun_save', JSON.stringify(estado));
    },

    limparEstadoLocal() {
      localStorage.removeItem('retroRun_save');
    },

    verificarCrash() {
      const save = localStorage.getItem('retroRun_save');
      if (save) {
        try {
          const dados = JSON.parse(save);
          if (dados.treinoId && dados.treinoConcluido) {
            this.carregarTreino(dados.treinoId);
            this.treinoConcluido = true;
            this.timer = 0;
            this.passoAtualIndex = this.treinoAtivo.estrutura.length - 1;

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

    carregarTreino(id) {
      const treinoSelecionado = treinos.find((t) => t.id === id);
      if (treinoSelecionado) {
        this.treinoAtivo = treinoSelecionado;
        this.passoAtualIndex = 0;
        this.treinoConcluido = false;
        this.timer = treinoSelecionado.estrutura[0].tempo;
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

      if (this.passoAtualIndex < this.treinoAtivo.estrutura.length - 1) {
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
      await this.registrarHistorico('CANCELADO');
      this.limparEstadoLocal();
      this.$reset();
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

        const totalPassos = this.treinoAtivo.estrutura.length;
        const passosFeitos = this.passoAtualIndex + 1;
        const stringProgresso = `${passosFeitos}/${totalPassos}`;

        let pontos = 0;
        if (status === 'CONCLUÍDO') {
          pontos = 1000 + Math.floor(Math.random() * 500);
        } else {
          pontos = Math.floor((passosFeitos / totalPassos) * 500);
        }

        const { error } = await supabase.from("historico_treinos").insert({
          user_id: user.id,
          treino_id: this.treinoAtivo.id,
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
        this.$reset();

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
