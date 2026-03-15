import { AssignmentSubmissionStatus, IAssignment } from '@/types/assignment'
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarImage } from '@radix-ui/react-avatar';
import { AvatarFallback } from '../ui/avatar';
import FilePreview from './FilePreview';
import { format } from 'date-fns';
import { Button } from '../ui/button';
import { User } from '@/types/user';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Skeleton } from '../ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface Props {
    assignments?: IAssignment[]
    role: 'teacher' | 'student';
    pendingStudentOpen?: boolean;
    students?: User[];
    onGradeUpdate?: (
        submissionId: string,
        payload: {
            grade?: number;
            feedback?: string;
            status?: AssignmentSubmissionStatus;
            isResubmission?: boolean;
        }
    ) => Promise<void>;
}

function Assignments({ assignments = [], role, pendingStudentOpen, students = [], onGradeUpdate }: Props) {
    const [loadingSubmissionIds, setLoadingSubmissionIds] = useState<Set<string>>(new Set());
    const [statusOverrides, setStatusOverrides] = useState<Record<string, AssignmentSubmissionStatus>>({});

    const setSubmissionLoading = (submissionId: string, loading: boolean) => {
        setLoadingSubmissionIds((prev) => {
            const next = new Set(prev);
            if (loading) {
                next.add(submissionId);
            } else {
                next.delete(submissionId);
            }
            return next;
        });
    };

    const runWithLoading = async (submissionId: string, fn: () => Promise<void>) => {
        setSubmissionLoading(submissionId, true);
        try {
            await fn();
        } finally {
            setSubmissionLoading(submissionId, false);
        }
    };

    const getStatusVariant = (status?: AssignmentSubmissionStatus) => {
        if (status === 'graded') return 'noHoverDefault';
        if (status === 'late') return 'destructive';
        return 'noHoverSecondary';
    };

    const getStatusLabel = (status?: AssignmentSubmissionStatus) => {
        if (status === 'graded') return 'Graded';
        if (status === 'late') return 'Late';
        return 'Submitted';
    };

    return (
        <div className="w-full">

            {role === 'teacher' && assignments.length === 0 &&
                <div className="text-center text-gray-500 py-10">
                    No assignments have been submitted yet.
                </div>
            }
            {role === 'student' && assignments.length === 0 &&
                <div className="text-center text-gray-500 py-10">
                    You have not submitted this assignment yet.
                </div>
            }
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-4`}>
                {assignments.map((assignment) => {
                    const isLoadingSubmission = loadingSubmissionIds.has(assignment.id);
                    const selectedStatus = statusOverrides[assignment.id] || assignment.status || 'submitted';
                    return (
                    <Card key={assignment.id} className="w-full rounded-lg">
                        <CardHeader className="flex flex-row items-center gap-4">
                            {role === 'teacher' && <Avatar className="h-10 w-10">
                                <AvatarImage src={assignment.student?.avatarUrl} alt={assignment.student?.name} />
                                <AvatarFallback>{assignment.student?.name?.[0]}</AvatarFallback>
                            </Avatar>}
                            <div>
                                {role === 'teacher' &&
                                    <CardTitle className="text-lg">
                                        {assignment.student?.name}
                                    </CardTitle>}
                                <p className="text-sm text-gray-500">
                                    Submitted at: {format(new Date(assignment.updatedAt), "MMM dd, yyyy h:mm a")}
                                </p>
                                <div className="mt-1 flex flex-wrap gap-2">
                                    <Badge variant={getStatusVariant(assignment.status)}>
                                        {getStatusLabel(assignment.status)}
                                    </Badge>
                                    {assignment.isLate && <Badge variant="destructive">Marked late</Badge>}
                                    {assignment.isResubmission && <Badge variant="outline">Resubmission</Badge>}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {assignment.files && assignment.files.length > 0 && (
                                <FilePreview files={assignment.files}
                                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mt-3"
                                    previewClassName="h-12"
                                    fileInfoClassName="" />
                            )}

                            <div className="mt-4 space-y-2 text-sm">
                                {assignment.grade !== undefined && assignment.grade !== null && (
                                    <p><span className="font-semibold">Grade:</span> {assignment.grade}</p>
                                )}
                                {assignment.feedback && (
                                    <p><span className="font-semibold">Teacher feedback:</span> {assignment.feedback}</p>
                                )}
                            </div>

                            {role === 'teacher' && onGradeUpdate && (
                                <form
                                    className="mt-4 space-y-3 border-t pt-4"
                                    onSubmit={async (e) => {
                                        e.preventDefault();
                                        const formData = new FormData(e.currentTarget);
                                        const rawGrade = (formData.get('grade') as string)?.trim();
                                        const rawFeedback = (formData.get('feedback') as string)?.trim();

                                        await runWithLoading(assignment.id, async () => {
                                            await onGradeUpdate(assignment.id, {
                                                grade: rawGrade === '' ? undefined : Number(rawGrade),
                                                feedback: rawFeedback === '' ? undefined : rawFeedback,
                                                status: selectedStatus,
                                                isResubmission: !!assignment.isResubmission,
                                            });
                                        });
                                    }}
                                >
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Grade</p>
                                            <Input
                                                type="number"
                                                name="grade"
                                                step="0.1"
                                                min="0"
                                                defaultValue={assignment.grade ?? ''}
                                                placeholder="e.g. 8.5"
                                                disabled={isLoadingSubmission}
                                            />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Status</p>
                                            <Select
                                                value={selectedStatus}
                                                onValueChange={(value: AssignmentSubmissionStatus) =>
                                                    setStatusOverrides((prev) => ({ ...prev, [assignment.id]: value }))
                                                }
                                                disabled={isLoadingSubmission}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="submitted">Submitted</SelectItem>
                                                    <SelectItem value="graded">Graded</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Feedback</p>
                                        <Textarea
                                            name="feedback"
                                            defaultValue={assignment.feedback || ''}
                                            placeholder="Add feedback for student"
                                            className="min-h-[80px]"
                                            disabled={isLoadingSubmission}
                                        />
                                    </div>

                                    <div className="flex flex-wrap gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            {isLoadingSubmission ? (
                                                <Skeleton className="h-4 w-4 rounded-sm" />
                                            ) : (
                                                <Checkbox
                                                    id={`isResubmission-${assignment.id}`}
                                                    checked={!!assignment.isResubmission}
                                                    onCheckedChange={async (checked) => {
                                                        await runWithLoading(assignment.id, async () => {
                                                            await onGradeUpdate(assignment.id, {
                                                                isResubmission: checked === true,
                                                            });
                                                        });
                                                    }}
                                                />
                                            )}
                                            <Label htmlFor={`isResubmission-${assignment.id}`}>Mark resubmission</Label>
                                        </div>
                                    </div>

                                    <Button type="submit" size="sm" disabled={isLoadingSubmission}>
                                        {isLoadingSubmission ? "Saving..." : "Save grade and feedback"}
                                    </Button>
                                </form>
                            )}

                            {role === 'student' && assignment.gradeHistory && assignment.gradeHistory.length > 0 && (
                                <div className="mt-4 border-t pt-4">
                                    <h4 className="text-sm font-semibold mb-2">Grade history</h4>
                                    <div className="space-y-2">
                                        {assignment.gradeHistory
                                            .slice()
                                            .reverse()
                                            .map((entry, idx) => (
                                                <div key={`${assignment.id}-history-${idx}`} className="rounded-md border p-2 text-xs">
                                                    <p>
                                                        {format(new Date(entry.gradedAt), "MMM dd, yyyy h:mm a")} · {entry.status}
                                                    </p>
                                                    <p>Grade: {entry.grade ?? "N/A"}</p>
                                                    {entry.feedback && <p>Feedback: {entry.feedback}</p>}
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    );
                })}
            </div>
            {pendingStudentOpen && students.length > 0 && (
                <div className="hidden sm:block">
                    <h1 className="text-xl font-bold">Students still not submitted this assignment</h1>
                    <div className={`grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 py-4`}>
                        {students.map((s) => (
                            <div
                                key={s.id}
                                className="flex items-center gap-3 border rounded-lg p-3 bg-card"
                            >
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={s.avatarUrl || undefined} alt={s.name} />
                                    <AvatarFallback>{(s.name || "U")[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="font-medium">{s.name}</div>
                                    <div className="text-xs text-muted-foreground">{s.email || s.role}</div>
                                </div>
                                {/* <Button size="sm" variant="ghost">Remind</Button> */}
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
}

export default Assignments;
