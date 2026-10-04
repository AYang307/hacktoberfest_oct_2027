"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useDemo } from "./demo-provider";
import { Icon, type IconName } from "./icon";

const links: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/discover", label: "Discover", icon: "discover" },
  { href: "/create", label: "Create", icon: "plus" },
  { href: "/saved", label: "Saved", icon: "bookmark" },
  { href: "/profile", label: "Profile", icon: "user" },
];

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { state, ready, error, reset, resetVersion } = useDemo();
  const initials = (state?.profile.name || "Alex Morgan").split(/\s+/).filter(Boolean).slice(0, 2).map(n => n[0]).join("");
  function resetDemo() {
    if (window.confirm("Reset TerpLink? This removes your created cards, profile edits, and swipe decisions in this browser and restores the demo. Other browser data is untouched.")) reset();
  }
  return <>
    <a href="#main" className="skip-link">Skip to content</a>
    <header className="site-header">
      <Link href="/" className="brand" aria-label="TerpLink home"><span className="brand-mark"><span /><span /><span /><span /></span>terp<span>link</span><span className="brand-dot">.</span></Link>
      <div className="header-right"><span className="campus-label">UNIVERSITY OF MARYLAND</span><Link href="/profile" className="avatar" aria-label="Edit your profile">{initials}</Link></div>
    </header>
    <main id="main" className={`main-content ${pathname === "/discover" ? "discovery-main" : ""}`}>
      <div className="demo-strip"><span className="status-dot" /><span>Campus demo <span className="strip-detail">· Local to this browser</span></span><button onClick={resetDemo} className="text-button">Reset demo</button></div>
      {error && <div className="notice error" role="alert">{error}</div>}
      {!ready ? <div className="loading-state" role="status"><div className="loading-dot" />Getting your campus ready…</div> : state ? <div key={resetVersion}>{children}</div> : <div className="empty-state"><h1>Let’s start fresh.</h1><p>Use Reset demo above to reopen your local data.</p></div>}
      {pathname !== "/discover" && <footer className="page-footer">Made for finding your people. <span>Go Terps.</span><small>Fictional demo · Not affiliated with UMD · Data isn’t shared across devices.</small></footer>}
    </main>
    <nav className="bottom-nav" aria-label="Main navigation"><div className="nav-inner">{links.map(link => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined} className={`nav-link ${pathname === link.href ? "active" : ""}`}><Icon name={link.icon} /><span>{link.label}</span></Link>)}</div></nav>
  </>;
}
