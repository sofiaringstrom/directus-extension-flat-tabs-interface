<!--
  Flat Tabs Interface Component
  
  This component creates a tabbed interface for Directus group fields, organizing
  form fields into logical sections with tabs. It automatically handles validation
  error navigation by switching to the appropriate tab when errors occur.
  
  Features:
  - Tabbed navigation for group fields
  - Automatic validation error tab switching
  - Responsive tab alignment options
  - Batch mode support
  - Loading states
-->
<template>
  <div class="flat-tabs-interface">
    <TabsRoot
      v-model="activeTab"
      :unmount-on-hide="false"
      @update:modelValue="(value) => handleTabChange(value)"
      class="tabs-root"
      :class="`align-${align}`"
    >
      <TabsList class="tabs-list">
        <TabsTrigger
          v-for="groupField in visibleGroupFields"
          :key="groupField.field"
          :value="groupField.field"
          class="tabs-trigger"
        >
          {{ groupField.name }}
        </TabsTrigger>
        <TabsIndicator class="tabs-indicator">
          <div class="indicator-bar" />
        </TabsIndicator>
      </TabsList>

      <TabsContent
        v-for="groupField in visibleGroupFields"
        :key="groupField.field"
        :value="groupField.field"
        class="tabs-content"
      >
        <div class="tab-fields">
          <Fields
            v-if="activeTab === groupField.field"
            :initial-values="initialValues"
            :field="groupField"
            :fields="fields"
            :values="groupValues"
            :all-values="values"
            :primary-key="primaryKey"
            :group="field.meta?.field ?? ''"
            :disabled="disabled"
            :batch-mode="batchMode"
            :batch-active-fields="batchActiveFields"
            :loading="loading"
            :validation-errors="validationErrors"
            :badge="badge"
            :raw-editor-enabled="rawEditorEnabled"
            :direction="direction"
            @apply="$emit('apply', $event)"
          />
        </div>
      </TabsContent>
    </TabsRoot>
  </div>
</template>

<script setup lang="ts">
  import type { Field, ValidationError } from "@directus/types";
  import {
    TabsContent,
    TabsIndicator,
    TabsList,
    TabsRoot,
    TabsTrigger,
  } from "reka-ui";
  import { ref, watch, computed } from "vue";
  import { isEqual } from "lodash-es";
  import Fields from "./Fields.vue";
  import { getFieldsForGroup } from "./composables/use-group-section";

  /**
   * Component props interface for the Flat Tabs Interface
   *
   * @interface FlatTabsInterfaceProps
   * @property {Field} field - The main field configuration (typically a group field)
   * @property {Field[]} fields - All available fields in the form
   * @property {Record<string, unknown>} values - Current form values
   * @property {Record<string, unknown>} initialValues - Initial form values
   * @property {boolean} [disabled] - Whether the interface is disabled
   * @property {boolean} [batchMode] - Whether batch editing mode is active
   * @property {string[]} [batchActiveFields] - Fields active in batch mode
   * @property {string|number} primaryKey - Primary key of the current record
   * @property {boolean} [loading] - Whether the interface is in loading state
   * @property {ValidationError[]} [validationErrors] - Validation errors to display
   * @property {string} [badge] - Badge text to display
   * @property {boolean} [rawEditorEnabled] - Whether raw editor is enabled
   * @property {string} [direction] - Text direction (ltr/rtl)
   * @property {string} [align] - Tab alignment (left, right, center, between, stretch)
   */

  const props = withDefaults(
    defineProps<{
      field: Field;
      fields: Field[];
      values: Record<string, unknown>;
      initialValues: Record<string, unknown>;
      disabled?: boolean;
      batchMode?: boolean;
      batchActiveFields?: string[];
      primaryKey: string | number;
      loading?: boolean;
      validationErrors?: ValidationError[];
      badge?: string;
      rawEditorEnabled?: boolean;
      direction?: string;
      align?: string;
    }>(),
    {
      batchActiveFields: () => [],
      validationErrors: () => [],
      align: "left",
    }
  );

  /**
   * Component emits interface
   *
   * @emits {apply} - Emitted when form values are applied/changed
   * @param {Record<string, unknown>} value - The updated form values
   */
  defineEmits<{
    (e: "apply", value: Record<string, unknown>): void;
  }>();

  /** Currently active tab identifier */
  const activeTab = ref<string | number | undefined>(undefined);

  /** Computed group fields and values from the useComputedGroup composable */
  const { groupFields, groupValues } = useComputedGroup();

  /**
   * Computed property that filters out empty tab groups.
   * A tab group is considered empty if it has no nested fields inside it.
   */
  const visibleGroupFields = computed(() => {
    return groupFields.value.filter((groupField) => {
      // Get nested fields for this group
      const nestedFields = getFieldsForGroup(
        groupField.meta?.field,
        [],
        props.fields
      );
      // Only include groups that have at least one nested field
      return nestedFields.length > 0;
    });
  });

  /**
   * Watcher for validation errors - automatically switches to the tab containing
   * the field with the first validation error
   */
  watch(
    () => props.validationErrors,
    (newVal, oldVal) => {
      if (!props.validationErrors || props.validationErrors.length === 0)
        return;
      if (isEqual(newVal, oldVal)) return;

      const firstError = props.validationErrors[0];
      const tabGroupForError = findTabGroupForField(firstError.field);
      if (tabGroupForError) {
        activeTab.value = tabGroupForError;
      }
    }
  );

  /**
   * Watcher to set the initial active tab when visible group fields are available
   * Sets the first non-empty tab as active by default
   */
  watch(
    () => visibleGroupFields.value,
    (newGroupFields) => {
      if (newGroupFields.length > 0) {
        activeTab.value = newGroupFields[0].field;
      }
    },
    { immediate: true }
  );

  /**
   * Handles tab change events from the tabs component
   *
   * @param {string|number} value - The identifier of the newly selected tab
   */
  function handleTabChange(value) {
    activeTab.value = value;
  }

  /**
   * Filters fields to only include those that belong to the current group
   *
   * @returns {Field[]} Array of fields that belong to the current group field
   */
  function limitFields() {
    return props.fields.filter(
      (field) => field.meta?.group === props.field.meta?.field
    );
  }

  /**
   * Recursively traces a field to its correct tab group
   *
   * This function finds which tab contains a specific field by following
   * the field's group hierarchy. It starts with the field's immediate group
   * and recursively checks parent groups until it finds a tab group.
   *
   * @param {string} fieldName - The name of the field to trace
   * @returns {string|null} The tab group identifier, or null if not found
   *
   * @example
   * ```typescript
   * // If field "title" belongs to group "class_group_1" which belongs to tab "personal_info"
   * const tabGroup = findTabGroupForField("title"); // Returns "personal_info"
   * ```
   */
  function findTabGroupForField(fieldName: string): string | null {
    // First, find the field in props.fields
    const field = props.fields.find((f) => f.field === fieldName);
    if (!field) return null;

    // Get the group of this field
    const fieldGroup = field.meta?.group;
    if (!fieldGroup) return null;

    // Check if this group is one of the tab groups
    const isTabGroup = groupFields.value.some(
      (tabField) => tabField.field === fieldGroup
    );
    if (isTabGroup) {
      return fieldGroup;
    }

    // If not a tab group, recursively find the parent group
    return findTabGroupForField(fieldGroup);
  }

  /**
   * Composable function that manages group fields and their values
   *
   * This function creates reactive references for group fields and their values,
   * with watchers that update them when the underlying props change. It ensures
   * that the component stays in sync with the parent form's state.
   *
   * @returns {Object} Object containing groupFields and groupValues refs
   * @returns {Ref<Field[]>} groupFields - Reactive array of fields in the current group
   * @returns {Ref<Record<string, any>>} groupValues - Reactive object of current form values
   */
  function useComputedGroup() {
    const groupFields = ref<Field[]>(limitFields());
    const groupValues = ref<Record<string, any>>({});

    // Watch for changes in the fields prop and update group fields accordingly
    watch(
      () => props.fields,
      () => {
        const newVal = limitFields();

        if (!isEqual(groupFields.value, newVal)) {
          groupFields.value = newVal;
        }
      }
    );

    // Watch for changes in the values prop and update group values accordingly
    // Filter values to only include those that belong to the current group
    watch(
      () => props.values,
      (newVal) => {
        const filteredValues = filterValuesForGroup(newVal, groupFields.value);
        if (!isEqual(groupValues.value, filteredValues)) {
          groupValues.value = filteredValues;
        }
      },
      { immediate: true }
    );

    return { groupFields, groupValues };
  }

  /**
   * Filters form values to only include those that belong to the current group
   *
   * @param {Record<string, any>} values - All form values
   * @param {Field[]} fields - Fields in the current group
   * @returns {Record<string, any>} Filtered values for the current group
   */
  function filterValuesForGroup(
    values: Record<string, any>,
    fields: Field[]
  ): Record<string, any> {
    if (!values || !fields) return {};

    const filteredValues: Record<string, any> = {};

    // Get all field names that belong to this group (including nested fields)
    const fieldNames = new Set<string>();

    fields.forEach((field) => {
      fieldNames.add(field.field);

      // If this is a group field, also add all its nested fields
      if (field.meta?.special?.includes("group")) {
        const nestedFields = getFieldsForGroup(
          field.meta?.field,
          [],
          props.fields
        );
        nestedFields.forEach((nestedField) => {
          fieldNames.add(nestedField.field);
        });
      }
    });

    // Filter values to only include those for fields in this group
    Object.keys(values).forEach((key) => {
      if (fieldNames.has(key)) {
        filteredValues[key] = values[key];
      }
    });

    return filteredValues;
  }
</script>

<style scoped>
  /* Main container for the flat tabs interface */
  .flat-tabs-interface {
    width: 100%;
  }

  /* Tab navigation list container */
  .tabs-list {
    position: relative;
    display: flex;
    flex-shrink: 0;
    border-bottom: var(--theme--border-width) solid var(--theme--border-color);
    color: var(--header-color, var(--theme--foreground));
    margin-bottom: 16px;
  }

  /* Tab alignment options */
  .align-left .tabs-list {
    justify-content: flex-start;
  }

  .align-right .tabs-list {
    justify-content: flex-end;
  }

  .align-center .tabs-list {
    justify-content: center;
  }

  .align-between .tabs-list {
    justify-content: space-between;
  }

  .align-stretch .tabs-list {
    justify-content: space-around;

    .tabs-trigger {
      flex: 1;
    }
  }

  /* Active tab indicator with smooth animations */
  .tabs-indicator {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 2px;
    width: var(--reka-tabs-indicator-size);
    transform: translateX(var(--reka-tabs-indicator-position)) translateY(1px);
    transition: width 0.3s ease, transform 0.3s ease;
    will-change: width, transform;

    .indicator-bar {
      background-color: var(--theme--primary);
      width: 100%;
      height: 100%;
      border-radius: 9999px;
    }
  }

  /* Individual tab trigger buttons with hover and focus states */
  .tabs-trigger {
    background-color: transparent;
    padding: 10px 16px;
    min-width: fit-content;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    color: var(--theme--foreground-normal);
    user-select: none;
    border: none;
    border-radius: var(--theme--border-radius, 4px)
      var(--theme--border-radius, 4px) 0 0;
    cursor: pointer;
    outline: none;
    transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out;

    &:hover {
      color: var(--theme--primary);
      background-color: var(--theme--background-subdued);
    }

    &[data-state="active"] {
      color: var(--theme--primary);
    }

    &:focus-visible {
      position: relative;
      box-shadow: 0 0 0 var(--theme--border-width) var(--theme--primary);
    }
  }

  /* Tab content container - hides inactive tabs */
  .tabs-content {
    flex-grow: 1;
    outline: none;

    &[data-state="inactive"] {
      display: none;
    }
  }
</style>
