const pdfParse = require("pdf-parse");
const { generateInterviewReport, generateResumePdf } = require("../services/ai.service");
const interviewReportModel = require("../models/interviewReport.model");

/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterViewReportController(req, res) {
    try {
        const { selfDescription, jobDescription } = req.body;
        let resumeText = "No resume provided.";

        // Safely parse the PDF. Handles both direct function and .default nesting.
        if (req.file && req.file.buffer) {
            try {
                const parsePdf = pdfParse.default ? pdfParse.default : pdfParse;
                const resumeContent = await (new parsePdf.PDFParse(Uint8Array.from(req.file.buffer))).getText();
                resumeText = resumeContent.text ? resumeContent.text : resumeContent;
            } catch (pdfError) {
                console.error("PDF Parsing Warning:", pdfError.message);
                resumeText = "Could not parse uploaded PDF.";
            }
        }

        // 1. Call Gemini AI
        const interViewReportByAi = await generateInterviewReport({
            resume: resumeText,
            selfDescription,
            jobDescription
        });

        // 2. SAFETY MAPPING: Guarantee that 'answer' and other required fields always exist
        const safeTechnicalQuestions = (interViewReportByAi.technicalQuestions || []).map(q => ({
            question: q.question || "Question not generated",
            intention: q.intention || "Intention not generated",
            answer: q.answer || "Expected answer not provided by AI."
        }));

        const safeBehavioralQuestions = (interViewReportByAi.behavioralQuestions || []).map(q => ({
            question: q.question || "Question not generated",
            intention: q.intention || "Intention not generated",
            answer: q.answer || "Expected answer not provided by AI."
        }));

        // 3. Save to Database
        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
            resume: resumeText,
            selfDescription,
            jobDescription,
            title: interViewReportByAi.title || "Interview Plan",
            matchScore: interViewReportByAi.matchScore || 0,
            technicalQuestions: safeTechnicalQuestions,
            behavioralQuestions: safeBehavioralQuestions,
            skillGaps: interViewReportByAi.skillGaps || [],
            preparationPlan: interViewReportByAi.preparationPlan || []
        });

        res.status(201).json({
            message: "Interview report generated successfully.",
            interviewReport
        });

    } catch (error) {
        console.error("Generate Report Error:", error.message);
        res.status(500).json({ message: "Failed to generate report: " + error.message });
    }
}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {
    try {
        const { interviewId } = req.params;
        const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id });

        if (!interviewReport) return res.status(404).json({ message: "Interview report not found." });

        res.status(200).json({ message: "Fetched successfully.", interviewReport });
    } catch (error) {
        res.status(500).json({ message: "Server error while fetching report." });
    }
}

/** * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    try {
        const interviewReports = await interviewReportModel
            .find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan");

        res.status(200).json({ message: "Fetched successfully.", interviewReports });
    } catch (error) {
        res.status(500).json({ message: "Server error while fetching reports." });
    }
}

/**
 * @description Controller to generate resume PDF.
 */
async function generateResumePdfController(req, res) {
    try {
        const { interviewReportId } = req.params;
        const interviewReport = await interviewReportModel.findById(interviewReportId);

        if (!interviewReport) return res.status(404).json({ message: "Report not found." });

        const pdfBuffer = await generateResumePdf({
            resume: interviewReport.resume, 
            jobDescription: interviewReport.jobDescription, 
            selfDescription: interviewReport.selfDescription 
        });

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="resume_${interviewReportId}.pdf"`
        });
        res.send(pdfBuffer);
    } catch (error) {
        res.status(500).json({ message: "Failed to generate PDF." });
    }
}

module.exports = { 
    generateInterViewReportController, 
    getInterviewReportByIdController, 
    getAllInterviewReportsController, 
    generateResumePdfController 
};