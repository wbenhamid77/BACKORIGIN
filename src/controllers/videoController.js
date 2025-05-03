const supabase = require('../config/supabase');

async function getVideos(req, res) {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des vidéos' });
  }
}

async function getInterviewVideos(req, res) {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('type', 'interview')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching interview videos:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des vidéos d\'interview' });
  }
}

async function getVideoById(req, res) {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: 'Vidéo non trouvée' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la vidéo' });
  }
}

module.exports = {
  getVideos,
  getVideoById,
  getInterviewVideos
}; 