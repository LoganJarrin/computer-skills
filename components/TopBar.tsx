'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { computeStats, getStreak } from '@/lib/gamify';

export default function TopBar() {
  const path = usePathname();
  const [gems, setGems] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => { setGems(computeStats().gems); setStreak(getStreak()); }, [path]);

  const nav = [
    { href: '/', label: 'หน้าหลัก' },
    { href: '/leaderboard', label: 'กระดานผู้นำ' },
    { href: '/profile', label: 'โปรไฟล์' },
  ];
  const isOn = (href: string) => (href === '/' ? path === '/' : path.startsWith(href));

  return (
    <div className="topbar">
      <Link href="/" className="brand">
        <span className="brand-logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></svg>
        </span>
        <span className="brand-name">ทักษะ<span>คอมพิวเตอร์</span></span>
      </Link>
      <nav className="nav">
        {nav.map((n) => (
          <Link key={n.href} href={n.href} className={`navbtn${isOn(n.href) ? ' on' : ''}`}>{n.label}</Link>
        ))}
      </nav>
      <div className="chips">
        <span className="chip fire">🔥 {streak}</span>
        <span className="chip gem">💎 {gems}</span>
      </div>
    </div>
  );
}
