/**
 * Deterministic @imageN tagging for reference strips.
 * Reordering renumbers tags immediately; prompts are NEVER rewritten.
 */

export interface ReferenceItem {
  id: string;
  assetId: string;
  label: string;
  characterId?: string | null;
  role?: "reference_image" | "first_frame" | "last_frame";
}

export interface TaggedReference extends ReferenceItem {
  tag: string;
  sortOrder: number;
}

export function renumberReferences(items: ReferenceItem[]): TaggedReference[] {
  return items.map((item, index) => ({
    ...item,
    tag: `@image${index + 1}`,
    sortOrder: index,
  }));
}

export function moveReference(
  items: ReferenceItem[],
  fromIndex: number,
  toIndex: number,
): TaggedReference[] {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length ||
    fromIndex === toIndex
  ) {
    return renumberReferences(items);
  }
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return renumberReferences(next);
}

export function copyTag(tag: string): string {
  return tag;
}
