'use client'

import {RxDragHandleDots2} from 'react-icons/rx'
import * as ResizablePrimitive from 'react-resizable-panels'
import classes from './Resizable.module.css'

const ResizablePanelGroup = ({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (
  <ResizablePrimitive.PanelGroup className={`${classes.root} ${className}`} {...props} />
)

const ResizablePanel = ResizablePrimitive.Panel

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean
}) => (
  <ResizablePrimitive.PanelResizeHandle
    className={`${classes['panel_resize--handle']} ${className}`}
    {...props}
  >
    {withHandle && (
      <div className={classes.handle}>
        <RxDragHandleDots2 style={{height: '1rem', width: '1rem'}} />
      </div>
    )}
  </ResizablePrimitive.PanelResizeHandle>
)

export {ResizablePanelGroup, ResizablePanel, ResizableHandle}
