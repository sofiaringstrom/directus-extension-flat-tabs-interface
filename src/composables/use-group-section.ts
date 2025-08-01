import { computed, ComputedRef } from "vue";

export interface GroupSection {
  id: string;
  title: string;
  name: string;
  index: number;
  fields: any[];
  meta?: any;
}

export interface UseGroupSectionOptions {
  children?: any[];
  value?: Record<string, any>;
}

export function useGroupSection(options: UseGroupSectionOptions) {
  const sections: ComputedRef<GroupSection[]> = computed(() => {
    if (!options.children || !Array.isArray(options.children)) {
      return [];
    }

    // Try to parse if it's a string
    let children = options.children;
    if (typeof children === "string") {
      try {
        children = JSON.parse(children);
      } catch (e) {
        return [];
      }
    }

    const filtered = children.filter((child) => {
      // Filter for group-raw fields that will become tabs
      return child.meta?.interface === "group-raw";
    });

    // If no group-raw fields found, try to use all children as sections
    const sectionsToProcess = filtered.length > 0 ? filtered : children;

    return sectionsToProcess.map((child, index) => {
      // Find all fields that belong to this tab (group)
      const tabFields = children.filter(
        (field) =>
          field.meta?.group === child.field && field.field !== child.field
      );

      // Include the group field itself with hideLabel: true (like the original extension)
      const fieldsInSection = [{ ...child, hideLabel: true }, ...tabFields];

      const section: GroupSection = {
        id: child.field,
        title: child.meta?.options?.title || child.name || `Tab ${index + 1}`,
        name: child.name,
        index,
        fields: fieldsInSection,
        meta: child.meta,
      };

      return section;
    });
  });

  const getFieldValue = (sectionId: string, fieldName: string): any => {
    if (!options.value || !options.value[sectionId]) {
      return undefined;
    }
    return options.value[sectionId][fieldName];
  };

  const setFieldValue = (
    sectionId: string,
    fieldName: string,
    value: any
  ): Record<string, any> => {
    const updatedValue = { ...options.value };

    if (!updatedValue[sectionId]) {
      updatedValue[sectionId] = {};
    }

    updatedValue[sectionId][fieldName] = value;

    return updatedValue;
  };

  const getSectionValue = (sectionId: string): Record<string, any> => {
    return options.value?.[sectionId] || {};
  };

  const setSectionValue = (
    sectionId: string,
    value: Record<string, any>
  ): Record<string, any> => {
    const updatedValue = { ...options.value };
    updatedValue[sectionId] = value;
    return updatedValue;
  };

  return {
    sections,
    getFieldValue,
    setFieldValue,
    getSectionValue,
    setSectionValue,
  };
}
