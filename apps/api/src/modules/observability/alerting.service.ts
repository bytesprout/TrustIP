import { Injectable, Logger } from '@nestjs/common';

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface AlertEvent {
  source: string;
  severity: AlertSeverity;
  code: string;
  message: string;
  tenantId?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

@Injectable()
export class AlertingService {
  private readonly logger = new Logger(AlertingService.name);
  private readonly alerts: AlertEvent[] = [];

  emit(event: Omit<AlertEvent, 'timestamp'>): AlertEvent {
    const alert: AlertEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    this.alerts.unshift(alert);
    if (this.alerts.length > 500) {
      this.alerts.length = 500;
    }

    this.logger.warn({
      alert: {
        source: alert.source,
        severity: alert.severity,
        code: alert.code,
        message: alert.message,
        tenantId: alert.tenantId ?? null,
        requestId: alert.requestId ?? null,
      },
    });

    return alert;
  }

  recent(limit = 50): AlertEvent[] {
    return this.alerts.slice(0, Math.max(1, Math.min(limit, 200)));
  }
}
