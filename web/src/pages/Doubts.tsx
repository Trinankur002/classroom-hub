import { IDoubt } from '@/types/doubts';
import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import DoubtService from '@/services/doubtService';
import { toast } from '@/hooks/use-toast';

interface Props {
    classroomId: string
}

function Doubts(props: Props) {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user") || "null");

    const userRole = user.role.toString().toLowerCase();
    const { classroomId } = props

    const [doubts, setDoubts] = useState<IDoubt[]>([])
    const [isloading, setIsLoading] = useState(false);

    const loadDoubts = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await DoubtService.getDoubts(classroomId);
            setDoubts(data || null);
        } catch (error) {
            toast({
                title: "Failed to load Doubts for this Classroom",
                description: error,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        if (!user) {
            navigate("/");
        } else {
            loadDoubts();
        }
    }, []);

    return (
        <h1>Doubts</h1>
    )
}

export default Doubts
