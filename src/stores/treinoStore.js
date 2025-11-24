// src/stores/treinoStore.js

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
    intervalId: null,
    salvando: false,
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
    // --- FUNÇÕES DE PERSISTÊNCIA (SAVE GAME) ---

    // Salva o estado atual no LocalStorage do navegador
    salvarEstadoLocal() {
      const estado = {
        treinoId: this.treinoAtivo?.id,
        treinoConcluido: this.treinoConcluido
      };
      localStorage.setItem('retroRun_save', JSON.stringify(estado));
    },

    // Limpa o save quando tudo termina bem
    limparEstadoLocal() {
      localStorage.removeItem('retroRun_save');
    },

    // Tenta recuperar se houve um crash
    verificarCrash() {
      const save = localStorage.getItem('retroRun_save');
      if (save) {
        const dados = JSON.parse(save);
        // Se tinha um treino concluído pendente de foto
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
      }
    },

    // --- CONTROLO DO TREINO ---

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
      if (this.passoAtualIndex < this.treinoAtivo.estrutura.length - 1) {
        this.tocarSomAlert();
        this.passoAtualIndex++;
        this.timer = this.passoAtual.tempo;
      } else {
        this.finalizarTreino();
      }
    },

    finalizarTreino() {
      this.pausarTimer();
      this.treinoConcluido = true;
      this.tocarSomVitoria();

      // AQUI: Salvamos o jogo caso o navegador crashe na hora da foto
      this.salvarEstadoLocal();
    },

    // --- UPLOAD COM PROTEÇÃO DE MEMÓRIA ---

    async enviarComprovante(arquivoFoto) {
      this.salvando = true;
      const pontos = 1000 + Math.floor(Math.random() * 500);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Sessão perdida. Faça login novamente.");

        // CONFIGURAÇÃO LEVE PARA NÃO CRASHAR
        const options = {
          maxSizeMB: 0.5,         // 500KB máx
          maxWidthOrHeight: 800,  // Reduz resolução (20MP -> ~0.5MP)
          useWebWorker: false,    // Desliga workers para economizar RAM
          fileType: 'image/jpeg',
          initialQuality: 0.6
        };

        console.log("Comprimindo...");
        const compressedFile = await imageCompression(arquivoFoto, options);
        console.log("Comprimido com sucesso!");

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

        const { error: dbError } = await supabase
          .from("historico_treinos")
          .insert({
            user_id: user.id,
            treino_id: this.treinoAtivo.id,
            pontuacao: pontos,
            foto_url: publicUrl,
          });

        if (dbError) throw dbError;

        Notify.create({
          message: `MISSION COMPLETE! +${pontos} PTS`,
          color: "positive",
          icon: "emoji_events",
          position: "top",
          classes: "retro-font",
          timeout: 4000,
        });

        // TUDO CERTO? Limpa o save de segurança
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

    // --- SONS ---
    tocarSomAlert() { /* ... igual ... */ },
    tocarSomVitoria() { /* ... igual ... */ },
  },
});
