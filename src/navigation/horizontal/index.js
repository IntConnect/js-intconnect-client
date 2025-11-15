export default [
  {
    title: 'Home',
    to: { name: 'root' },
    icon: { icon: 'tabler-smart-home' },
  },
  {
    title: 'Drawings',
    to: { name: 'dynamic-dashboard' },
    icon: { icon: 'tabler-brand-tabler' },
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
      {
        title: 'Machines',
        to: { name: 'database-connections' },
        icon: { icon: 'tabler-building-factory' },
      },
    ],
  },
  {
    title: 'Manage',
    to: { name: 'root' },
    icon: { icon: 'tabler-device-desktop-cog' },
    children: [
      {
        title: 'User',
        to: { name: 'user' },
        icon: { icon: 'tabler-user' },
      },
      {
        title: 'Permission',
        to: { name: 'permission' },
        icon: { icon: 'tabler-brand-auth0' },
      },
    ],
  },

]
