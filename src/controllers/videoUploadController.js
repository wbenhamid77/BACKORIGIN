const supabase = require('../config/supabase');
const multer = require('multer');
const path = require('path');

// Configuration de multer pour le stockage temporaire
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  },
  fileFilter: function (req, file, cb) {
    // Accepter uniquement les fichiers vidéo
    if (!file.mimetype.startsWith('video/')) {
      return cb(new Error('Seuls les fichiers vidéo sont autorisés'), false);
    }
    cb(null, true);
  }
});

// Uploader une vidéo dans Supabase
const uploadVideoToSupabase = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Aucun fichier vidéo fourni',
        details: 'Un fichier vidéo est requis'
      });
    }

    // Générer un nom de fichier unique
    const uniqueFileName = `${Date.now()}-${req.file.originalname}`;
    
    // Uploader la vidéo dans le bucket 'interviews'
    const { data, error } = await supabase.storage
      .from('interviews')
      .upload(uniqueFileName, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
    }

    // Obtenir l'URL publique de la vidéo
    const { data: { publicUrl } } = supabase.storage
      .from('interviews')
      .getPublicUrl(uniqueFileName);

    res.status(201).json({
      message: 'Vidéo uploadée avec succès',
      url: publicUrl,
      fileName: uniqueFileName
    });
  } catch (error) {
    console.error('Erreur lors de l\'upload de la vidéo:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'upload de la vidéo',
      details: error.message 
    });
  }
};

module.exports = {
  uploadVideoToSupabase,
  upload
}; 