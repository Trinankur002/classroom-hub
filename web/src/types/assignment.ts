import { IClassroomFile } from "./fileInterface";
import { User } from "./user";

export type AssignmentSubmissionStatus = "submitted" | "graded" | "late";

export interface IAssignmentGradeHistoryEntry {
    gradedAt: string;
    gradedById?: string;
    grade?: number | null;
    feedback?: string | null;
    status: AssignmentSubmissionStatus;
    isLate: boolean;
    isResubmission: boolean;
}

export interface IAssignment {
    id: string;
    announcementId: string;
    studentId: string;
    student?: User;
    files?: IClassroomFile[];
    fileUrl?: string;
    grade?: number;
    feedback?: string;
    status?: AssignmentSubmissionStatus;
    isLate?: boolean;
    isResubmission?: boolean;
    gradeHistory?: IAssignmentGradeHistoryEntry[];
    gradedAt?: string | Date;
    gradedById?: string;
    gradedBy?: User;
    createdAt: Date;
    updatedAt: Date;
}
