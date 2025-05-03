const supabase = require('../config/supabase');

// Récupérer toutes les interviews
async function getAllInterviews(req, res) {
  try {
    const { data: interviews, error } = await supabase
      .from('interviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des interviews:', error);
      return res.status(500).json({ 
        error: 'Erreur lors de la récupération des interviews',
        details: error.message 
      });
    }

    res.json(interviews || []);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des interviews',
      details: error.message 
    });
  }
}

// Récupérer toutes les réponses vidéo
async function getAllVideoAnswers(req, res) {
  try {
    const { data: answers, error } = await supabase
      .from('video_answers')
      .select(`
        *,
        interviews (
          id,
          candidate_id,
          status
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération:', error);
      return res.status(500).json({ 
        error: 'Erreur lors de la récupération des réponses vidéo',
        details: error.message 
      });
    }

    res.json(answers || []);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des réponses vidéo',
      details: error.message 
    });
  }
}

// Récupérer toutes les réponses vidéo d'une interview
async function getVideoAnswersByInterview(req, res) {
  try {
    const { interviewId } = req.params;
    console.log('Recherche des réponses pour l\'interview:', interviewId);

    // Vérifier d'abord si l'interview existe
    const { data: interviews, error: interviewError } = await supabase
      .from('interviews')
      .select('*')
      .eq('id', interviewId);

    if (interviewError) {
      console.error('Erreur lors de la vérification de l\'interview:', interviewError);
      return res.status(500).json({ 
        error: 'Erreur lors de la vérification de l\'interview',
        details: interviewError.message 
      });
    }

    if (!interviews || interviews.length === 0) {
      return res.status(404).json({ 
        error: 'Interview non trouvée',
        details: `Aucune interview trouvée avec l'ID: ${interviewId}`
      });
    }

    // Récupérer les réponses vidéo
    const { data: answers, error } = await supabase
      .from('video_answers')
      .select('*')
      .eq('interview_id', interviewId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erreur lors de la récupération des réponses:', error);
      return res.status(500).json({ 
        error: 'Erreur lors de la récupération des réponses vidéo',
        details: error.message 
      });
    }

    res.json(answers || []);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des réponses vidéo',
      details: error.message 
    });
  }
}

// Récupérer une réponse vidéo spécifique
async function getVideoAnswerById(req, res) {
  try {
    const { id } = req.params;

    // Vérifier d'abord si la réponse existe
    const { data: answers, error: checkError } = await supabase
      .from('video_answers')
      .select(`
        *,
        interviews (
          id,
          candidate_id,
          video_urls,
          completed_questions,
          total_questions,
          status
        )
      `)
      .eq('id', id);

    if (checkError) {
      console.error('Error checking video answer:', checkError);
      return res.status(500).json({ 
        error: 'Erreur lors de la vérification de la réponse vidéo',
        details: checkError.message 
      });
    }

    if (!answers || answers.length === 0) {
      return res.status(404).json({ error: 'Réponse vidéo non trouvée' });
    }

    const answer = answers[0];

    // Récupérer les informations du candidat si disponible
    if (answer.interviews && answer.interviews.candidate_id) {
      const { data: candidate, error: candidateError } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', answer.interviews.candidate_id)
        .single();

      if (!candidateError && candidate) {
        answer.candidate = candidate;
      }
    }

    res.json(answer);
  } catch (error) {
    console.error('Error in getVideoAnswerById:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération de la réponse vidéo',
      details: error.message 
    });
  }
}

// Sauvegarder une nouvelle réponse vidéo
async function saveVideoAnswer(req, res) {
  try {
    const { 
      url,
      transcription,
      question_index,
      interview_id,
      question_id,
      question_type,
      question_text
    } = req.body;

    const { data: answer, error } = await supabase
      .from('video_answers')
      .insert([
        {
          url,
          transcription,
          question_index,
          interview_id,
          question_id,
          question_type,
          question_text,
          created_at: new Date()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error saving video answer:', error);
      return res.status(500).json({ 
        error: 'Erreur lors de l\'enregistrement de la réponse vidéo',
        details: error.message 
      });
    }

    // Mettre à jour le nombre de questions complétées dans l'interview
    const { data: interview, error: updateError } = await supabase
      .from('interviews')
      .update({
        completed_questions: supabase.raw('completed_questions + 1')
      })
      .eq('id', interview_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating interview:', updateError);
    }

    res.status(201).json(answer);
  } catch (error) {
    console.error('Error in saveVideoAnswer:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'enregistrement de la réponse vidéo',
      details: error.message 
    });
  }
}

// Mettre à jour la transcription d'une réponse vidéo
async function updateVideoAnswerTranscription(req, res) {
  try {
    const { id } = req.params;
    const { transcription } = req.body;

    // Validation des données
    if (!transcription) {
      return res.status(400).json({
        error: 'Données manquantes',
        details: 'La transcription est requise'
      });
    }

    // Vérifier si la réponse vidéo existe
    const { data: existingAnswer, error: checkError } = await supabase
      .from('video_answers')
      .select('*')
      .eq('id', id)
      .single();

    if (checkError || !existingAnswer) {
      return res.status(404).json({
        error: 'Réponse vidéo non trouvée',
        details: `Aucune réponse vidéo trouvée avec l'ID: ${id}`
      });
    }

    // Mettre à jour la transcription
    const { data: updatedAnswer, error } = await supabase
      .from('video_answers')
      .update({ transcription })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la mise à jour:', error);
      return res.status(500).json({
        error: 'Erreur lors de la mise à jour de la transcription',
        details: error.message
      });
    }

    res.json(updatedAnswer);

  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      error: 'Erreur lors de la mise à jour de la transcription',
      details: error.message
    });
  }
}

// Récupérer les réponses vidéo de la dernière interview
async function getLastInterviewVideoAnswers(req, res) {
  try {
    // Récupérer la dernière interview
    const { data: lastInterview, error: interviewError } = await supabase
      .from('interviews')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (interviewError || !lastInterview) {
      return res.status(404).json({
        error: 'Aucune interview trouvée'
      });
    }

    // Récupérer les réponses vidéo pour cette interview
    const { data: answers, error } = await supabase
      .from('video_answers')
      .select('*')
      .eq('interview_id', lastInterview.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erreur lors de la récupération des réponses:', error);
      return res.status(500).json({
        error: 'Erreur lors de la récupération des réponses vidéo'
      });
    }

    res.json(answers || []);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des réponses vidéo'
    });
  }
}

// Mettre à jour les attributs de surveillance de l'interview
async function updateInterviewMonitoring(req, res) {
  try {
    const { interviewId } = req.params;
    const { event_type } = req.body; // 'copy_paste' ou 'camera_stopped'

    // Vérifier si l'interview existe
    const { data: interview, error: checkError } = await supabase
      .from('interviews')
      .select('*')
      .eq('id', interviewId)
      .single();

    if (checkError || !interview) {
      return res.status(404).json({
        error: 'Interview non trouvée',
        details: `Aucune interview trouvée avec l'ID: ${interviewId}`
      });
    }

    // Préparer la mise à jour en fonction du type d'événement
    let updateData = {};
    if (event_type === 'copy_paste') {
      updateData = { has_attempted_copy_paste: true };
    } else if (event_type === 'camera_stopped') {
      updateData = { has_stopped_camera: true };
    } else {
      return res.status(400).json({
        error: 'Type d\'événement invalide',
        details: 'Le type d\'événement doit être "copy_paste" ou "camera_stopped"'
      });
    }

    // Mettre à jour l'interview
    const { data: updatedInterview, error } = await supabase
      .from('interviews')
      .update(updateData)
      .eq('id', interviewId)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la mise à jour:', error);
      return res.status(500).json({
        error: 'Erreur lors de la mise à jour de l\'interview',
        details: error.message
      });
    }

    res.json(updatedInterview);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      error: 'Erreur lors de la mise à jour de l\'interview',
      details: error.message
    });
  }
}

// Mettre à jour les attributs de surveillance de la dernière interview
async function updateLastInterviewMonitoring(req, res) {
  try {
    const { has_attempted_copy_paste, has_stopped_camera } = req.body;

    // Récupérer la dernière interview
    const { data: lastInterview, error: interviewError } = await supabase
      .from('interviews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (interviewError || !lastInterview) {
      return res.status(404).json({
        error: 'Aucune interview trouvée'
      });
    }

    // Préparer les données à mettre à jour
    const updateData = {};
    if (has_attempted_copy_paste !== undefined) {
      updateData.has_attempted_copy_paste = has_attempted_copy_paste;
    }
    if (has_stopped_camera !== undefined) {
      updateData.has_stopped_camera = has_stopped_camera;
    }

    // Mettre à jour l'interview
    const { data: updatedInterview, error } = await supabase
      .from('interviews')
      .update(updateData)
      .eq('id', lastInterview.id)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la mise à jour:', error);
      return res.status(500).json({
        error: 'Erreur lors de la mise à jour de l\'interview',
        details: error.message
      });
    }

    res.json(updatedInterview);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      error: 'Erreur lors de la mise à jour de l\'interview',
      details: error.message
    });
  }
}

// Mettre à jour directement un attribut spécifique de la dernière interview
async function updateLastInterviewAttribute(req, res) {
  try {
    // Récupérer la dernière interview
    const { data: lastInterview, error: interviewError } = await supabase
      .from('interviews')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (interviewError || !lastInterview) {
      return res.status(404).json({
        error: 'Aucune interview trouvée'
      });
    }

    // Mettre à jour l'attribut spécifié
    const { attribute } = req.params;
    let updateData = {};

    if (attribute === 'copy-paste') {
      updateData = { has_attempted_copy_paste: true };
    } else if (attribute === 'camera') {
      updateData = { has_stopped_camera: true };
    } else {
      return res.status(400).json({
        error: 'Attribut invalide',
        details: 'L\'attribut doit être "copy-paste" ou "camera"'
      });
    }

    // Mettre à jour l'interview
    const { data: updatedInterview, error } = await supabase
      .from('interviews')
      .update(updateData)
      .eq('id', lastInterview.id)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la mise à jour:', error);
      return res.status(500).json({
        error: 'Erreur lors de la mise à jour de l\'interview',
        details: error.message
      });
    }

    res.json(updatedInterview);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      error: 'Erreur lors de la mise à jour de l\'interview',
      details: error.message
    });
  }
}

module.exports = {
  getAllInterviews,
  getAllVideoAnswers,
  getVideoAnswersByInterview,
  getVideoAnswerById,
  saveVideoAnswer,
  updateVideoAnswerTranscription,
  getLastInterviewVideoAnswers,
  updateInterviewMonitoring,
  updateLastInterviewMonitoring,
  updateLastInterviewAttribute
}; 