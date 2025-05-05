require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { generateQuestions } = require('./controllers/questionGenerator');
const { getVideos, getVideoById, getInterviewVideos } = require('./controllers/videoController');
const { saveResponse, getResponsesByQuestion, updateTranscription } = require('./controllers/responseController');
const { createInterview } = require('./controllers/interviewController');
const { uploadVideoToSupabase, upload: videoUpload } = require('./controllers/videoUploadController');
const { 
  getAllInterviews,
  getAllVideoAnswers,
  getVideoAnswersByInterview,
  getVideoAnswerById,
  saveVideoAnswer,
  updateVideoAnswerTranscription,
  getLastInterviewVideoAnswers,
  updateInterviewMonitoring,
  updateLastInterviewMonitoring,
  createVideoAnswer
} = require('./controllers/videoAnswerController');

const app = express();

// Configuration pour augmenter la limite de taille des requêtes
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers vidéo sont autorisés'), false);
    }
  }
});

// Middleware
app.use(cors());
app.use(express.static('public')); // Serve static files from public directory

// Store generated questions in memory (in a real app, use a database)
let generatedQuestions = null;

// API Endpoints
app.post('/api/generate-questions', upload.single('cv'), async (req, res) => {
  try {
    const { 
      jobDescription, 
      technicalQuestionsCount, 
      softSkillQuestionsCount, 
      programmingLanguages 
    } = req.body;
    
    // Validate file upload
    if (!req.file) {
      return res.status(400).json({ error: 'CV file (PDF) is required' });
    }

    // Validate other required fields
    if (!jobDescription) {
      return res.status(400).json({ error: 'Job description is required' });
    }

    if (!programmingLanguages || programmingLanguages.length === 0) {
      return res.status(400).json({ error: 'At least one programming language must be specified' });
    }

    // Parse programming languages from string if needed
    const languages = Array.isArray(programmingLanguages) 
      ? programmingLanguages 
      : JSON.parse(programmingLanguages);

    const questions = await generateQuestions({
      cvPath: req.file.path,
      jobDescription,
      technicalQuestionsCount: parseInt(technicalQuestionsCount) || 5,
      softSkillQuestionsCount: parseInt(softSkillQuestionsCount) || 3,
      programmingLanguages: languages
    });

    // Store the generated questions
    generatedQuestions = questions;

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    // Return the generated questions
    res.json(questions);
  } catch (error) {
    console.error('Error:', error);
    // Clean up uploaded file in case of error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to get the generated questions
app.get('/api/get-questions', (req, res) => {
  if (!generatedQuestions) {
    return res.status(404).json({ error: 'No questions have been generated yet' });
  }
  res.json(generatedQuestions);
});

// Routes pour les interviews
app.post('/api/interviews', createInterview);
app.get('/api/interviews', getAllInterviews);
app.put('/api/interviews/last/monitoring', updateLastInterviewMonitoring);
app.get('/api/interviews/last/video-answers', getLastInterviewVideoAnswers);
app.get('/api/interviews/:interviewId/video-answers', getVideoAnswersByInterview);
app.put('/api/interviews/:interviewId/monitoring', updateInterviewMonitoring);

// Routes pour les réponses vidéo
app.post('/api/video-answers/auth', createVideoAnswer);
app.get('/api/video-answers', getAllVideoAnswers);
app.get('/api/video-answers/:id', getVideoAnswerById);
app.post('/api/video-answers', createVideoAnswer);
app.put('/api/video-answers/:id/transcription', updateVideoAnswerTranscription);

// Routes pour les vidéos
app.post('/api/videos/upload', videoUpload.single('video'), uploadVideoToSupabase);
app.get('/api/videos', getVideos);
app.get('/api/videos/interview', getInterviewVideos);
app.get('/api/videos/:id', getVideoById);

// Routes pour les réponses
app.post('/api/responses', saveResponse);
app.get('/api/questions/:questionId/responses', getResponsesByQuestion);
app.put('/api/responses/:responseId/transcription', updateTranscription);

// Configuration du port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 