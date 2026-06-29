import React, { useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { useCardOrder } from '@/hooks/useCardOrder';

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
}

const SortableItem: React.FC<SortableItemProps> = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.7 : 1,
    position: 'relative',
  };

  return (
    <div ref={setNodeRef} style={style} className="group relative">
      <button
        {...attributes}
        {...listeners}
        className="absolute -top-1 -left-1 z-20 p-1 rounded-md bg-muted/80 border border-border/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-grab active:cursor-grabbing touch-none"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-3 w-3 text-muted-foreground" />
      </button>
      {children}
    </div>
  );
};

interface SortableCardGridProps {
  groupKey: string;
  sensorIds: string[];
  className?: string;
  children: (orderedIds: string[]) => React.ReactNode;
}

const SortableCardGrid: React.FC<SortableCardGridProps> = ({
  groupKey,
  sensorIds,
  className,
  children,
}) => {
  const stableIds = useMemo(() => sensorIds, [sensorIds.join(',')]);
  const [order, updateOrder] = useCardOrder(groupKey, stableIds);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = order.indexOf(active.id as string);
      const newIndex = order.indexOf(over.id as string);
      updateOrder(arrayMove(order, oldIndex, newIndex));
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={order} strategy={rectSortingStrategy}>
        <div className={className}>
          {children(order)}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export { SortableItem };
export default SortableCardGrid;
