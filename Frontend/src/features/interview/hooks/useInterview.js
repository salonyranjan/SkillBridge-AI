import { generateInterviewReport as apiGenerateReport, getInterviewReportById, getAllInterviewReports } from "../services/interview.api"
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
            
            // Success check: ensure response.interviewReport contains the saved DB object
            if (response && response.interviewReport && response.interviewReport._id) {
                setReport(response.interviewReport)
                return response.interviewReport
            }
        } catch (error) {
            console.error("Generate Error:", error)
        } finally {
            setLoading(false)
        }
        return null // Return null instead of crashing if backend fails
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

    useEffect(() => {
        if (interviewId) getReportById(interviewId);
        else getReports();
    }, [interviewId])

    return { loading, report, reports, generateReport, getReports, getReportById }
}