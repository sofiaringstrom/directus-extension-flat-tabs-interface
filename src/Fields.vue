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
   * Handles v-form model updates by computing the delta and merging with
   * allValues (which includes fields outside the tab) before emitting.
   * This prevents fields outside the tab interface from being cleared.
   */
  function handleModelUpdate(newValues: Record<string, unknown>) {
    const changes: Record<string, unknown> = {};

    // Compute what actually changed within this tab
    for (const key of Object.keys(newValues)) {
      if (!isEqual(filteredValues.value[key], newValues[key])) {
        changes[key] = newValues[key];
      }
    }

    if (Object.keys(changes).length > 0) {
      // Merge changes with ALL values (including fields outside tabs)
      const mergedValues = {
        ...props.allValues,
        ...changes,
      };
      emit("apply", mergedValues);
    }
  }
</script>
