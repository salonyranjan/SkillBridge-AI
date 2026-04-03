const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");

/**
 * Initialize the Google GenAI Client.
 * Note: The new SDK requires 'new' and an options object.
 */
const client = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
});

// Schema remains the same
const interviewReportSchema = z.object({
    title: z.string(),
    matchScore: z.number(),
    technicalQuestions: z.array(z.object({ question: z.string(), intention: z.string(), answer: z.string() })),
    behavioralQuestions: z.array(z.object({ question: z.string(), intention: z.string(), answer: z.string() })),
    skillGaps: z.array(z.object({ skill: z.string(), severity: z.enum(["low", "medium", "high"]) })),
    preparationPlan: z.array(z.object({ day: z.number(), focus: z.string(), tasks: z.array(z.string()) })),
});

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
    try {
        // In the @google/genai SDK, we access models via client.models
        const response = await client.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [{ 
                role: "user", 
                parts: [{ text: `Analyze Resume: ${resume}\nJob: ${jobDescription}\nContext: ${selfDescription}` }] 
            }],
            config: {
                responseMimeType: "application/json",
                responseSchema: zodToJsonSchema(interviewReportSchema),
            }
        });

        // The response object in the new SDK has a .text property
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Gemini SDK Error:", error);
        throw new Error("AI Service failed to generate the report.");
    }
}

module.exports = { generateInterviewReport };