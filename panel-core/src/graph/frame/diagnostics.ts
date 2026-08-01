import type {
  GraphFrameDiagnostic,
  GraphFrameDiagnosticCode,
  GraphFrameDiagnosticContext,
  GraphFrameDiagnosticSeverity,
} from './types';

const DEFAULT_EXAMPLE_LIMIT = 5;

interface MutableDiagnostic {
  code: GraphFrameDiagnosticCode;
  severity: GraphFrameDiagnosticSeverity;
  message: string;
  count: number;
  examples: Array<{
    context: GraphFrameDiagnosticContext;
    value?: unknown;
  }>;
}

export class GraphDiagnosticCollector {
  private readonly diagnostics = new Map<string, MutableDiagnostic>();

  constructor(private readonly exampleLimit = DEFAULT_EXAMPLE_LIMIT) {}

  private getOrCreate(
    code: GraphFrameDiagnosticCode,
    severity: GraphFrameDiagnosticSeverity,
    message: string
  ): MutableDiagnostic {
    const key = `${severity}:${code}:${message}`;
    let diagnostic = this.diagnostics.get(key);
    if (!diagnostic) {
      diagnostic = {
        code,
        severity,
        message,
        count: 0,
        examples: [],
      };
      this.diagnostics.set(key, diagnostic);
    }
    return diagnostic;
  }

  add(
    code: GraphFrameDiagnosticCode,
    severity: GraphFrameDiagnosticSeverity,
    message: string,
    context: GraphFrameDiagnosticContext = {},
    value?: unknown
  ): void {
    const diagnostic = this.getOrCreate(code, severity, message);
    diagnostic.count++;
    if (diagnostic.examples.length < Math.max(0, this.exampleLimit)) {
      diagnostic.examples.push({
        context: Object.freeze({ ...context }),
        ...(value === undefined ? {} : { value }),
      });
    }
  }

  addAll(diagnostics: readonly GraphFrameDiagnostic[]): void {
    for (const source of diagnostics) {
      const target = this.getOrCreate(source.code, source.severity, source.message);
      target.count += source.count;

      const remaining = Math.max(0, this.exampleLimit - target.examples.length);
      for (const example of source.examples.slice(0, remaining)) {
        target.examples.push({
          context: Object.freeze({ ...example.context }),
          ...(example.value === undefined ? {} : { value: example.value }),
        });
      }
    }
  }

  hasFatal(): boolean {
    return Array.from(this.diagnostics.values()).some((diagnostic) => diagnostic.severity === 'fatal');
  }

  result(): readonly GraphFrameDiagnostic[] {
    return Object.freeze(
      Array.from(this.diagnostics.values(), (diagnostic) =>
        Object.freeze({
          code: diagnostic.code,
          severity: diagnostic.severity,
          message: diagnostic.message,
          count: diagnostic.count,
          examples: Object.freeze(diagnostic.examples.map((example) => Object.freeze({ ...example }))),
        })
      )
    );
  }
}
