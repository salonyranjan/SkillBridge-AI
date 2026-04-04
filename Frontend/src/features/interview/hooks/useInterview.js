import { 
    generateInterviewReport as apiGenerateReport, 
    getInterviewReportById, 
    getAllInterviewReports,
    generateResumePdf as apiDownloadPdf // Imported your fixed PDF API function
} from "../services/interview.api"
import { useContext, useEffect } from "react"
import { InterviewContext } from "../interview.context"
import { useParams } from "react-router-dom"

export const useInterview = () => {
    const context = useContext(InterviewContext)
    const { interviewId } = useParams()

    if (!context) throw new Error("useInterview must be used within an InterviewProvider");

    const { loading, setLoading, report, setReport, reports, setReports } = context

    const generateReport = async ({ jobDescription, selfDescription, resumeFile }) => {
        setLoading(true)
        try {
            const response = await apiGenerateReport({ jobDescription, selfDescription, resumeFile })
            
            if (response && response.interviewReport && response.interviewReport._id) {
                setReport(response.interviewReport)
                return response.interviewReport
            }
        } catch (error) {
            console.error("Generate Error:", error.response?.data?.message || error.message)
        } finally {
            setLoading(false)
        }
        return null 
    }

    const getReports = async () => {
        setLoading(true)
        try {
            const response = await getAllInterviewReports()
            if (response && response.interviewReports) {
                setReports(response.interviewReports)
                return response.interviewReports
            }
        } catch (error) {
            console.error("Fetch All Error:", error)
        } finally {
            setLoading(false)
        }
        return []
    }

    const getReportById = async (id) => {
        setLoading(true)
        try {
            const response = await getInterviewReportById(id)
            if (response && response.interviewReport) {
                setReport(response.interviewReport)
                return response.interviewReport
            }
        } catch (error) {
            console.error("Fetch ID Error:", error)
        } finally {
            setLoading(false)
        }
        return null
    }

    // ── PDF Download Logic ──
    const getResumePdf = async (id) => {
        try {
            const pdfBlob = await apiDownloadPdf(id);

            // Create a hidden link and force the browser to click it
            const url = window.URL.createObjectURL(new Blob([pdfBlob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `SkillBridge_Report_${id}.pdf`);
            document.body.appendChild(link);
            link.click();

            // Clean up memory
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Download PDF Error:", error);
            alert("Failed to download PDF. Please try again.");
        } 
    }

    useEffect(() => {
        if (interviewId) getReportById(interviewId);
        else getReports();
    }, [interviewId])

    return { 
        loading, 
        report, 
        reports, 
        generateReport, 
        getReports, 
        getReportById, 
        getResumePdf // Exported so your button can use it
    }
}