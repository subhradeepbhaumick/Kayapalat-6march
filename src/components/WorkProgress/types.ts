export interface TimelineSlot {
    id: number;
    title: string;
    time: string;
    task?: string;
    status: "completed" | "current" | "upcoming" | "missed";
}