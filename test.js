const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');

const BASE_URL = 'http://localhost:3001';

async function testAPI() {
  try {
    // 1. Créer une interview
    console.log('Création d\'une interview...');
    const interviewResponse = await fetch(`${BASE_URL}/api/interviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Interview Test',
        description: 'Interview de test pour vérification de l\'API',
        candidate_id: 'test_candidate_id'
      })
    });

    const interview = await interviewResponse.json();
    console.log('Interview créée:', interview);

    // 2. Enregistrer une réponse vidéo
    console.log('\nEnregistrement d\'une réponse vidéo...');
    const formData = new FormData();
    formData.append('url', 'https://example.com/video-test.mp4');
    formData.append('interview_id', interview.id);
    formData.append('question_index', '1');
    formData.append('question_id', 'test_question_id');
    formData.append('question_type', 'technical');
    formData.append('question_text', 'Question de test');
    formData.append('transcription', 'Transcription de test');

    // Si vous avez un fichier vidéo de test
    // formData.append('video', fs.createReadStream('./test-video.mp4'));

    const videoResponse = await fetch(`${BASE_URL}/api/video-answers`, {
      method: 'POST',
      body: formData
    });

    const videoAnswer = await videoResponse.json();
    console.log('Réponse vidéo enregistrée:', videoAnswer);

    // 3. Récupérer toutes les réponses de l'interview
    console.log('\nRécupération des réponses de l\'interview...');
    const answersResponse = await fetch(`${BASE_URL}/api/interviews/${interview.id}/video-answers`);
    const answers = await answersResponse.json();
    console.log('Réponses récupérées:', answers);

    // 4. Récupérer une réponse spécifique
    if (videoAnswer.id) {
      console.log('\nRécupération d\'une réponse spécifique...');
      const singleAnswerResponse = await fetch(`${BASE_URL}/api/video-answers/${videoAnswer.id}`);
      const singleAnswer = await singleAnswerResponse.json();
      console.log('Réponse spécifique récupérée:', singleAnswer);

      // 5. Mettre à jour la transcription
      console.log('\nMise à jour de la transcription...');
      const updateResponse = await fetch(`${BASE_URL}/api/video-answers/${videoAnswer.id}/transcription`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transcription: 'Nouvelle transcription de test'
        })
      });
      const updatedAnswer = await updateResponse.json();
      console.log('Transcription mise à jour:', updatedAnswer);
    }

  } catch (error) {
    console.error('Erreur lors des tests:', error);
  }
}

testAPI(); 