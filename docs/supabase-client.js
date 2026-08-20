import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const cfg = window.MCO_CONFIG || {};
export const isConfigured = Boolean(
  cfg.SUPABASE_URL &&
  cfg.SUPABASE_PUBLISHABLE_KEY &&
  !cfg.SUPABASE_URL.includes('TON-PROJET') &&
  !cfg.SUPABASE_PUBLISHABLE_KEY.includes('XXXXX')
);

export const supabase = isConfigured
  ? createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      realtime: { params: { eventsPerSecond: 20 } }
    })
  : null;

export async function rpc(name, params = {}) {
  if (!supabase) throw new Error('Supabase n’est pas configuré. Renseigne docs/config.js.');
  const { data, error } = await supabase.rpc(name, params);
  if (error) throw new Error(error.message || 'Erreur Supabase');
  return data;
}

export function liveChannel(code, onRefresh) {
  if (!supabase || !code) return { broadcast: async()=>{}, close: async()=>{} };
  const channel = supabase.channel(`mco:${String(code).toUpperCase()}`, {
    config: { broadcast: { self: false } }
  });
  channel.on('broadcast', { event: 'refresh' }, () => onRefresh?.());
  channel.subscribe();
  return {
    broadcast: async (reason='refresh') => {
      try { await channel.send({ type:'broadcast', event:'refresh', payload:{ reason, at:Date.now() } }); } catch {}
    },
    close: async () => { try { await supabase.removeChannel(channel); } catch {} }
  };
}
