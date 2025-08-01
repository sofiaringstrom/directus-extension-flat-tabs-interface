import type { Field, ValidationError } from "@directus/types";
import { Ref, computed, unref } from "vue";
import { useI18n } from "vue-i18n";

/**
 * Options interface for the useGroupSection composable
 */
interface UseGroupSectionOptions {
  /** The current field being processed (typically a group field) */
  field: Ref<Field>;
  /** All available fields in the form */
  fields: Ref<Field[]>;
  /** Current form values */
  values: Ref<Record<string, unknown>>;
  /** Validation errors for the form */
  validationErrors: Ref<ValidationError[]>;
}

/**
 * Composable for managing group sections in Directus forms
 *
 * This composable handles the logic for group fields and their nested fields,
 * including field filtering, validation error tracking, and edit state management.
 * It's primarily used in tab interfaces to organize fields into logical sections.
 *
 * @param options - Configuration options for the group section
 * @param options.field - The current field being processed (typically a group field)
 * @param options.fields - All available fields in the form
 * @param options.values - Current form values
 * @param options.validationErrors - Validation errors for the form
 *
 * @returns An object containing:
 * - fieldsInSection: Computed array of fields that belong to this section
 * - edited: Computed boolean indicating if any fields in this section have been modified
 * - validationMessage: Computed validation message for this section
 *
 * @example
 * ```typescript
 * const { fieldsInSection, edited, validationMessage } = useGroupSection({
 *   field: ref(currentField),
 *   fields: ref(allFields),
 *   values: ref(formValues),
 *   validationErrors: ref(errors)
 * });
 * ```
 */
export function useGroupSection({
  field,
  fields: groupFields,
  values,
  validationErrors,
}: UseGroupSectionOptions) {
  const { t } = useI18n();

  /**
   * Computed array of fields that belong to this section
   *
   * This includes the main field itself and all nested fields if the main field
   * is a group field. The main field's label is hidden since it's typically
   * used as a section header.
   */
  const fieldsInSection = computed(() => {
    const fields: Field[] = [
      Object.assign({}, unref(field), { hideLabel: true }),
    ];

    if (unref(field).meta?.special?.includes("group")) {
      fields.push(
        ...getFieldsForGroup(unref(field).meta?.field, [], unref(groupFields))
      );
    }

    return fields;
  });

  /**
   * Computed boolean indicating if any fields in this section have been modified
   *
   * Checks if any of the fields in this section have corresponding values
   * in the form values object, indicating they have been edited.
   */
  const edited = computed(() => {
    if (!unref(values)) return false;

    const editedFields = Object.keys(unref(values));
    return fieldsInSection.value.some((field) =>
      editedFields.includes(field.field)
    );
  });

  /**
   * Computed validation message for this section
   *
   * Finds the first validation error that applies to this section (either
   * the main field or any of its nested fields) and returns a localized
   * error message.
   */
  const validationMessage = computed(() => {
    const validationError = unref(validationErrors).find(
      (error) =>
        error.field === unref(field).field ||
        unref(fieldsInSection).find((field) => field.field === error.field)
    );
    if (validationError === undefined) return;

    if (validationError.code === "RECORD_NOT_UNIQUE") {
      return t("validationError.unique");
    } else {
      return t(`validationError.${validationError.type}`, validationError);
    }
  });

  return { fieldsInSection, edited, validationMessage };
}

/**
 * Recursively gets all fields that belong to a specific group
 *
 * This function traverses the field hierarchy to find all fields that belong
 * to a given group, including nested group fields. It prevents infinite loops
 * by tracking already processed groups.
 *
 * @param group - The group identifier to search for, or null for ungrouped fields
 * @param passed - Array of already processed group identifiers to prevent loops
 * @param groupFields - All available fields to search through
 * @returns Array of fields that belong to the specified group
 *
 * @example
 * ```typescript
 * const fields = getFieldsForGroup("personal_info", [], allFields);
 * // Returns all fields that belong to the "personal_info" group
 * ```
 */
function getFieldsForGroup(
  group: undefined | string,
  passed: string[] = [],
  groupFields: Field[]
): Field[] {
  const fieldsInGroup: Field[] = groupFields.filter((field) => {
    return field.meta?.group === group || (group === null && !field.meta);
  });

  for (const field of fieldsInGroup) {
    if (
      field.meta?.special?.includes("group") &&
      !passed.includes(field.meta!.field)
    ) {
      passed.push(field.meta!.field);
      fieldsInGroup.push(
        ...getFieldsForGroup(field.meta!.field, passed, groupFields)
      );
    }
  }

  return fieldsInGroup;
}
