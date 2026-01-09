<template>
  <v-form
    :key="`${field.field}-${primaryKey}`"
    :initial-values="filteredInitialValues"
    :fields="fieldsInSection"
    :model-value="filteredValues"
    :primary-key="primaryKey"
    :group="group"
    :validation-errors="validationErrors"
    :loading="loading"
    :batch-mode="batchMode"
    :disabled="disabled"
    :direction="direction"
    :show-no-visible-fields="false"
    :show-validation-errors="false"
    @update:model-value="handleModelUpdate"
  />
</template>

<script setup lang="ts">
  import type { Field, ValidationError } from "@directus/types";
  import { computed, toRefs } from "vue";
  import { useGroupSection } from "./composables/use-group-section";
  import { isEqual } from "lodash-es";

  const props = withDefaults(
    defineProps<{
      initialValues: Record<string, unknown>;
      field: Field;
      fields: Field[];
      values: Record<string, unknown>;
      allValues: Record<string, unknown>;
      primaryKey: string | number;
      group: string;
      disabled?: boolean;
      batchMode?: boolean;
      batchActiveFields?: string[];
      loading?: boolean;
      validationErrors?: ValidationError[];
      badge?: string;
      rawEditorEnabled?: boolean;
      direction?: string;
    }>(),
    {
      batchActiveFields: () => [],
      validationErrors: () => [],
      allValues: () => ({}),
    }
  );

  const emit = defineEmits<{
    (e: "apply", value: Record<string, unknown>): void;
  }>();

  const { fieldsInSection } = useGroupSection(toRefs(props));

  /**
   * Computed property that filters initial values to only include those
   * that belong to the fields in this section. This ensures that draft
   * values are properly displayed for the correct fields.
   */
  const filteredInitialValues = computed(() => {
    if (!props.initialValues || !fieldsInSection.value) return {};

    const filteredValues: Record<string, unknown> = {};
    const fieldNames = new Set<string>();

    // Get all field names that belong to this section
    fieldsInSection.value.forEach((field) => {
      fieldNames.add(field.field);
    });

    // Filter initial values to only include those for fields in this section
    Object.keys(props.initialValues).forEach((key) => {
      if (fieldNames.has(key)) {
        filteredValues[key] = props.initialValues[key];
      }
    });

    return filteredValues;
  });

  /**
   * Computed property that filters current values to only include those
   * that belong to the fields in this section.
   */
  const filteredValues = computed(() => {
    if (!props.values || !fieldsInSection.value) return {};

    const result: Record<string, unknown> = {};
    const fieldNames = new Set<string>();

    fieldsInSection.value.forEach((field) => {
      fieldNames.add(field.field);
    });

    Object.keys(props.values).forEach((key) => {
      if (fieldNames.has(key)) {
        result[key] = props.values[key];
      }
    });

    return result;
  });

  /**
   * Handles v-form model updates by building the complete set of edits.
   * - Fields outside this tab are preserved from allValues
   * - Fields inside this tab are only included if they differ from initial values
   * - Fields reset to their initial value are excluded (no "unsaved changes" indicator)
   */
  function handleModelUpdate(newValues: Record<string, unknown>) {
    // Get the set of field names that belong to this tab
    const tabFieldNames = new Set(fieldsInSection.value.map((f) => f.field));

    // Start with values from outside this tab (preserve them)
    const mergedValues: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(props.allValues)) {
      if (!tabFieldNames.has(key)) {
        mergedValues[key] = value;
      }
    }

    // Add tab fields only if they differ from initial values
    // Fields equal to initial values are excluded (not considered edits)
    for (const [key, newValue] of Object.entries(newValues)) {
      const initialValue = filteredInitialValues.value[key];
      if (!isEqual(newValue, initialValue)) {
        mergedValues[key] = newValue;
      }
    }

    // Only emit if the result differs from current allValues
    if (!isEqual(mergedValues, props.allValues)) {
      emit("apply", mergedValues);
    }
  }
</script>
