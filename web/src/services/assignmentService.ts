import api from "./api";

class AssignmentService {
    async submitAssignment(assignmentId: string, files: File[]): Promise<any> {
        try {
            const formData = new FormData();
            files.forEach(file => {
                formData.append("files", file);
            });

            const response = await api.post(`/assignments/${assignmentId}/submit`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return { data: response.data };
        } catch (error) {
            console.error("Error submitting assignment:", error);
            return {
                error: error?.response?.data?.message || error.message || "Something went wrong",
            };
        }
    }
}

export default new AssignmentService();
