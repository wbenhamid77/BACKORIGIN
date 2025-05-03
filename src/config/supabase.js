const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Les variables d\'environnement SUPABASE_URL et SUPABASE_KEY sont requises');
}

// Créer le client avec des options supplémentaires
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

// Vérifier la connexion
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Changement d\'état d\'authentification:', event, 'Session:', !!session);
});

module.exports = supabase; 