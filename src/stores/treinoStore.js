// src/stores/treinoStore.js

import { defineStore } from "pinia";
import { treinos } from "src/data/treinos.js";
import { supabase } from "boot/supabase";
import { Notify } from "quasar";

export const useTreinoStore = defineStore("treino", {
  state: () => ({
    // Dados do Treino Atual
    treinoAtivo: null, // Objeto do treino (Semana 1, etc)
    passoAtualIndex: 0, // Índice do array (0 = Aquecimento, 1 = Corrida...)
    timer: 0, // Contagem regressiva em segundos
    estaRodando: false, // Timer ligado?
    treinoConcluido: false, // Chegou ao fim e espera a foto?
    intervalId: null, // ID do setInterval
    salvando: false, // Loading durante o upload
  }),

  getters: {
    // Retorna o passo atual (ex: { tipo: 'corrida', texto: 'CORRER', tempo: 60 })
    passoAtual: (state) => {
      if (!state.treinoAtivo) return null;
      return state.treinoAtivo.estrutura[state.passoAtualIndex];
    },

    // Formata o tempo "00:00"
    tempoFormatado: (state) => {
      const minutos = Math.floor(state.timer / 60);
      const segundos = state.timer % 60;
      return `${minutos.toString().padStart(2, "0")}:${segundos
        .toString()
        .padStart(2, "0")}`;
    },

    // Barra de progresso (0.0 a 1.0)
    progressoGeral: (state) => {
      if (!state.treinoAtivo) return 0;
      const totalPassos = state.treinoAtivo.estrutura.length;
      return state.passoAtualIndex / totalPassos;
    },

    // Cores baseadas no tipo de passo
    corAtual: (state) => {
      const passo = state.treinoAtivo?.estrutura[state.passoAtualIndex];
      if (!passo) return "grey";
      if (passo.tipo === "corrida") return "negative"; // Vermelho
      if (passo.tipo === "caminhada") return "primary"; // Azul
      return "warning"; // Amarelo (Aquecimento/Fim)
    },
  },

  actions: {
    // --- 1. CONTROLO DO TREINO ---

    carregarTreino(id) {
      const treinoSelecionado = treinos.find((t) => t.id === id);
      if (treinoSelecionado) {
        this.treinoAtivo = treinoSelecionado;
        this.passoAtualIndex = 0;
        this.treinoConcluido = false;
        this.timer = treinoSelecionado.estrutura[0].tempo;
        this.estaRodando = false;
      }
    },

    iniciarTimer() {
      if (this.estaRodando) return;
      this.estaRodando = true;
      // Loop de 1 segundo
      this.intervalId = setInterval(() => {
        this.tick();
      }, 1000);
    },

    pausarTimer() {
      this.estaRodando = false;
      if (this.intervalId) clearInterval(this.intervalId);
    },

    tick() {
      if (this.timer > 0) {
        this.timer--;
      } else {
        this.proximoPasso();
      }
    },

    proximoPasso() {
      // Se não for o último passo, avança
      if (this.passoAtualIndex < this.treinoAtivo.estrutura.length - 1) {
        this.tocarSomAlert(); // Bip de mudança
        this.passoAtualIndex++;
        this.timer = this.passoAtual.tempo;
      } else {
        // Se for o último, acaba
        this.finalizarTreino();
      }
    },

    // --- 2. FINALIZAÇÃO E UPLOAD ---

    finalizarTreino() {
      this.pausarTimer();
      this.treinoConcluido = true; // Ativa a tela de "Tirar Foto"
      this.tocarSomVitoria();
    },

    async enviarComprovante(arquivoFoto) {
      this.salvando = true;

      // Gamificação: Pontos base + Bônus
      const pontos = 1000 + Math.floor(Math.random() * 500);

      try {
        // A. Verificar Usuário
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Sessão perdida. Faça login novamente.");

        // B. Upload da Foto para o Storage
        // Cria nome único: ID_USER / TIMESTAMP.jpg
        const nomeArquivo = `${user.id}/${Date.now()}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from("comprovantes") // Nome do bucket que criamos
          .upload(nomeArquivo, arquivoFoto, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // C. Pegar URL Pública da foto
        const {
          data: { publicUrl },
        } = supabase.storage.from("comprovantes").getPublicUrl(nomeArquivo);

        // D. Salvar Registro no Banco de Dados
        const { error: dbError } = await supabase
          .from("historico_treinos")
          .insert({
            user_id: user.id,
            treino_id: this.treinoAtivo.id,
            pontuacao: pontos,
            foto_url: publicUrl, // Salva o link da foto
          });

        if (dbError) throw dbError;

        // Sucesso!
        Notify.create({
          message: `MISSION COMPLETE! +${pontos} PTS`,
          color: "positive",
          icon: "emoji_events",
          position: "top",
          classes: "retro-font",
          timeout: 4000,
        });

        // Reseta o estado para o menu inicial
        this.$reset();
      } catch (error) {
        console.error(error);
        Notify.create({
          message: "ERRO AO SALVAR: " + error.message,
          color: "negative",
          position: "top",
        });
      } finally {
        this.salvando = false;
      }
    },

    // --- 3. EFEITOS SONOROS (AudioContext) ---

    tocarSomAlert() {
      try {
        const context = new (window.AudioContext ||
          window.webkitAudioContext)();
        const oscillator = context.createOscillator();
        const gain = context.createGain();

        oscillator.type = "square"; // Onda quadrada (som 8-bit clássico)
        oscillator.frequency.setValueAtTime(440, context.currentTime); // A4

        gain.gain.setValueAtTime(0.1, context.currentTime); // Volume baixo

        oscillator.connect(gain);
        gain.connect(context.destination);

        oscillator.start();
        oscillator.stop(context.currentTime + 0.15); // Bip curto
      } catch (e) {
        console.error("Erro de áudio", e);
      }
    },

    tocarSomVitoria() {
      try {
        const context = new (window.AudioContext ||
          window.webkitAudioContext)();
        const now = context.currentTime;

        // Arpejo de Vitória (C Major: Dó, Mi, Sol, Dó)
        const notas = [523.25, 659.25, 783.99, 1046.5];

        notas.forEach((freq, i) => {
          const osc = context.createOscillator();
          const gain = context.createGain();

          osc.type = "sawtooth"; // Onda dente de serra (mais "épico")
          osc.frequency.setValueAtTime(freq, now + i * 0.15);

          // Envelope de volume (Fade out rápido)
          gain.gain.setValueAtTime(0.1, now + i * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.4);

          osc.connect(gain);
          gain.connect(context.destination);

          osc.start(now + i * 0.15);
          osc.stop(now + i * 0.15 + 0.5);
        });
      } catch (e) {
        console.error("Erro de áudio", e);
      }
    },
  },
});
