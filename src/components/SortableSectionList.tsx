import React from 'react';

interface SectionDef {
  id: string;
  content: React.ReactNode;
}

interface SortableSectionListProps {
  /** Retained for call-site compatibility; process sections are deliberately fixed. */
  groupKey: string;
  sections: SectionDef[];
}

/**
 * Renders process sections in their physical flow order. Cards inside each section
 * remain sortable, but sections themselves cannot be moved into a wrong process order.
 */
const SortableSectionList: React.FC<SortableSectionListProps> = ({ sections }) => (
  <>
    {sections.map(section => (
      <React.Fragment key={section.id}>{section.content}</React.Fragment>
    ))}
  </>
);

export default SortableSectionList;
