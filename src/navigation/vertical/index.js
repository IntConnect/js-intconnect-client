export default [
  {
    title: "Home",
    icon: { icon: "tabler-smart-home" },
    to: { name: "root" },
  },

  {
    title: "Configuration",
    to: { name: "root" },
    icon: { icon: "tabler-device-desktop-cog" },
    children: [
      {
        title: "Facilities",
        to: { name: "facilities" },
        icon: { icon: "tabler-building-factory-2" },
        requiredPermission: "FACILITY_VIEW",
      },
      {
        title: "Machines",
        to: { name: "machines" },
        icon: { icon: "tabler-brand-databricks" },
        requiredPermission: "MACHINE_VIEW",
      },
      {
        title: "Parameter",
        to: { name: "parameters" },
        icon: { icon: "tabler-binary-tree-2" },
        requiredPermission: "PARAMETER_VIEW",
      },
      {
        title: "Register",
        to: { name: "registers" },
        icon: { icon: "tabler-circuit-resistor" },
        requiredPermission: "PARAMETER_VIEW",
      },
    ],
  },
  {
    title: "Connection",
    icon: { icon: "tabler-network" },
    children: [
      {
        title: "MQTT Broker",
        to: { name: "mqtt-broker" },
        icon: { icon: "tabler-cooker" },
        requiredPermission: "MQTT_BROKER_VIEW",
      },
      {
        title: "MQTT Topic",
        to: { name: "mqtt-topic" },
        icon: { icon: "tabler-topology-star-3" },
        requiredPermission: "MQTT_TOPIC_VIEW",
      },
      {
        title: "SMTP Server",
        to: { name: "smtp-server" },
        icon: { icon: "tabler-mail" },
        requiredPermission: "SMTP_SERVER_VIEW",
      },
      {
        title: "Modbus Server",
        to: { name: "modbus-server" },
        icon: { icon: "tabler-server-spark" },
        requiredPermission: "MODBUS_SERVER_VIEW",
      },
    ],
  },

  {
    title: "User Management",
    icon: { icon: "tabler-user" },
    children: [
      {
        title: "Role & User",
        to: { name: "users" },
        icon: { icon: "tabler-user" },
        requiredPermission: "ROLE_USER_VIEW",
      },
      {
        title: "Permissions",
        to: { name: "permissions" },
        icon: { icon: "tabler-brand-auth0" },
        requiredPermission: "PERMISSION_VIEW",
      },
      {
        title: "Audit Log",
        to: { name: "audit-logs" },
        icon: { icon: "tabler-adjustments-cog" },
        requiredPermission: "AUDIT_LOG_VIEW",
      },
    ],
  },
  {
    title: "Document",
    icon: { icon: "tabler-clipboard-data" },
    children: [
      {
        title: "Report Document Template",
        to: { name: "report-document-templates" },
        icon: { icon: "tabler-clipboard-text" },
        requiredPermission: "REPORT_DOCUMENT_TEMPLATE_VIEW",
      },
      {
        title: "Generate Report",
        to: { name: "generate-reports" },
        icon: { icon: "tabler-file-type-doc" },
        requiredPermission: "GENERATE_REPORT_VIEW",
      },
      {
        title: "Check Sheet Document Template",
        to: { name: "check-sheet-document-templates" },
        icon: { icon: "tabler-checkup-list" },
        requiredPermission: "CHECK_SHEET_DOCUMENT_TEMPLATE_VIEW",
      },
      {
        title: "Check Sheet",
        to: { name: "check-sheets" },
        icon: { icon: "tabler-file-type-doc" },
        requiredPermission: "CHECK_SHEET_VIEW",
      },
    ],
  },

  {
    title: "System Settings",
    icon: { icon: "tabler-settings-spark" },
    to: { name: "system-settings" },
    requiredPermission: "SYSTEM_SETTING_VIEW",
  },

  {
    title: "Alarm Log",
    to: { name: "alarm-logs" },
    icon: { icon: "tabler-bell-minus" },
    requiredPermission: "ALARM_LOG_VIEW",
  },
];
