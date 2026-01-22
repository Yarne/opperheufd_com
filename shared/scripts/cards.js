/**
 * Build a card element from template and item data
 * @param {Object} item - Card data {title, description, href, icon}
 * @param {HTMLTemplateElement} template - Card template element
 * @returns {DocumentFragment} - Card fragment ready to append
 */
function buildCard(item, template) {
  const card = template.content.cloneNode(true);
  const title = card.querySelector(".card-title");
  const description = card.querySelector(".card-description");

  if (item.href) {
    const link = document.createElement("a");
    link.href = item.href;
    link.textContent = item.title;
    title.append(link);
  } else {
    title.textContent = item.title;
  }

  if (description) {
    description.textContent = item.description;
  }

  return card;
}

/**
 * Render cards to the page
 * @param {Array<Object>} items - Array of card data objects
 * @param {string} containerId - ID of container element
 * @param {string} templateId - ID of template element
 */
function renderCards(items, containerId = "cards", templateId = "card-template") {
  const container = document.getElementById(containerId);
  const template = document.getElementById(templateId);
  
  if (!container || !template) {
    console.error(`Missing container (${containerId}) or template (${templateId})`);
    return;
  }

  const fragment = document.createDocumentFragment();

  items.forEach((item) => {
    fragment.append(buildCard(item, template));
  });

  container.append(fragment);
}

/**
 * Load and render cards from JSON file
 * @param {string} path - Path to cards JSON file
 * @param {string} containerId - ID of container element
 * @param {string} templateId - ID of template element
 */
async function loadAndRenderCards(path, containerId = "cards", templateId = "card-template") {
  const cards = await loadJSON(path);
  if (cards && Array.isArray(cards)) {
    renderCards(cards, containerId, templateId);
  }
}
