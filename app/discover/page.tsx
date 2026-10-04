"use client";

import Link from "next/link";
import { useState } from "react";
import { useDemo } from "@/components/demo-provider";
import { SwipeCard } from "@/components/swipe-card";
import { Icon } from "@/components/icon";
import type { ItemKind } from "@/lib/types";

export default function DiscoverPage() {
  const { state, decide } = useDemo();
  const [filter, setFilter] = useState<"all" | ItemKind>("all");
  const [announcement, setAnnouncement] = useState("");
  if (!state) return null;

  const available = state.items.filter(item =>
    !state.decisions[item.id] && (filter === "all" || item.kind === filter)
  );
  const current = available[0];

  return (
    <section className="discovery-feed" aria-label="Swipe discovery">
      <h1 className="discovery-heading">Discover.</h1>
      <div className="feed-toolbar">
        <div className="segmented" role="group" aria-label="Filter discovery">
          {(["all", "group", "event"] as const).map(value => (
            <button
              key={value}
              aria-pressed={filter === value}
              className={filter === value ? "selected" : ""}
              onClick={() => setFilter(value)}
            >
              {value === "all" ? "All" : value === "group" ? "Groups" : "Events"}
            </button>
          ))}
        </div>
        <span className="feed-count">{available.length} to explore</span>
      </div>
      {current ? (
        <SwipeCard
          key={`${filter}-${current.id}`}
          item={current}
          onDecision={decision => {
            const success = decide(current.id, decision);
            if (success) {
              setAnnouncement(`${current.title}: ${decision === "interested" ? "saved to your interested list" : "passed"}.`);
            }
            return success;
          }}
        />
      ) : (
        <div className="empty-state feed-empty">
          <div className="empty-icon"><Icon name="check" size={32} /></div>
          <p className="eyebrow">ALL CAUGHT UP</p>
          <h2>You made the rounds.</h2>
          <p>No more {filter === "all" ? "cards" : `${filter}s`} for now. Visit your saved finds or create something for your campus.</p>
          <Link className="button primary" href="/saved">View saved finds <Icon name="arrow" size={18} /></Link>
          <Link href="/create" className="text-link">Create a group or event</Link>
        </div>
      )}
      <span className="sr-only" role="status" aria-live="polite">{announcement}</span>
    </section>
  );
}
