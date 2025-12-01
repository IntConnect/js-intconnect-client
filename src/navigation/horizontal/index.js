export default [
  {
    title: 'Home',
    to: { name: 'root' },
    icon: { icon: 'tabler-smart-home' },
  },
  {
    title: 'Pipeline',
    icon: { icon: 'tabler-code' },
    children: [
      {
        title: 'Dynamic Dashboard',
        to: { name: 'dynamic-dashboard' },
        icon: { icon: 'tabler-brand-tabler' },
      },
      {
        title: 'Drawings',
        to: { name: 'drawings' },
        icon: { icon: 'tabler-circuit-changeover' },
      },
      {
        title: 'Protocol Configurations',
        to: { name: 'protocol-configurations' },
        icon: { icon: 'tabler-server-cog' },
      },
      {
        title: 'Database Connections',
        to: { name: 'database-connections' },
        icon: { icon: 'tabler-database-star' },
      },

    ],
  },
  {
    title: 'Manage',
    to: { name: 'root' },
    icon: { icon: 'tabler-device-desktop-cog' },
    children: [
      {
        title: 'Machines',
        to: { name: 'machines' },
        icon: { icon: 'tabler-brand-databricks' },
      },
      {
        title: 'Parameter',
        to: { name: 'parameters' },
        icon: { icon: 'tabler-binary-tree-2' },
      },
      {
        title: 'User',
        to: { name: 'users' },
        icon: { icon: 'tabler-user' },
      },
      {
        title: 'Permissions',
        to: { name: 'permissions' },
        icon: { icon: 'tabler-brand-auth0' },
      },
    ],
  },
  {
    title: 'Connection',
    icon: { icon: 'tabler-network' },
    children: [
      {
        title: 'MQTT Broker',
        to: { name: 'mqtt-broker' },
        icon: { icon: 'tabler-cooker' },
      },
      {
        title: 'MQTT Topic',
        to: { name: 'mqtt-topic' },
        icon: { icon: 'tabler-topology-star-3' },
      },


    ],
  },

  {
    title: 'User Management',
    icon: { icon: 'tabler-user' },
    children: [
      {
        title: 'Role & User',
        to: { name: 'users' },
        icon: { icon: 'tabler-user' },
      },
      {
        title: 'Permissions',
        to: { name: 'permissions' },
        icon: { icon: 'tabler-brand-auth0' },
      },
      {
        title: 'Audit Log',
        to: { name: 'audit-logs' },
        icon: { icon: 'tabler-adjustments-cog' },
      },
    ],
  },

]
