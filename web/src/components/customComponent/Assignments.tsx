import { IAssignment } from '@/types/assignment'
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarImage } from '@radix-ui/react-avatar';
import { AvatarFallback } from '../ui/avatar';
import FilePreview from './FilePreview';
import { format } from 'date-fns';
import { Button } from '../ui/button';
import { User } from '@/types/user';
import RemainingStudentsDrawer from './RemainingStudentsDrawer';

interface Props {
    assignments?: IAssignment[]
    role: 'teacher' | 'student';
    pendingStudentOpen?: boolean;
    students?: User[];
}

function Assignments({ assignments, role, pendingStudentOpen, students }: Props) {

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
                {assignments.map((assignment) => (
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
                            </div>
                        </CardHeader>
                        <CardContent>
                            {assignment.files && assignment.files.length > 0 && (
                                <FilePreview files={assignment.files}
                                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mt-3"
                                    previewClassName="h-12"
                                    fileInfoClassName="" />
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
            {pendingStudentOpen && students.length > 0 && (
                <div className="hidden sm:block">
                    <h1 className="text-xl font-bold">Students still not submitted this assignment</h1>
                    <div className={`grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 py-4`}>
                        {students.map((student) => (
                            <Card key={student.id} className="w-full rounded-lg">
                                <CardHeader className="flex flex-row items-center gap-4">
                                    {role === 'teacher' && (
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={student?.avatarUrl} alt={student?.name} />
                                            <AvatarFallback>{student?.name?.[0]}</AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div>
                                        {role === 'teacher' && (
                                            <CardTitle className="text-lg">{student?.name}</CardTitle>
                                        )}
                                    </div>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
}

export default Assignments;
