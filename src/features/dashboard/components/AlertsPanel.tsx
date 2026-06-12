import { AlertTriangle, Moon, CheckCircle2 } from 'lucide-react';
import type { DashboardAlert } from '../hooks/useTodayAlerts';

interface AlertsPanelProps {
  alerts: DashboardAlert[];
  isLoading: boolean;
}

export function AlertsPanel({ alerts, isLoading }: AlertsPanelProps) {
  if (isLoading) return null;

  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06]">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        <p className="text-sm text-emerald-300">Todo en orden — sin alertas hoy.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map((a) => {
        const Icon = a.type === 'no_sales' ? Moon : AlertTriangle;
        return (
          <div
            key={a.id}
            className="flex items-center gap-3 p-4 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06]"
          >
            <Icon className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-sm text-amber-200">{a.message}</p>
          </div>
        );
      })}
    </div>
  );
}
