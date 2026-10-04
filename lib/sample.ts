import type { PrefillDraft } from "./types";

export const SAMPLE_ANNOUNCEMENT = `Two things happening around campus!

Terp Builders Meetup: Bring your hackathon idea and find a team on October 16, 2026 at 6:00 PM in the Iribe Center lobby. All majors welcome. We'll brainstorm, share projects, and make something together. Interests: technology, design, startups.

Trail Terps is a casual hiking group for UMD students. We explore nearby trails and welcome beginners. Interests: outdoors, wellness. Meeting details and location are still to be decided.`;

export const SAMPLE_DRAFTS: PrefillDraft[] = [
  {
    kind: "event", title: "Terp Builders Meetup",
    description: "Bring your hackathon idea, find a team, and make something together. All majors welcome.",
    tags: ["Technology", "Design", "Startups"], location: "Iribe Center lobby",
    date: "2026-10-16", time: "18:00", meetingDetails: "",
    reviewNotes: ["Review the event date, time, and location before publishing."],
  },
  {
    kind: "group", title: "Trail Terps",
    description: "A casual hiking group for UMD students. Explore nearby trails with a welcoming crew; beginners welcome.",
    tags: ["Outdoors", "Wellness"], location: "", date: "", time: "", meetingDetails: "",
    reviewNotes: ["Location and recurring meeting details are unknown. Leave blank or fill them in yourself."],
  },
];
