import { useQuery } from '@tanstack/react-query';

const fetcher = async <T>(url: string): Promise<T> => {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Request to ${url} failed with ${response.status}`);
  }
  return (await response.json()) as T;
};

export const useAdminOverview = () =>
  useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => fetcher<OverviewResponse>('/api/overview'),
    staleTime: 30_000,
  });

export const useAdminMerchants = () =>
  useQuery({
    queryKey: ['admin-merchants'],
    queryFn: () => fetcher<MerchantResponse>('/api/merchants'),
    staleTime: 30_000,
  });

export const useAdminRiskAlerts = () =>
  useQuery({
    queryKey: ['admin-risk'],
    queryFn: () => fetcher<RiskResponse>('/api/risk'),
    staleTime: 15_000,
  });

export const useAdminAgents = () =>
  useQuery({
    queryKey: ['admin-agents'],
    queryFn: () => fetcher<AgentResponse>('/api/agents'),
    staleTime: 15_000,
  });

export const useAdminLedgers = () =>
  useQuery({
    queryKey: ['admin-ledgers'],
    queryFn: () => fetcher<TreasuryResponse>('/api/treasury'),
    staleTime: 60_000,
  });

type OverviewResponse = {
  metrics: {
    encryptedTps: number;
    tpsDelta: number;
    openAlerts: number;
    ackNeeded: number;
    arciumLatencyP95: number;
    latencyDelta: number;
    netFlows: number;
    treasuryNote: string;
  };
  uptime: { name: string; status: string; latency: number }[];
  incidents: {
    id: string;
    title: string;
    severity: string;
    owner: string;
    detectedAt: string;
  }[];
  tasks: {
    id: string;
    label: string;
    due: string;
  }[];
  timeline: {
    label: string;
    tps: number;
    latency: number;
  }[];
};

type MerchantResponse = {
  merchants: {
    id: string;
    name: string;
    status: string;
    kyc: string;
    risk: string;
    createdAt?: string;
    walletAddress?: string | null;
    metrics?: {
      products: number;
      customers: number;
      checkoutSessions: number;
      paymentLinks: number;
    };
  }[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

type RiskResponse = {
  alerts: {
    id: string;
    type: string;
    entity: string;
    score: number;
    status: string;
    detectedAt?: string;
  }[];
};

type AgentResponse = {
  agents: {
    id: string;
    name: string;
    status: string;
    queueDepth: number;
    lastHeartbeat: string | null;
    lastRun: string | null;
  }[];
};

type TreasuryResponse = {
  ledgers: {
    id: string;
    balance: number;
    trend: number;
    description: string;
  }[];
};
