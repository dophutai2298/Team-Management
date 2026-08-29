import { NextResponse } from "next/server";

import { apiSuccess, type ApiResponse } from "@/lib/api/response";
import { requireAdminActor } from "@/lib/admin/access";
import { employeeRouteFailure } from "@/lib/employee/http";
import type { EmployeeManagementOptions, EmployeeSummary } from "@/lib/employee/profile";
import { getEmployeeManagementOptions, listManagedEmployees } from "@/lib/employee/repository";

export const dynamic = "force-dynamic";

export async function GET(): Promise<
  NextResponse<ApiResponse<{ employees: EmployeeSummary[]; options: EmployeeManagementOptions }>>
> {
  try {
    await requireAdminActor();
    const [employees, options] = await Promise.all([listManagedEmployees(), getEmployeeManagementOptions()]);

    return NextResponse.json(apiSuccess({ employees, options }));
  } catch (error) {
    return employeeRouteFailure(error);
  }
}
