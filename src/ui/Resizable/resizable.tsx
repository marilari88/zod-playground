import {RxDragHandleDots2} from 'react-icons/rx'
import {Group, Panel, Separator, type SeparatorProps} from 'react-resizable-panels'
import classes from './Resizable.module.css'

const ResizablePanelGroup = ({className, ...props}: React.ComponentProps<typeof Group>) => (
  <Group className={`${classes.root} ${className}`} {...props} />
)

const ResizablePanel = Panel

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: SeparatorProps & {
  withHandle?: boolean
}) => (
  <Separator className={`${classes['panel_resize--handle']} ${className}`} {...props}>
    {withHandle && (
      <div className={classes.handle}>
        <RxDragHandleDots2 style={{height: '1rem', width: '1rem'}} />
      </div>
    )}
  </Separator>
)

export {ResizablePanelGroup, ResizablePanel, ResizableHandle}
