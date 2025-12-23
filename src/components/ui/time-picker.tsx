import * as React from "react";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface TimePickerProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    id?: string;
}

// Generate hours array (1-12)
const hours = Array.from({ length: 12 }, (_, i) => {
    const hour = i + 1;
    return { value: hour.toString().padStart(2, "0"), label: hour.toString() };
});

// Generate minutes array (00, 15, 30, 45 for simplicity, or all 60)
const minutes = Array.from({ length: 12 }, (_, i) => {
    const minute = i * 5;
    return { value: minute.toString().padStart(2, "0"), label: minute.toString().padStart(2, "0") };
});

const periods = [
    { value: "AM", label: "AM" },
    { value: "PM", label: "PM" },
];

export function TimePicker({ value, onChange, className, id }: TimePickerProps) {
    // Parse the 24-hour value to 12-hour format
    const parseTime = (timeStr: string) => {
        if (!timeStr) {
            return { hour: "12", minute: "00", period: "PM" };
        }

        const [hourStr, minuteStr] = timeStr.split(":");
        let hour = parseInt(hourStr, 10);
        const minute = minuteStr || "00";
        let period = "AM";

        if (hour === 0) {
            hour = 12;
            period = "AM";
        } else if (hour === 12) {
            period = "PM";
        } else if (hour > 12) {
            hour = hour - 12;
            period = "PM";
        }

        return {
            hour: hour.toString().padStart(2, "0"),
            minute: minute.padStart(2, "0"),
            period,
        };
    };

    // Convert 12-hour to 24-hour format for storage
    const formatTo24Hour = (hour: string, minute: string, period: string) => {
        let h = parseInt(hour, 10);

        if (period === "AM") {
            if (h === 12) h = 0;
        } else {
            if (h !== 12) h = h + 12;
        }

        return `${h.toString().padStart(2, "0")}:${minute}`;
    };

    const { hour, minute, period } = parseTime(value);

    const handleHourChange = (newHour: string) => {
        onChange(formatTo24Hour(newHour, minute, period));
    };

    const handleMinuteChange = (newMinute: string) => {
        onChange(formatTo24Hour(hour, newMinute, period));
    };

    const handlePeriodChange = (newPeriod: string) => {
        onChange(formatTo24Hour(hour, minute, newPeriod));
    };

    return (
        <div className={cn("flex items-center gap-2", className)} id={id}>
            {/* Hour Select */}
            <Select value={hour} onValueChange={handleHourChange}>
                <SelectTrigger className="w-[70px]">
                    <SelectValue placeholder="HH" />
                </SelectTrigger>
                <SelectContent>
                    {hours.map((h) => (
                        <SelectItem key={h.value} value={h.value}>
                            {h.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <span className="text-muted-foreground font-medium">:</span>

            {/* Minute Select */}
            <Select value={minute} onValueChange={handleMinuteChange}>
                <SelectTrigger className="w-[70px]">
                    <SelectValue placeholder="MM" />
                </SelectTrigger>
                <SelectContent>
                    {minutes.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                            {m.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* AM/PM Select */}
            <Select value={period} onValueChange={handlePeriodChange}>
                <SelectTrigger className="w-[75px]">
                    <SelectValue placeholder="AM" />
                </SelectTrigger>
                <SelectContent>
                    {periods.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                            {p.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
