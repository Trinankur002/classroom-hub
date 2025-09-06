import { Card } from '@/components/ui/card'
import { IAssignment } from '@/types/assignment'
import { BookOpen } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface Props {
}

function AllAssignments(props: Props) {
    const { } = props
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState<IAssignment[]>([])
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const userRole = user.role.toString().toLowerCase();

    useEffect(() => {
        if (!user) {
            navigate("/");
        }
        // else {
        //     load();
        //     loadAssignments()
        //     loadClassroomUsers();
        // }
    }, [])


    if (assignments.length === 0) {
        return (
            <div>
                <div className="h-3"></div>
                <Card className="p-12 text-center my-6 mx-6">
                    <div className="space-y-4">
                        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto" />
                        <div>
                            <h3 className="text-lg font-semibold text-foreground">No Assignments Found</h3>
                            <p className="text-muted-foreground">
                                {userRole === 'teacher'
                                    ? "Create your first project to assign work to students."
                                    : "No tasks have been assigned yet. Check back later!"
                                }
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

        )
    }

    return (
        <div>
            <h1>All Assignments</h1>
        </div>
    )
}

export default AllAssignments
