export type HealthStatus = {
  service: "team-management-bff";
  status: "ready";
  checkedAt: string;
  backend: {
    service: "insforge";
    status: "reachable";
    baseUrl: string;
    latencyMs: number;
  };
};
