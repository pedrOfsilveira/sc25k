// src/data/treinos.js

// Exemplo da Semana 1
export const treinos = [
  {
    id: 1,
    titulo: "Semana 1 - O Começo", // Nível 1
    descricao: "Aquecimento para a batalha",
    estrutura: [
      { tipo: "aquecimento", tempo: 10, texto: "🔥 AQUECER" }, // 5 min
      { tipo: "corrida", tempo: 5, texto: "🏃 CORRER" }, // 1 min
      { tipo: "caminhada", tempo: 1, texto: "🚶 CAMINHAR" }, // 1.5 min
      // ... repete-se 8 vezes no método real, aqui simplificamos para exemplo
      { tipo: "corrida", tempo: 1, texto: "🏃 CORRER" },
      { tipo: "caminhada", tempo: 1, texto: "🚶 CAMINHAR" },
      { tipo: "arrefecimento", tempo: 5, texto: "❄️ RESFRIAR" },
    ],
  },
  // Podes adicionar a Semana 2, Semana 3, etc.
];
