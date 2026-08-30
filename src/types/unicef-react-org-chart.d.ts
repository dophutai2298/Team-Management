declare module "@unicef/react-org-chart" {
  import type { ComponentType } from "react";

  type OrgChartProps = {
    id?: string;
    tree: object;
    nodeWidth?: number;
    nodeHeight?: number;
    nodeSpacing?: number;
    nodePaddingX?: number;
    nodePaddingY?: number;
    nodeBorderRadius?: number;
    avatarWidth?: number;
    animationDuration?: number;
    lineType?: "angle" | "curve";
    backgroundColor?: string;
    borderColor?: string;
    nameColor?: string;
    titleColor?: string;
    reportsColor?: string;
    shouldResize?: boolean;
    onPersonClick?: () => boolean | void;
  };

  const OrgChart: ComponentType<OrgChartProps>;

  export default OrgChart;
}
