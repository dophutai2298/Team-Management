import { Card, CardBody } from "@heroui/react";

export type Metric = {
  label: string;
  value: string;
  isPlaceholder?: boolean;
};

type MetricGridProps = {
  ariaLabel: string;
  metrics: readonly Metric[];
};

export function MetricGrid({ ariaLabel, metrics }: MetricGridProps) {
  return (
    <Card className="border border-line/85 bg-panel shadow-panel" radius="lg">
      <CardBody className="grid grid-cols-2 gap-0 p-0 md:grid-cols-4" aria-label={ariaLabel}>
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="min-w-0 border-b border-line/85 p-4 odd:border-r odd:border-line/85 last:border-b-0 md:border-b-0 md:[&:not(:last-child)]:border-r md:p-5"
          >
            <p className="truncate text-xs font-semibold leading-5 text-muted">{metric.label}</p>
            <p
              className={`mt-3 font-bold text-ink ${
                metric.isPlaceholder ? "text-sm leading-6" : "text-[28px] leading-none tabular-nums"
              }`}
            >
              {metric.value}
            </p>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
