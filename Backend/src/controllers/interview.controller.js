// 1. Force the import to find the actual function
let pdf = require("pdf-parse");
let pdfParse;

if (typeof pdf === 'function') {
    pdfParse = pdf;
} else if (pdf.default && typeof pdf.default === 'function') {
    pdfParse = pdf.default;
} else if (Object.values(pdf).find(v => typeof v === 'function')) {
    pdfParse = Object.values(pdf).find(v => typeof v === 'function');
} else {
    // Final fallback: Re-require the internal lib file directly
    pdfParse = require("pdf-parse/lib/pdf-parse.js");
}

const { generateInterviewReport, generateResumePdf } = require("../services/ai.service");
const interviewReportModel = require("../models/interviewReport.model");

/**
 * @description Controller to generate interview report and save to MongoDB.
 */
async function generateInterViewReportController(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Resume PDF is required." });
        }

        const selfDescription = req.body.selfDescription || req.body.selfDesc || "";
        const jobDescription = req.body.jobDescription || req.body.jobDesc || "";

        if (!jobDescription) {
            return res.status(400).json({ message: "Job description is required." });
        }

        // 2. Call the extracted function
        const pdfData = await pdfParse(req.file.buffer);
        
        // Clean text to prevent MongoDB binary errors
        const resumeText = pdfData.text
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "") 
            .replace(/\s+/g, " ") 
            .trim();

        if (!resumeText) {
            throw new Error("Could not extract readable text from the PDF.");
        }

        // 3. Generate AI Insights
        const aiResponse = await generateInterviewReport({
            resume: resumeText,
            selfDescription,
            jobDescription
        });

        // 4. Save to Database
        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
            resume: resumeText,
            selfDescription: selfDescription,
            jobDescription: jobDescription, 
            title: aiResponse.title || "Job Analysis Report", 
            matchScore: aiResponse.matchScore,
            technicalQuestions: aiResponse.technicalQuestions,
            behavioralQuestions: aiResponse.behavioralQuestions,
            skillGaps: aiResponse.skillGaps,
            preparationPlan: aiResponse.preparationPlan
        });

        res.status(201).json({
            message: "Interview report generated successfully.",
            interviewReport
        });

    } catch (error) {
        console.error("Controller Error Trace:", error);
        res.status(500).json({ 
            message: "Failed to generate report.", 
            error: error.message 
        });
    }
}

module.exports = { 
    generateInterViewReportController,
    getInterviewReportByIdController: async (req, res) => { /* find logic */ },
    getAllInterviewReportsController: async (req, res) => { /* find logic */ },
    generateResumePdfController: async (req, res) => { /* pdf logic */ }
};