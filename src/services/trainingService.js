import { supabase } from 'boot/supabase';

export async function fetchCompletedDaysByUser(userId) {
  const { data, error } = await supabase
    .from('completed_days')
    .select('week_id, day')
    .eq('user_id', userId);

  if (error) throw error;
  return data || [];
}

export async function upsertCompletedDay(payload) {
  const { error } = await supabase
    .from('completed_days')
    .upsert(payload, { onConflict: 'user_id,week_id,day' });

  if (error) throw error;
}

export async function upsertCompletedWeek(payload) {
  const { error } = await supabase
    .from('completed_weeks')
    .upsert(payload, { onConflict: 'user_id,week_id' });

  if (error) throw error;
}

export async function insertTrainingHistory(payload) {
  const { error } = await supabase.from('historico_treinos').insert(payload);
  if (error) throw error;
}
