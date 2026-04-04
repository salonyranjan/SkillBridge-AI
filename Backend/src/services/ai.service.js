const { GoogleGenerativeAI } = require("@google/generative-ai");
const PDFDocument = require("pdfkit"); // Make sure you ran: npm install pdfkit

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY);

/**
 * @description Generates the structured interview report using Gemini AI
 */
async function generateInterviewReport({ resume, selfDescription, jobDescription }, retries = 3) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Act as an expert Technical Recruiter. 
    Analyze Candidate (Resume: ${resume || "None"}, Summary: ${selfDescription || "None"}) 
    against Job: ${jobDescription}.

    Return ONLY a valid JSON object. You MUST include real, detailed text for every single "answer" field. Do not leave any fields blank or missing. Use this exact structure:
    {
      "matchScore": 85,
      "technicalQuestions": [{"question": "Write the question here", "intention": "Write the intention here", "answer": "Write the detailed expected answer here"}],
      "behavioralQuestions": [{"question": "Write the question here", "intention": "Write the intention here", "answer": "Write the detailed expected answer here"}],
      "skillGaps": [{"skill": "Skill name", "severity": "high"}],
      "preparationPlan": [{"day": 1, "focus": "Focus area", "tasks": ["Task 1", "Task 2"]}],
      "title": "Specific Job Title"
    }`;

    for (let i = 0; i < retries; i++) {
        try {
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            
            // Clean markdown blocks if Gemini accidentally adds them
            const cleanJson = text.replace(/```json|```/g, "").trim();
            return JSON.parse(cleanJson);

        } catch (error) {
            // Handle Quota/Busy errors (429)
            if (error.status === 429 || error.status === 503) {
                if (i < retries - 1) {
                    console.warn(`AI Busy or Rate Limited. Retrying in 10 seconds...`);
                    await new Promise(r => setTimeout(r, 10000));
                    continue;
                }
            }
            console.error("AI Service Final Failure:", error.message);
            throw error;
        }
    }
}

/**
 * @description Generates a valid PDF buffer using pdfkit
 */
async function generateResumePdf({ resume, jobDescription, selfDescription }) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            // ── Text Sanitizer to prevent PDF crashes & weird characters ──
            const cleanText = (text) => {
                if (!text || text.trim() === "") return "Not provided.";
                return text
                    .replace(/\r/g, "") // Removes Windows carriage returns
                    .replace(/[\u2018\u2019]/g, "'") // Fixes smart single quotes
                    .replace(/[\u201C\u201D]/g, '"') // Fixes smart double quotes
                    .replace(/[\u2013\u2014]/g, "-") // Fixes long dashes
                    .replace(/[^\x00-\x7F\n]/g, " ") // Replaces any remaining weird symbols with a space
                    .trim();
            };

            // Build PDF Content
            doc.fontSize(24).fillColor('#004e92').text('SkillBridge AI', { align: 'center' });
            doc.fontSize(14).fillColor('#333333').text('Interview Preparation Report', { align: 'center' });
            doc.moveDown(2);

            // Candidate Summary
            doc.fontSize(16).fillColor('#000000').text('Candidate Summary', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(11).fillColor('#444444').text(cleanText(selfDescription));
            doc.moveDown(1.5);

            // Target Role (Job Description)
            doc.fontSize(16).fillColor('#000000').text('Target Role', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(11).fillColor('#444444').text(cleanText(jobDescription));
            doc.moveDown(1.5);

            // Resume Extracted Text
            doc.fontSize(16).fillColor('#000000').text('Analyzed Resume Content', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(10).fillColor('#666666').text(cleanText(resume));

            // Finalize PDF
            doc.end();

        } catch (error) {
            reject(error);
        }
    });
}

module.exports = { generateInterviewReport, generateResumePdf };