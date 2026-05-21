import { Injectable } from '@nestjs/common';
import { context, trace, SpanKind, SpanStatusCode, type Span } from '@opentelemetry/api';

@Injectable()
export class TracingService {
  private readonly tracer = trace.getTracer('trustip-api', '1.0.0');

  startHttpSpan(name: string, attributes: Record<string, string | number | boolean>): Span {
    return this.tracer.startSpan(name, {
      kind: SpanKind.SERVER,
      attributes,
    });
  }

  withSpan<T>(span: Span, operation: () => T): T {
    return context.with(trace.setSpan(context.active(), span), operation);
  }

  setError(span: Span, error: Error): void {
    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
  }

  finish(span: Span): void {
    span.end();
  }
}
