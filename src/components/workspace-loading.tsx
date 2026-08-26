"use client";

import { Card, CardBody, Skeleton } from "@heroui/react";

export function WorkspaceLoading() {
  return (
    <div className="mx-auto w-full max-w-[1280px]" aria-busy="true" aria-label="Loading workspace">
      <div className="flex items-end justify-between gap-5">
        <div className="w-full max-w-lg space-y-3">
          <Skeleton className="h-3 w-32 rounded-sm" />
          <Skeleton className="h-8 w-72 max-w-full rounded-md" />
          <Skeleton className="h-4 w-full rounded-sm" />
        </div>
        <Skeleton className="hidden h-10 w-36 rounded-md sm:block" />
      </div>
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Card key={index} className="min-w-0 border border-line bg-panel shadow-none" radius="sm">
            <CardBody className="gap-5 p-4 md:p-5">
              <Skeleton className="h-3 w-24 rounded-sm" />
              <Skeleton className="h-7 w-16 rounded-md" />
            </CardBody>
          </Card>
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.75fr)]">
        <Skeleton className="h-72 rounded-lg" />
        <Skeleton className="h-72 rounded-lg" />
      </div>
    </div>
  );
}
