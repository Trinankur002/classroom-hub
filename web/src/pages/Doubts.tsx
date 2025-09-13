import { IDoubt } from '@/types/doubts';
import React, { useEffect, useState } from 'react';
import DoubtService from '@/services/doubtService';
import { toast } from '@/hooks/use-toast';
import { BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';
import DoubtItem from '@/components/customComponent/DoubtItem';
import DoubtChat from '@/components/customComponent/DoubtChat';

interface Props {
    classroomId: string;
}

function Doubts({ classroomId }: Props) {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const userRole = user?.role?.toString().toLowerCase();

    const [doubts, setDoubts] = useState<IDoubt[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedDoubt, setSelectedDoubt] = useState<IDoubt | null>(null);

    const loadDoubts = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await DoubtService.getDoubts(classroomId);
            if (error) throw error;
            setDoubts(data || []);
        } catch (err) {
            toast({
                title: "Failed to load Doubts for this Classroom",
                description: String(err),
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!user) {
            return;
        }
        loadDoubts();
    }, [classroomId]);

    const handleSelect = (id: string) => {
        const found = doubts.find(d => d.id === id) || null;
        setSelectedDoubt(found);
    };

    return (
        <div className="flex-1 flex flex-row overflow-hidden">
            {/* Left pane: List of doubts */}
            {/* On mobile, this pane is hidden when a doubt is selected */}
            <div
                className={`${selectedDoubt ? 'hidden sm:flex sm:w-80' : 'flex w-full'} flex-shrink-0 border-r flex-col`}
            >
                <div className="flex-1 overflow-y-auto p-4">
                    {isLoading && <h1 className="text-center">Loading...</h1>}
                    {!isLoading && doubts.length === 0 ? (
                        <Card className="p-12 text-center">
                            <div className="space-y-4">
                                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto" />
                                <div>
                                    <h3 className="text-lg font-semibold text-foreground">No Doubts</h3>
                                    <p className="text-muted-foreground">
                                        {userRole === 'teacher'
                                            ? "No doubts yet."
                                            : "No doubts yet — ask your teacher!"
                                        }
                                    </p>
                                </div>
                            </div>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {doubts.map((doubt) => (
                                <DoubtItem
                                    key={doubt.id}
                                    doubt={doubt}
                                    onClick={() => handleSelect(doubt.id)}
                                    isSelected={selectedDoubt?.id === doubt.id}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Right pane: Chat view */}
            {/* This pane fills the remaining space and is only shown on mobile when a doubt is selected */}
            {selectedDoubt && <div className={`flex-1 h-full ${selectedDoubt ? 'flex' : 'hidden'} sm:flex`}>
                {selectedDoubt ? (
                    <DoubtChat
                        doubt={selectedDoubt}
                        onClose={() => setSelectedDoubt(null)} // Used for mobile back button
                        onDoubtUpdated={(updatedDoubt) => {
                            // Update the state with the latest doubt object from the server
                            setSelectedDoubt(updatedDoubt);

                            // Also update the list of doubts to reflect changes
                            setDoubts(prev => prev.map(d => d.id === updatedDoubt.id ? updatedDoubt : d));
                        }}
                    />
                ) : (
                    // Placeholder for desktop when no doubt is selected
                    <div className="p-8 text-muted-foreground hidden sm:flex items-center justify-center w-full">
                        <div className="text-center">
                            <h3 className="text-lg font-semibold">Select a doubt</h3>
                            <p className="text-sm">Choose a doubt on the left to view the chat.</p>
                        </div>
                    </div>
                )}
            </div>}
        </div>
    );
}

export default Doubts;