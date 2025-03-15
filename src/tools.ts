export function isLightTheme(): boolean {
  return document.body.getAttribute('data-jp-theme-light') === 'true';
}

/**
 * Recursively processes a nested JavaScript object, replacing Base64-encoded
 * function strings with actual functions.
 *
 * This function iterates through all properties of the input object (and
 * recursively through any nested objects).  If it finds a string value that
 * starts with the prefix `'__ipecharts_jsfn__::'`, it assumes the rest of the
 * string is a Base64-encoded JSON representation of the function's arguments
 * and body. It then decodes the string, parses the JSON, and creates a new
 * function using the `Function` constructor, replacing the original string
 * with the created function.
 *
 */
export function processRawOption(obj: any) {
  for (const key in obj) {
    if (obj[key]) {
      const value = obj[key];

      if (
        typeof value === 'string' &&
        value.startsWith('__ipecharts_jsfn__::')
      ) {
        const funcStr = value.replace('__ipecharts_jsfn__::', '');
        const decodedString = atob(funcStr);
        const jsonObject = JSON.parse(decodedString);
        const fn = new Function(...jsonObject);
        obj[key] = fn;
      } else if (typeof value === 'object' && value !== null) {
        // Recursively process nested objects
        processRawOption(value);
      }
    }
  }
}
