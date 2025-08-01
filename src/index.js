import InterfaceComponent from "./interface.vue";

export default {
  id: "sr-flat-tabs-interface",
  name: "Flat Tabs",
  icon: "tab", // power_input
  group: "group",
  description: "A tab group interface as an alternative to accordion groups",
  component: InterfaceComponent,
  localTypes: ["group"],
  types: ["alias"],
  options: [
    {
      field: "align",
      type: "select",
      name: "Align Tabs",
      meta: {
        interface: "select-dropdown",
        options: {
          choices: [
            { text: "Left", value: "left" },
            { text: "Right", value: "right" },
            { text: "Center", value: "center" },
            { text: "Between", value: "between" },
            { text: "Stretch", value: "stretch" },
          ],
        },
      },
      schema: {
        default_value: "left",
      },
    },
  ],
};
