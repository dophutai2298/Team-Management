import type { OrganizationEmployee, OrganizationTeam } from "./organization";

export type OrganizationReportingRow = OrganizationEmployee & {
  subRows: OrganizationReportingRow[];
};

export type OrganizationChartPerson = {
  id: string;
  name: string;
  title: string;
  department: string;
  totalReports: number;
  avatar: string;
  hasImage: boolean;
};

export type OrganizationChartNode = {
  id: string;
  person: OrganizationChartPerson;
  hasChild: boolean;
  hasParent: boolean;
  isHighlight: boolean;
  children: OrganizationChartNode[];
  _children?: OrganizationChartNode[] | null;
};

const TRANSPARENT_AVATAR =
  "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";

type ReportingRecord = {
  id: string;
  managerEmployeeId: string | null;
};

function getAcyclicManager<T extends ReportingRecord>(
  record: T,
  recordsById: ReadonlyMap<string, T>,
): T | null {
  if (!record.managerEmployeeId || record.managerEmployeeId === record.id) {
    return null;
  }

  const manager = recordsById.get(record.managerEmployeeId);

  if (!manager) {
    return null;
  }

  const visited = new Set([record.id]);
  let current: T | undefined = manager;

  while (current) {
    if (visited.has(current.id)) {
      return null;
    }

    visited.add(current.id);
    current = current.managerEmployeeId ? recordsById.get(current.managerEmployeeId) : undefined;
  }

  return manager;
}

function sortReportingRows(rows: OrganizationReportingRow[]): void {
  rows.sort((left, right) => left.fullName.localeCompare(right.fullName));
  rows.forEach((row) => sortReportingRows(row.subRows));
}

export function buildReportingTableRows(
  employees: readonly OrganizationEmployee[],
): OrganizationReportingRow[] {
  const rowsById = new Map<string, OrganizationReportingRow>(
    employees.map((employee) => [employee.id, { ...employee, subRows: [] }]),
  );
  const roots: OrganizationReportingRow[] = [];

  for (const row of rowsById.values()) {
    const manager = getAcyclicManager(row, rowsById);

    if (manager) {
      manager.subRows.push(row);
    } else {
      roots.push(row);
    }
  }

  sortReportingRows(roots);

  return roots;
}

function toChartNode(
  employee: OrganizationEmployee,
  selectedTeamIds: ReadonlySet<string>,
  teamNamesById: ReadonlyMap<string, string>,
): OrganizationChartNode {
  const matchingTeamId = employee.primaryTeamId && selectedTeamIds.has(employee.primaryTeamId)
    ? employee.primaryTeamId
    : employee.teamIds.find((teamId) => selectedTeamIds.has(teamId)) ?? null;
  const teamName = matchingTeamId
    ? teamNamesById.get(matchingTeamId) ?? employee.primaryTeamName ?? "-"
    : employee.primaryTeamName ?? "-";
  const assignment = employee.positionTitle ?? employee.roleName ?? employee.levelName ?? "-";

  return {
    id: employee.id,
    person: {
      id: employee.id,
      name: employee.fullName,
      title: `${assignment} · ${teamName}`,
      department: teamName,
      totalReports: 0,
      avatar: employee.avatarUrl ?? TRANSPARENT_AVATAR,
      hasImage: true,
    },
    hasChild: false,
    hasParent: false,
    isHighlight: false,
    children: [],
  };
}

function sortChartNodes(nodes: OrganizationChartNode[]): void {
  nodes.sort((left, right) => left.person.name.localeCompare(right.person.name));
  nodes.forEach((node) => sortChartNodes(node.children));
}

export function buildTeamOrganizationChart(
  employees: readonly OrganizationEmployee[],
  teams: readonly OrganizationTeam[],
  selectedTeamId: string,
): OrganizationChartNode | null {
  const selectedTeam = teams.find((team) => team.id === selectedTeamId);

  if (!selectedTeam) {
    return null;
  }

  const selectedTeamIds = new Set([selectedTeamId]);
  const teamNamesById = new Map(teams.map((team) => [team.id, team.name]));
  const visibleEmployees = employees.filter((employee) =>
    employee.teamIds.some((teamId) => selectedTeamIds.has(teamId)),
  );
  const nodesById = new Map(
    visibleEmployees.map((employee) => [
      employee.id,
      toChartNode(employee, selectedTeamIds, teamNamesById),
    ]),
  );
  const visibleEmployeesById = new Map(
    visibleEmployees.map((employee) => [employee.id, employee]),
  );
  const roots: OrganizationChartNode[] = [];

  for (const employee of visibleEmployees) {
    const node = nodesById.get(employee.id);
    const managerEmployee = getAcyclicManager(employee, visibleEmployeesById);
    const manager = managerEmployee ? nodesById.get(managerEmployee.id) : null;

    if (!node) continue;

    if (manager && manager.id !== node.id) {
      node.hasParent = true;
      manager.children.push(node);
    } else {
      roots.push(node);
    }
  }

  for (const node of nodesById.values()) {
    node.hasChild = node.children.length > 0;
    node.person.totalReports = node.children.length;
  }

  sortChartNodes(roots);

  if (roots.length === 0) {
    return null;
  }

  if (roots.length === 1) {
    return roots[0] ?? null;
  }

  roots.forEach((root) => {
    root.hasParent = true;
  });

  return {
    id: `team-root:${selectedTeam.id}`,
    person: {
      id: `team-root:${selectedTeam.id}`,
      name: selectedTeam.name,
      title: selectedTeam.code,
      department: selectedTeam.name,
      totalReports: roots.length,
      avatar: TRANSPARENT_AVATAR,
      hasImage: true,
    },
    hasChild: true,
    hasParent: false,
    isHighlight: true,
    children: roots,
  };
}

export function prepareOrganizationChartForRender(
  node: OrganizationChartNode,
): OrganizationChartNode {
  const children = Array.isArray(node.children)
    ? node.children
    : Array.isArray(node._children)
      ? node._children
      : [];
  const normalizedChildren = children.map(prepareOrganizationChartForRender);

  return {
    id: node.id,
    person: { ...node.person },
    hasChild: node.hasChild || normalizedChildren.length > 0,
    hasParent: node.hasParent,
    isHighlight: node.isHighlight,
    children: normalizedChildren,
  };
}
