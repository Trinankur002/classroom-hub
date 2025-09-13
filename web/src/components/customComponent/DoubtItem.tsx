import React from 'react';
import { IDoubt } from '@/types/doubts';
import { Card, CardContent } from '@/components/ui/card';

interface DoubtItemProps {
    doubt: IDoubt;
    onClick?: () => void;
    isSelected?: boolean;
}

const DoubtItem: React.FC<DoubtItemProps> = ({ doubt, onClick, isSelected }) => {
    const handleClick = () => {
        if (onClick) {
            onClick();
        }
    };

    return (
        <Card
            onClick={handleClick}
            className={`cursor-pointer ${isSelected ? 'ring-2 ring-primary' : ''}`}
        >
            <CardContent className="flex items-center space-x-4 p-4">
                <div className="flex-shrink-0">
                    {!doubt.student?.avatarUrl &&
                        <div className="h-12 w-12 rounded-full flex items-center justify-center bg-muted/40">
                            <span className="text-lg font-bold ">
                                {doubt.student?.name?.charAt(0) || 'T'}
                            </span>
                        </div>
                    }
                    {doubt.student?.avatarUrl && (
                        <img
                            src={doubt.student?.avatarUrl}
                            alt={`${doubt.student?.name}'s avatar`}
                            className="h-10 w-10 rounded-full object-cover"
                        />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-lg font-semibold truncate">
                        {doubt.student?.name || 'Unknown'}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                        {doubt.doubtDescribtion || 'No description provided'}
                    </p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                    {doubt.createdAt ? new Date(doubt.createdAt).toLocaleTimeString() : ''}
                </div>
            </CardContent>
        </Card>
    );
};

export default DoubtItem;
