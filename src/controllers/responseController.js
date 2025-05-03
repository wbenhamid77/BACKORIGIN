const supabase = require('../config/supabase');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const speech = require('@google-cloud/speech');

// Configuration du client Google Speech-to-Text
const speechClient = new speech.SpeechClient({
  keyFilename: path.join(__dirname, '../../google-credentials.json')
});

// Configuration de multer pour les fichiers audio/vidéo
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  },
  fileFilter: function (req, file, cb) {
    console.log('File received:', file);
    if (file.mimetype.startsWith('audio/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      console.log('Invalid file type:', file.mimetype);
      cb(new Error('Seuls les fichiers audio et vidéo sont acceptés'), false);
    }
  }
}).single('response');

// Fonction pour transcrire l'audio
async function transcribeAudio(audioBuffer, mimeType) {
  try {
    const audioBytes = audioBuffer.toString('base64');
    
    const audio = {
      content: audioBytes,
    };

    const config = {
      encoding: mimeType.includes('webm') ? 'WEBM_OPUS' : 'LINEAR16',
      sampleRateHertz: 16000,
      languageCode: 'fr-FR',
      enableAutomaticPunctuation: true,
    };

    const request = {
      audio: audio,
      config: config,
    };

    const [response] = await speechClient.recognize(request);
    const transcription = response.results
      .map(result => result.alternatives[0].transcript)
      .join('\n');

    return transcription;
  } catch (error) {
    console.error('Erreur lors de la transcription:', error);
    throw error;
  }
}

// Enregistrer une réponse
async function saveResponse(req, res) {
  try {
    console.log('Starting saveResponse with body:', req.body);
    
    upload(req, res, async function(err) {
      if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({ error: err.message });
      }

      if (!req.file) {
        console.error('No file received');
        return res.status(400).json({ error: 'Aucun fichier reçu' });
      }

      const { questionId } = req.body;
      
      // Vérifier que questionId est un UUID valide
      if (!questionId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(questionId)) {
        return res.status(400).json({ error: 'ID de question invalide' });
      }

      const fileBuffer = req.file.buffer;
      const fileName = `${uuidv4()}-${req.file.originalname}`;
      const fileType = req.file.mimetype;

      try {
        // Transcrire l'audio si c'est un fichier audio
        let transcription = '';
        if (fileType.startsWith('audio/')) {
          console.log('Transcribing audio file...');
          transcription = await transcribeAudio(fileBuffer, fileType);
          console.log('Transcription completed:', transcription);
        }

        // Upload vers Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('responses')
          .upload(fileName, fileBuffer, {
            contentType: fileType,
            upsert: true
          });

        if (uploadError) {
          console.error('Supabase upload error:', uploadError);
          return res.status(500).json({ 
            error: 'Erreur lors de l\'upload du fichier',
            details: uploadError.message 
          });
        }

        // Récupérer l'URL publique
        const { data: { publicUrl } } = supabase.storage
          .from('responses')
          .getPublicUrl(fileName);

        // Enregistrer dans la base de données
        const { data, error } = await supabase
          .from('responses')
          .insert([
            {
              id: uuidv4(),
              question_id: questionId,
              file_path: publicUrl,
              file_name: fileName,
              file_type: fileType,
              transcription: transcription,
              created_at: new Date()
            }
          ])
          .select();

        if (error) {
          console.error('Database error:', error);
          return res.status(500).json({ 
            error: 'Erreur lors de l\'enregistrement dans la base de données',
            details: error.message 
          });
        }

        console.log('Response saved successfully:', data[0]);
        res.json(data[0]);
      } catch (error) {
        console.error('Error in Supabase operations:', error);
        return res.status(500).json({ 
          error: 'Erreur lors des opérations Supabase',
          details: error.message 
        });
      }
    });
  } catch (error) {
    console.error('Error in saveResponse:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'enregistrement de la réponse',
      details: error.message 
    });
  }
}

// Récupérer toutes les réponses d'une question
async function getResponsesByQuestion(req, res) {
  try {
    const { questionId } = req.params;
    
    // Vérifier que questionId est un UUID valide
    if (!questionId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(questionId)) {
      return res.status(400).json({ error: 'ID de question invalide' });
    }

    console.log('Fetching responses for question:', questionId);

    const { data, error } = await supabase
      .from('responses')
      .select(`
        *,
        questions:question_id (
          id,
          text
        )
      `)
      .eq('question_id', questionId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log('Responses fetched:', data);
    res.json(data);
  } catch (error) {
    console.error('Error in getResponsesByQuestion:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des réponses',
      details: error.message 
    });
  }
}

// Mettre à jour la transcription d'une réponse
async function updateTranscription(req, res) {
  try {
    const { responseId } = req.params;
    const { transcription } = req.body;
    
    // Vérifier que responseId est un UUID valide
    if (!responseId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(responseId)) {
      return res.status(400).json({ error: 'ID de réponse invalide' });
    }

    console.log('Updating transcription for response:', responseId);

    const { data, error } = await supabase
      .from('responses')
      .update({ transcription })
      .eq('id', responseId)
      .select();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log('Transcription updated:', data[0]);
    res.json(data[0]);
  } catch (error) {
    console.error('Error in updateTranscription:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la mise à jour de la transcription',
      details: error.message 
    });
  }
}

module.exports = {
  saveResponse,
  getResponsesByQuestion,
  updateTranscription
}; 