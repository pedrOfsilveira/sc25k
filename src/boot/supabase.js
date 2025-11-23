import { createClient } from "@supabase/supabase-js";
import { boot } from "quasar/wrappers";

// Lê as variáveis do arquivo .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Cria a conexão
const supabase = createClient(supabaseUrl, supabaseKey);

export default boot(({ app }) => {
  // Isto torna o supabase disponível dentro dos componentes Vue como this.$supabase
  // Mas como vamos usar Composition API, vamos importar diretamente onde precisarmos.
  // Ainda assim, é boa prática injetar globalmente para plugins.
  app.config.globalProperties.$supabase = supabase;
});

export { supabase };
