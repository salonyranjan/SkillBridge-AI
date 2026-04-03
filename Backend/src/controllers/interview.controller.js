const PDFParser = require("pdf2json");
const { generateInterviewReport, generateResumePdf } = require("../services/ai.service");
const interviewReportModel = require("../models/interviewReport.model");

/**
 * @description Controller to generate interview report using pdf2json for stability.
 */
async function generateInterViewReportController(req, res) {
    try {
        // 1. Initial Checks
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ message: "No resume PDF uploaded." });
        }

        const { selfDescription, jobDescription, title } = req.body;

        if (!title || !jobDescription) {
            return res.status(400).json({ 
                message: "Missing required fields: 'title' and 'jobDescription' are mandatory." 
            });
        }

        // 2. Parse PDF using pdf2json (More stable for Node v23)
        let resumeText = "";
        try {
            const pdfParser = new PDFParser(null, 1); // '1' flag extracts raw text

            resumeText = await new Promise((resolve, reject) => {
                pdfParser.on("pdfParser_dataError", errData => reject(errData.parserError));
                pdfParser.on("pdfParser_dataReady", () => {
                    resolve(pdfParser.getRawTextContent());
                });
                pdfParser.parseBuffer(req.file.buffer);
            });

            if (!resumeText || resumeText.trim().length === 0) {
                return res.status(400).json({ message: "PDF contains no readable text." });
            }
        } catch (pdfErr) {
            console.error("PDF Parsing Error:", pdfErr);
            return res.status(400).json({ message: "Failed to extract text from PDF." });
        }

        // 3. AI Service Call (Handles Gemini 503 Busy error)
        let interViewReportByAi;
        try {
            interViewReportByAi = await generateInterviewReport({
                resume: resumeText,
                selfDescription,
                jobDescription
            });
        } catch (aiError) {
            const status = (aiError.code === 503 || aiError.status === 'UNAVAILABLE') ? 503 : 500;
            return res.status(status).json({ 
                message: "AI Service is currently busy. Please try again in a few seconds." 
            });
        }

        // 4. Save to Database
        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
            title,
            resume: resumeText,
            selfDescription,
            jobDescription,
            ...interViewReportByAi
        });

        res.status(201).json({
            message: "Interview report generated successfully.",
            interviewReport
        });

    } catch (error) {
        console.error("Global Controller Error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
}

/**
 * @description Get report by ID
 */
async function getInterviewReportByIdController(req, res) {
    try {
        const { interviewId } = req.params;
        const report = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id });
        if (!report) return res.status(404).json({ message: "Report not found." });
        res.status(200).json({ message: "Report fetched.", interviewReport: report });
    } catch (error) {
        res.status(500).json({ message: "Error fetching report." });
    }
}

/**
 * @description Get all reports for user
 */
async function getAllInterviewReportsController(req, res) {
    try {
        const reports = await interviewReportModel.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan");
        res.status(200).json({ message: "Reports fetched.", interviewReports: reports });
    } catch (error) {
        res.status(500).json({ message: "Error fetching reports." });
    }
}

/**
 * @description Generate Resume PDF
 */
async function generateResumePdfController(req, res) {
    try {
        const { interviewReportId } = req.params;
        const report = await interviewReportModel.findById(interviewReportId);
        if (!report) return res.status(404).json({ message: "Report not found." });

        const pdfBuffer = await generateResumePdf({ 
            resume: report.resume, 
            jobDescription: report.jobDescription, 
            selfDescription: report.selfDescription 
        });

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
        });
        res.send(pdfBuffer);
    } catch (error) {
        res.status(500).json({ message: "PDF Generation failed." });
    }
}

module.exports = { 
    generateInterViewReportController, 
    getInterviewReportByIdController, 
    getAllInterviewReportsController, 
    generateResumePdfController 
};