<template>
  <div class="flat-tabs-interface">
    <TabsRoot
      :default-value="sections[0].id"
      :value="activeTab"
      :unmount-on-hide="false"
      @update:value="handleTabChange"
      class="tabs-root"
      :class="`align-${align}`"
    >
      <TabsList class="tabs-list">
        <TabsTrigger
          v-for="section in sections"
          :key="section.id"
          :value="section.id"
          class="tabs-trigger"
        >
          {{ section.title }}
        </TabsTrigger>
        <TabsIndicator class="tabs-indicator">
          <div class="indicator-bar" />
        </TabsIndicator>
      </TabsList>

      <TabsContent
        v-for="section in sections"
        :key="section.id"
        :value="section.id"
        class="tabs-content"
      >
        <div class="tab-fields">
          <v-form
            :initial-values="actualValues"
            :fields="section.fields"
            :model-value="actualValues"
            :primary-key="'+'"
            :group="section.id"
            :validation-errors="[]"
            :loading="false"
            :batch-mode="false"
            :disabled="false"
            :show-no-visible-fields="false"
            :show-validation-errors="false"
            @update:model-value="(values) => emit('input', values)"
            class="tab-form"
          />
        </div>
      </TabsContent>
    </TabsRoot>
  </div>
</template>

<script setup>
  import {
    TabsContent,
    TabsIndicator,
    TabsList,
    TabsRoot,
    TabsTrigger,
  } from "reka-ui";
  import { defineEmits, defineProps, ref, watch, useAttrs } from "vue";
  import { useGroupSection } from "./composables/use-group-section";

  const props = defineProps({
    value: {
      type: Object,
      default: () => ({}),
    },
    align: {
      type: String,
      default: "left",
    },
    // Directus group fields will be passed as children
    children: {
      type: Array,
      default: () => [],
    },
    // Alternative props that Directus might pass
    fields: {
      type: Array,
      default: () => [],
    },
    values: {
      type: Object,
      default: () => ({}),
    },
  });

  const emit = defineEmits(["input"]);

  const attrs = useAttrs();

  // Try to get the actual field data from attrs - use the same approach as original extension
  const actualFields = attrs.fields || props.fields || props.children || [];
  const actualValues = attrs.values || props.values || props.value || {};

  // Use the group section composable
  const { sections } = useGroupSection({
    children: actualFields,
    value: actualValues,
  });

  // Track active tab
  const activeTab = ref(null);

  // Set initial active tab when sections are available
  watch(
    sections,
    (newSections) => {
      if (newSections.length > 0) {
        activeTab.value = newSections[0].id;
      }
    },
    { immediate: true }
  );

  // Handle tab change
  function handleTabChange(value) {
    activeTab.value = value;
  }
</script>

<style scoped>
  .flat-tabs-interface {
    width: 100%;
  }

  .tabs-list {
    position: relative;
    display: flex;
    flex-shrink: 0;
    border-bottom: var(--theme--border-width) solid var(--theme--border-color);
    color: var(--header-color, var(--theme--foreground));
    margin-bottom: 16px;
  }

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

  .tabs-content {
    flex-grow: 1;
    outline: none;

    &[data-state="inactive"] {
      display: none;
    }
  }
</style>
