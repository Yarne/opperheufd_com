/**
 * Load and inject HTML partials into the page
 * @param {string} targetId - Element ID to inject HTML into
 * @param {string} path - Path to the HTML file
 */
async function loadPartial(targetId, path) {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      console.warn(`Failed to load partial ${path}: ${response.statusText}`);
      return;
    }
    const html = await response.text();
    document.getElementById(targetId).innerHTML = html;
  } catch (error) {
    console.error(`Error loading partial ${path}:`, error);
  }
}

/**
 * Load and parse JSON from a file
 * @param {string} path - Path to the JSON file
 * @returns {Promise<any>} - Parsed JSON data
 */
async function loadJSON(path) {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      console.warn(`Failed to load JSON ${path}: ${response.statusText}`);
      return null;
    }
    return response.json();
  } catch (error) {
    console.error(`Error loading JSON ${path}:`, error);
    return null;
  }
}
