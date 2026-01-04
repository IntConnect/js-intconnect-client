export const COOKIE_MAX_AGE_1_YEAR = 365 * 24 * 60 * 60
export const ITEMS_PER_PAGE_OPTIONS = [{ value: 10, title: '10' }, { value: 25, title: '25' }, {
  value: 50,
  title: '50',
}, { value: 100, title: '100' }, { value: -1, title: 'All' }]
export const ItemsPerPage = ref(10)
export const ActionSuccess = "Your action was completed successfully"
export const SuccessManage = (featureName) => {
  return `Success manage ${featureName}`
} 
export const SuccessDelete = (featureName) => {
  return `Success delete ${featureName}`
} 
export const colorVariables = themeColors => {
  const themeSecondaryTextColor = `rgba(${hexToRgb(themeColors.colors['on-surface'])},${themeColors.variables['medium-emphasis-opacity']})`
  const themeDisabledTextColor = `rgba(${hexToRgb(themeColors.colors['on-surface'])},${themeColors.variables['disabled-opacity']})`
  const themeBorderColor = `rgba(${hexToRgb(String(themeColors.variables['border-color']))},${themeColors.variables['border-opacity']})`
  const themePrimaryTextColor = `rgba(${hexToRgb(themeColors.colors['on-surface'])},${themeColors.variables['high-emphasis-opacity']})`

  return { themeSecondaryTextColor, themeDisabledTextColor, themeBorderColor, themePrimaryTextColor }
}
