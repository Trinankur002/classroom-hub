import React, { useState } from "react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { CalendarIcon, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface DateTimePickerProps {
    label?: string;
    value?: Date;
    onChange: (date: Date | undefined) => void;
    placeholder?: string;
    disabled?: boolean;
    minDate?: Date;
    className?: string;
}

interface TimeState {
    hours: number;
    minutes: number;
    period: 'AM' | 'PM';
}

export function DateTimePicker({
    label,
    value,
    onChange,
    placeholder = "Select date and time",
    disabled = false,
    minDate,
    className = ""
}: DateTimePickerProps) {
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [timePickerOpen, setTimePickerOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(value || new Date());
    const [timeState, setTimeState] = useState<TimeState>(() => {
        if (value) {
            let hours = value.getHours();
            const period = hours >= 12 ? 'PM' : 'AM';
            if (hours === 0) hours = 12;
            else if (hours > 12) hours -= 12;

            return {
                hours,
                minutes: value.getMinutes(),
                period
            };
        }
        return { hours: 11, minutes: 59, period: 'PM' };
    });

    const updateTimeState = (newTimeState: Partial<TimeState>) => {
        const updated = { ...timeState, ...newTimeState };
        setTimeState(updated);

        if (value) {
            const newDate = new Date(value);
            let hours = updated.hours;

            // Convert to 24-hour format
            if (updated.period === 'PM' && hours !== 12) {
                hours += 12;
            } else if (updated.period === 'AM' && hours === 12) {
                hours = 0;
            }

            newDate.setHours(hours, updated.minutes, 0, 0);
            onChange(newDate);
        }
    };

    const formatTimeDisplay = () => {
        const displayHours = timeState.hours === 0 ? 12 : timeState.hours;
        const minutes = timeState.minutes.toString().padStart(2, '0');
        return `${displayHours}:${minutes} ${timeState.period}`;
    };

    // Calendar helper functions
    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const goToPreviousMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const goToNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    const selectDate = (day: number) => {
        const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);

        // Apply time if it exists
        let hours = timeState.hours;
        if (timeState.period === 'PM' && hours !== 12) {
            hours += 12;
        } else if (timeState.period === 'AM' && hours === 12) {
            hours = 0;
        }

        selectedDate.setHours(hours, timeState.minutes, 0, 0);
        onChange(selectedDate);
        setDatePickerOpen(false);
    };

    const isDateSelected = (day: number) => {
        if (!value) return false;
        const dayDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        return value.toDateString() === dayDate.toDateString();
    };

    const isDateDisabled = (day: number) => {
        if (!minDate) return false;
        const dayDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const compareDate = new Date(minDate);
        compareDate.setHours(0, 0, 0, 0);
        return dayDate < compareDate;
    };

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentMonth);
        const firstDay = getFirstDayOfMonth(currentMonth);
        const days = [];

        // Empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="w-10 h-10"></div>);
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const isSelected = isDateSelected(day);
            const isDisabled = isDateDisabled(day);

            days.push(
                <button
                    key={day}
                    type="button"
                    onClick={() => !isDisabled && selectDate(day)}
                    disabled={isDisabled}
                    className={`
                        w-10 h-10 rounded-md text-sm font-medium transition-colors
                        ${isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                        }
                        ${isDisabled
                            ? 'text-muted-foreground cursor-not-allowed opacity-50'
                            : 'cursor-pointer'
                        }
                    `}
                >
                    {day}
                </button>
            );
        }

        return days;
    };

    // Generate hour options
    const hourOptions = Array.from({ length: 12 }, (_, i) => i + 1);

    return (
        <div className={className}>
            {label && <Label className="text-sm text-muted-foreground mb-2 block">{label}</Label>}

            <div className="flex gap-4">
                {/* Date Picker */}
                <div className="flex-1">
                    <Label className="text-sm text-muted-foreground mb-2 block">Date</Label>
                    <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                                disabled={disabled}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {value ? format(value, "MMM dd, yyyy") : "Select date"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <div className="p-4">
                                {/* Calendar Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <button
                                        type="button"
                                        onClick={goToPreviousMonth}
                                        className="p-1 hover:bg-muted rounded"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <h3 className="font-semibold">
                                        {format(currentMonth, "MMMM yyyy")}
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={goToNextMonth}
                                        className="p-1 hover:bg-muted rounded"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>

                                {/* Calendar Grid */}
                                <div className="grid grid-cols-7 gap-1">
                                    {/* Day headers */}
                                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                                        <div key={day} className="w-10 h-8 text-center text-sm font-medium text-muted-foreground flex items-center justify-center">
                                            {day}
                                        </div>
                                    ))}
                                    {/* Calendar days */}
                                    {renderCalendar()}
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Time Picker */}
                <div className="flex-1">
                    <Label className="text-sm text-muted-foreground mb-2 block">Time</Label>
                    <Popover open={timePickerOpen} onOpenChange={setTimePickerOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                                disabled={disabled}
                            >
                                <Clock className="mr-2 h-4 w-4" />
                                {formatTimeDisplay()}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0" align="start">
                            <div className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
                                {/* Header */}
                                <div className="text-center mb-6">
                                    <p className="text-sm text-muted-foreground mb-2">Select time</p>
                                </div>

                                {/* Time Display */}
                                <div className="flex items-center justify-center gap-4 mb-8">
                                    {/* Hours */}
                                    <div className="flex flex-col items-center">
                                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-2xl font-bold text-primary mb-2">
                                            {timeState.hours.toString().padStart(2, '0')}
                                        </div>
                                    </div>

                                    <div className="text-2xl font-bold text-muted-foreground">:</div>

                                    {/* Minutes */}
                                    <div className="flex flex-col items-center">
                                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-2xl font-bold text-primary mb-2">
                                            {timeState.minutes.toString().padStart(2, '0')}
                                        </div>
                                    </div>

                                    {/* AM/PM Toggle */}
                                    <div className="flex flex-col gap-1 ml-4">
                                        <button
                                            type="button"
                                            onClick={() => updateTimeState({ period: 'AM' })}
                                            className={`px-3 py-1 text-sm rounded ${timeState.period === 'AM'
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                                }`}
                                        >
                                            AM
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => updateTimeState({ period: 'PM' })}
                                            className={`px-3 py-1 text-sm rounded ${timeState.period === 'PM'
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                                }`}
                                        >
                                            PM
                                        </button>
                                    </div>
                                </div>

                                {/* Time Selection Grid */}
                                <div className="space-y-6">
                                    {/* Hour Selection */}
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-3 text-center">Hours</p>
                                        <div className="grid grid-cols-6 gap-2">
                                            {hourOptions.map((hour) => (
                                                <button
                                                    key={hour}
                                                    type="button"
                                                    onClick={() => updateTimeState({ hours: hour })}
                                                    className={`h-10 rounded-lg text-sm font-medium transition-colors ${timeState.hours === hour
                                                            ? 'bg-primary text-primary-foreground'
                                                            : 'hover:bg-muted bg-background border'
                                                        }`}
                                                >
                                                    {hour}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Minute Selection */}
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-3 text-center">Minutes</p>
                                        <div className="grid grid-cols-6 gap-2">
                                            {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                                                <button
                                                    key={minute}
                                                    type="button"
                                                    onClick={() => updateTimeState({ minutes: minute })}
                                                    className={`h-10 rounded-lg text-sm font-medium transition-colors ${timeState.minutes === minute
                                                            ? 'bg-primary text-primary-foreground'
                                                            : 'hover:bg-muted bg-background border'
                                                        }`}
                                                >
                                                    {minute.toString().padStart(2, '0')}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setTimePickerOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => setTimePickerOpen(false)}
                                    >
                                        OK
                                    </Button>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* Combined Date/Time Preview */}
            {value && (
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md mt-4">
                    <strong>Selected:</strong> {format(value, "EEEE, MMMM do, yyyy 'at' h:mm a")}
                </div>
            )}
        </div>
    );
}