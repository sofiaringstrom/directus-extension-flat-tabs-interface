<template>
  <v-form
    :initial-values="initialValues"
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
  import { toRefs } from "vue";
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
</script>
