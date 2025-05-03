const OpenAI = require('openai');
const pdf = require('pdf-parse');
const fs = require('fs');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function parseLocalPDF(filePath) {
  try {
    console.log(`Reading PDF from: ${filePath}`);
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    console.log('PDF parsed successfully');
    return data.text;
  } catch (error) {
    console.error('Error reading PDF:', error);
    throw new Error(`Failed to read PDF: ${error.message}`);
  }
}

// Fallback text for testing when PDF fails
const SAMPLE_CV_TEXT = `
JOHN DOE
Senior Software Engineer

EXPERIENCE
Senior Full Stack Developer | Tech Corp (2018-Present)
- Developed and maintained large-scale web applications using JavaScript, React, and Node.js
- Implemented Python microservices for data processing
- Designed and optimized SQL databases for performance

Software Engineer | StartUp Inc (2015-2018)
- Built RESTful APIs using Node.js and Express
- Developed front-end applications with React and TypeScript
- Managed PostgreSQL databases

SKILLS
Programming: JavaScript, Python, TypeScript, SQL
Frameworks: React, Node.js, Express, Django
Tools: Git, Docker, AWS, Jenkins

EDUCATION
Bachelor of Science in Computer Science
University of Technology (2011-2015)
`;

async function generateQuestions({ 
  cvPath,
  jobDescription, 
  technicalQuestionsCount, 
  softSkillQuestionsCount, 
  programmingLanguages
}) {
  try {
    let cvText = await parseLocalPDF(cvPath);

    const prompt = `Based on the following CV and job description, generate interview questions with their answers.

Generate ${technicalQuestionsCount} technical questions specifically focused on the following programming languages: ${programmingLanguages.join(', ')}.
Also generate ${softSkillQuestionsCount} soft skill questions.

CV Content:
${cvText}

Job Description:
${jobDescription}

Return the response in the following JSON format (no additional text, just pure JSON):
{
  "technicalQuestions": [
    {
      "id": "1", // Increment for each technical question (1, 2, 3, etc.)
      "question": "the question text",
      "answer": "detailed model answer that an ideal candidate might give",
      "programmingLanguage": "the specific programming language this question is about",
      "difficulty": "easy|medium|hard"
    }
  ],
  "softSkillQuestions": [
    {
      "id": "1", // Increment for each soft skill question (1, 2, 3, etc.)
      "question": "the question text",
      "answer": "detailed model answer that an ideal candidate might give",
      "category": "leadership|teamwork|communication|problem-solving|etc"
    }
  ]
}`;

    console.log('Sending request to OpenAI...');
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert technical interviewer specializing in multiple programming languages. You must respond only with valid JSON, no additional text or explanations. For each question, provide a detailed model answer that would be expected from an ideal candidate. Generate relevant interview questions based on the candidate's CV, job description, and specified programming languages. Focus technical questions specifically on the requested programming languages."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7
    });

    console.log('Received response from OpenAI');
    const result = JSON.parse(completion.choices[0].message.content);
    return result;
  } catch (error) {
    console.error('Error in generateQuestions:', error);
    throw error;
  }
}

module.exports = {
  generateQuestions
}; 