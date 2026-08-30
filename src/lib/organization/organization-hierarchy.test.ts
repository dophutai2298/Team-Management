import { describe, expect, it } from "vitest";

import type { OrganizationEmployee, OrganizationTeam } from "./organization";
import {
  buildReportingTableRows,
  buildTeamOrganizationChart,
  prepareOrganizationChartForRender,
} from "./organization-hierarchy";

function employee(
  id: string,
  fullName: string,
  managerEmployeeId: string | null,
  overrides: Partial<OrganizationEmployee> = {},
): OrganizationEmployee {
  return {
    id,
    fullName,
    email: `${id}@example.com`,
    employeeCode: id.toUpperCase(),
    avatarUrl: null,
    roleName: "Employee",
    managerEmployeeId,
    managerName: null,
    positionTitle: null,
    levelName: null,
    primaryTeamId: "engineering",
    primaryTeamName: "Engineering",
    teamIds: ["engineering"],
    teamNames: ["Engineering"],
    directReportsCount: 0,
    ...overrides,
  };
}

describe("organization hierarchy adapters", () => {
  it("builds stable reporting rows from visible manager relationships", () => {
    const rows = buildReportingTableRows([
      employee("report-b", "Bao Tran", "manager"),
      employee("orphan", "An Le", "outside-scope"),
      employee("manager", "Chi Nguyen", null, { directReportsCount: 2 }),
      employee("report-a", "Anh Pham", "manager"),
    ]);

    expect(rows.map((row) => row.id)).toEqual(["orphan", "manager"]);
    expect(rows[1]?.subRows.map((row) => row.id)).toEqual(["report-a", "report-b"]);
  });

  it("builds a selected-team chart without leaking members from child teams", () => {
    const teams: OrganizationTeam[] = [
      {
        id: "company",
        name: "Company",
        code: "COMPANY",
        parentTeamId: null,
        description: null,
        memberCount: 1,
      },
      {
        id: "engineering",
        name: "Engineering",
        code: "ENG",
        parentTeamId: "company",
        description: null,
        memberCount: 2,
      },
      {
        id: "platform",
        name: "Platform",
        code: "PLAT",
        parentTeamId: "engineering",
        description: null,
        memberCount: 1,
      },
    ];
    const chart = buildTeamOrganizationChart(
      [
        employee("company-lead", "Company Lead", null, {
          primaryTeamId: "company",
          primaryTeamName: "Company",
          teamIds: ["company"],
          teamNames: ["Company"],
        }),
        employee("engineering-lead", "Chi Nguyen", "company-lead", {
          roleName: "Department Head",
          directReportsCount: 1,
        }),
        employee("platform-report", "Dung Le", "engineering-lead", {
          primaryTeamId: "platform",
          primaryTeamName: "Platform",
          teamIds: ["platform"],
          teamNames: ["Platform"],
        }),
        employee("engineering-report", "Binh Ho", "engineering-lead"),
        employee("independent", "An Tran", null),
      ],
      teams,
      "engineering",
    );

    expect(chart?.id).toBe("team-root:engineering");
    expect(chart?.person.name).toBe("Engineering");
    expect(chart?.children.map((node) => node.id)).toEqual(["independent", "engineering-lead"]);
    expect(chart?.children[1]?.children.map((node) => node.id)).toEqual(["engineering-report"]);
    expect(chart?.children[1]?.person).toMatchObject({
      department: "Engineering",
      title: "Department Head · Engineering",
      totalReports: 1,
    });
  });

  it("keeps employees visible when reporting assignments contain a cycle", () => {
    const cyclicEmployees = [
      employee("cycle-a", "An Nguyen", "cycle-b"),
      employee("cycle-b", "Binh Tran", "cycle-a"),
    ];
    const engineeringTeam: OrganizationTeam = {
      id: "engineering",
      name: "Engineering",
      code: "ENG",
      parentTeamId: null,
      description: null,
      memberCount: 2,
    };

    expect(buildReportingTableRows(cyclicEmployees).map((row) => row.id)).toEqual([
      "cycle-a",
      "cycle-b",
    ]);
    expect(
      buildTeamOrganizationChart(cyclicEmployees, [engineeringTeam], engineeringTeam.id)?.children.map(
        (node) => node.id,
      ),
    ).toEqual(["cycle-a", "cycle-b"]);
  });

  it("restores a renderer-mutated chart root to a children array before rendering", () => {
    const engineeringTeam: OrganizationTeam = {
      id: "engineering",
      name: "Engineering",
      code: "ENG",
      parentTeamId: null,
      description: null,
      memberCount: 2,
    };
    const chart = buildTeamOrganizationChart(
      [
        employee("manager", "Chi Nguyen", null),
        employee("report", "Anh Pham", "manager"),
      ],
      [engineeringTeam],
      engineeringTeam.id,
    );

    expect(chart).not.toBeNull();

    const mutatedChart = chart as NonNullable<typeof chart>;
    const rendererMutableChart = mutatedChart as unknown as {
      _children?: NonNullable<typeof chart>["children"];
      children?: unknown;
    };
    rendererMutableChart._children = mutatedChart.children;
    rendererMutableChart.children = undefined;

    const renderTree = prepareOrganizationChartForRender(mutatedChart);

    expect(renderTree.children).toHaveLength(1);
    expect(renderTree.children[0]?.children).toEqual([]);
  });
});
