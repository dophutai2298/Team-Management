import { Card, CardBody, CardHeader, Divider } from "@heroui/react";
import type { ReactNode } from "react";

type WorkspacePanelProps = {
  id: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function WorkspacePanel({ id, title, description, action, children }: WorkspacePanelProps) {
  return (
    <Card className="border border-line bg-panel shadow-panel" radius="lg">
      <CardHeader className="flex min-h-[72px] items-center justify-between gap-4 px-5 py-4 md:px-6">
        <div className="min-w-0">
          <h2 id={id} className="text-base font-semibold leading-6 text-ink">
            {title}
          </h2>
          {description ? <p className="mt-0.5 text-xs leading-5 text-muted">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </CardHeader>
      <Divider className="bg-line" />
      <CardBody className="p-5 md:p-6">{children}</CardBody>
    </Card>
  );
}
