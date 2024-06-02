export function isLightTheme(): boolean {
  return document.body.getAttribute('data-jp-theme-light') === 'true';
}
