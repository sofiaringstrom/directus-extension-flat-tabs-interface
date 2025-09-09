<template>
  <v-form
    :key="`${field.field}-${primaryKey}`"
    :initial-values="filteredInitialValues"
    :fields="fieldsInSection"
    :model-value="values"
    :primary-key="primaryKey"
    :group="group"
    :validation-errors="validationErrors"
    :loading="loading"
    :batch-mode="batchMode"
    :disabled="disabled"
    :direction="direction"
    :show-no-visible-fields="false"
    :show-validation-errors="false"
    @update:model-value="$emit('apply', $event)"
  />
</template>

<script setup lang="ts">
  import type { Field, ValidationError } from "@directus/types";
  import { computed, toRefs } from "vue";
  import { useGroupSection } from "./composables/use-group-section";

  const props = withDefaults(
    defineProps<{
      initialValues: Record<string, unknown>;
      field: Field;
      fields: Field[];
      values: Record<string, unknown>;
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
    }
  );

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
</script>
