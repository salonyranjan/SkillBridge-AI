const { GoogleGenerativeAI } = require("@google/generative-ai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");

// Initialize Google AI with your API Key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY);

/**
 * Define the Structured Schema for the Interview Report
 */
const interviewReportSchema = z.object({
    matchScore: z.number().min(0).max(100),
    technicalQuestions: z.array(z.object({
        question: z.string(),
        intention: z.string(),
        answer: z.string()
    })),
    behavioralQuestions: z.array(z.object({
        question: z.string(),
        intention: z.string(),
        answer: z.string()
    })),
    skillGaps: z.array(z.object({
        skill: z.string(),
        severity: z.enum(["low", "medium", "high"])
    })),
    preparationPlan: z.array(z.object({
        day: z.number(),
        focus: z.string(),
        tasks: z.array(z.string())
    })),
    title: z.string()
});

/**
 * @description Generates the structured interview report with automatic retries.
 */
async function generateInterviewReport({ resume, selfDescription, jobDescription }, retries = 3) {
    // Using gemini-1.5-flash-latest for best Free Tier stability in 2026
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    // 1. Generate the JSON schema
    const jsonSchema = zodToJsonSchema(interviewReportSchema);
    
    // 2. THE CRITICAL FIX: Google strictly rejects the request if $schema exists
    delete jsonSchema.$schema; 

    const prompt = `Act as an expert Technical Recruiter. 
    Analyze the Candidate (Resume: ${resume}, Summary: ${selfDescription}) 
    against the Job Description: ${jobDescription}. 
    Identify technical questions, behavioral questions, skill gaps, and a 5-day plan.`;

    for (let i = 0; i < retries; i++) {
        try {
            const result = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: jsonSchema,
                }
            });

            const text = result.response.text();
            // Safety: Clean markdown backticks if Gemini adds them
            const cleanJson = text.replace(/```json|```/g, "").trim();
            return JSON.parse(cleanJson);

        } catch (error) {
            // Handle Quota (429) or Service Busy (503/UNAVAILABLE)
            const isTransient = error.message?.includes("429") || error.code === 503 || error.status === 'UNAVAILABLE';
            
            if (isTransient && i < retries - 1) {
                const wait = 10000 * (i + 1); // 10s delay to clear free tier limits
                console.warn(`AI Service busy. Retry ${i+1} in ${wait/1000}s...`);
                await new Promise(r => setTimeout(r, wait));
                continue;
            }
            console.error("AI Service Final Failure:", error.message);
            throw error;
        }
    }
}

module.exports = { generateInterviewReport };