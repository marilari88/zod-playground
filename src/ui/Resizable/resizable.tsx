"use client";

import * as ResizablePrimitive from "react-resizable-panels";
import classes from "./Resizable.module.css";

const GripVertical = (props: React.ComponentProps<"svg">) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide lucide-grip-vertical"
    {...props}
  >
    <title>Grip Vertical Icon</title>
    <circle cx={9} cy={12} r={1} />
    <circle cx={9} cy={5} r={1} />
    <circle cx={9} cy={19} r={1} />
    <circle cx={15} cy={12} r={1} />
    <circle cx={15} cy={5} r={1} />
    <circle cx={15} cy={19} r={1} />
  </svg>
);

const ResizablePanelGroup = ({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (
  <ResizablePrimitive.PanelGroup
    className={`${classes.root} ${className}`}
    {...props}
  />
);

const ResizablePanel = ResizablePrimitive.Panel;

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean;
}) => (
  <ResizablePrimitive.PanelResizeHandle
    className={`${classes["panel_resize--handle"]} ${className}`}
    {...props}
  >
    {withHandle && (
      <div className={classes.handle}>
        <GripVertical style={{ height: "2.5rem", width: "2.5rem" }} />
      </div>
    )}
  </ResizablePrimitive.PanelResizeHandle>
);

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
