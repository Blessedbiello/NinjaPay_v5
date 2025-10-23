export type NavSection = {
  title: string;
  href: string;
  description: string;
  icon: string;
};

export const NAVIGATION: NavSection[] = [
  {
    title: 'Overview',
    href: '/dashboard',
    description: 'KPIs, uptime and current incidents',
    icon: 'activity',
  },
  {
    title: 'Merchants',
    href: '/merchants',
    description: 'Manage merchant accounts, KYC and limits',
    icon: 'building-2',
  },
  {
    title: 'Risk Center',
    href: '/risk',
    description: 'Review alerts, suspicious transactions and escalations',
    icon: 'shield-alert',
  },
  {
    title: 'AI Agents',
    href: '/agents',
    description: 'Monitor orchestration, queue depth and failures',
    icon: 'bot',
  },
  {
    title: 'Treasury',
    href: '/treasury',
    description: 'Track balances, runway and large movements',
    icon: 'banknote',
  },
  {
    title: 'Settings',
    href: '/settings',
    description: 'Access control, webhooks and environment toggles',
    icon: 'settings',
  },
];

