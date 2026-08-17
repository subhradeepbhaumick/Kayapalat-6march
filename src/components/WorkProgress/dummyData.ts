import { TimelineSlot } from "./types";

export const timelineSlots: TimelineSlot[] = [
    {
        id: 1,
        title: "Morning Update",
        time: "10:00 AM - 12:00 PM",
        task: "Completed Attendance Module API",
        status: "completed",
    },
    {
        id: 2,
        title: "Noon Update",
        time: "12:00 PM - 2:00 PM",
        task: "Payroll UI Development",
        status: "completed",
    },
    {
        id: 3,
        title: "Afternoon Update",
        time: "2:00 PM - 4:00 PM",
        status: "current",
    },
    {
        id: 4,
        title: "Evening Update",
        time: "4:00 PM - 6:00 PM",
        status: "upcoming",
    },
    {
        id: 5,
        title: "Final Update",
        time: "6:00 PM - Checkout",
        status: "upcoming",
    },
];