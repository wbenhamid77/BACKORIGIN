# CV Interview Questions Generator API

This API generates technical and soft skill interview questions based on a CV and job description using OpenAI's GPT-4.

## Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Create a `.env` file in the root directory and add your OpenAI API key:
```
OPENAI_API_KEY=your_api_key_here
PORT=3000
```

## Running the API

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Generate Questions

`POST /api/generate-questions`

Request body:
```json
{
  "cvUrl": "https://example.com/path-to-cv.pdf",
  "jobDescription": "Full job description text",
  "technicalQuestionsCount": 5,
  "softSkillQuestionsCount": 3,
  "language": "en",
  "programmingLanguages": ["JavaScript", "Python", "Java"]
}
```

Parameters:
- `cvUrl`: URL to the CV in PDF format
- `jobDescription`: Text of the job description
- `technicalQuestionsCount`: (Optional) Number of technical questions to generate (default: 5)
- `softSkillQuestionsCount`: (Optional) Number of soft skill questions to generate (default: 3)
- `language`: (Optional) Language for the questions (default: "en")
- `programmingLanguages`: (Required) Array of programming languages to focus the technical questions on

Response:
```json
{
  "technicalQuestions": [
    {
      "question": "Can you explain how async/await works in JavaScript and provide an example of error handling?",
      "programmingLanguage": "JavaScript",
      "difficulty": "medium"
    },
    {
      "question": "What are Python decorators and how would you implement a simple caching decorator?",
      "programmingLanguage": "Python",
      "difficulty": "hard"
    }
  ],
  "softSkillQuestions": [
    {
      "question": "Describe a situation where you had to resolve a conflict within your team. How did you handle it?",
      "category": "conflict-resolution"
    },
    {
      "question": "How do you prioritize tasks when working on multiple projects with competing deadlines?",
      "category": "time-management"
    }
  ]
} 