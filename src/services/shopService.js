import { supabase } from 'boot/supabase';

export async function fetchProfilesByIds(userIds) {
  const ids = Array.from(new Set((userIds || []).filter(Boolean)));
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, avatar_url')
    .in('id', ids);

  if (error) throw error;
  return data || [];
}

export async function fetchHistoryScoresByUser(userId) {
  const { data, error } = await supabase
    .from('historico_treinos')
    .select('pontuacao')
    .eq('user_id', userId);

  if (error) throw error;
  return data || [];
}

function offersBaseQuery() {
  return supabase
    .from('loja_ofertas')
    .select('*')
    .order('comprado', { ascending: true })
    .order('created_at', { ascending: false });
}

export async function fetchOffersReceivedByName(userNameLower) {
  const { data, error } = await offersBaseQuery().eq('destinatario_name', userNameLower);
  if (error) throw error;
  return data || [];
}

export async function fetchOffersReceivedByUserId(userId) {
  const { data, error } = await offersBaseQuery().eq('destinatario_id', userId);
  if (error) throw error;
  return data || [];
}

export async function fetchOffersReceivedByNameInsensitive(userNameLower) {
  const { data, error } = await offersBaseQuery().ilike('destinatario_name', userNameLower);
  if (error) throw error;
  return data || [];
}

export async function fetchOffersByCreator(userId) {
  const { data, error } = await supabase
    .from('loja_ofertas')
    .select('*')
    .eq('criador_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function insertOffer(offerData) {
  const { error } = await supabase.from('loja_ofertas').insert(offerData);
  if (error) throw error;
}

export async function markOfferPurchased(offerId) {
  const { error } = await supabase
    .from('loja_ofertas')
    .update({ comprado: true, comprado_em: new Date().toISOString() })
    .eq('id', offerId);

  if (error) throw error;
}

export async function deleteOfferById(offerId) {
  const { error } = await supabase
    .from('loja_ofertas')
    .delete()
    .eq('id', offerId);

  if (error) throw error;
}

export async function fetchAllProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, avatar_url');

  if (error) throw error;
  return data || [];
}

export async function findProfileByName(nameLower) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, avatar_url')
    .eq('name', nameLower)
    .limit(1);

  if (error) throw error;
  return Array.isArray(data) && data.length > 0 ? data[0] : null;
}

export async function findAnotherProfileWithName(nameLower, currentUserId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('name', nameLower)
    .neq('id', currentUserId)
    .limit(1);

  if (error) throw error;
  return Array.isArray(data) && data.length > 0;
}

export async function upsertProfile(profileUpsert) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profileUpsert, { onConflict: 'id' })
    .select();

  if (error) throw error;
  return data || [];
}
