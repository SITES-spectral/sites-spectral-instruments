/**
 * SITES Spectral - Skeleton Screen Components (ES6 Module)
 *
 * Provides utilities for creating skeleton loading states.
 * Uses safe DOM methods (no innerHTML) to prevent XSS vulnerabilities.
 *
 * @module components/skeleton
 * @version 13.15.0
 */

/**
 * Helper to create an element with classes
 * @private
 */
function createElement(tag, classes) {
    const el = document.createElement(tag);
    if (Array.isArray(classes)) {
        classes.forEach(c => el.classList.add(c));
    } else if (classes) {
        classes.split(' ').forEach(c => {
            if (c) el.classList.add(c);
        });
    }
    return el;
}

/**
 * Create a skeleton text element
 * @param {Object} options - Configuration options
 * @param {string} options.size - Size: 'sm', 'md', 'lg', 'title'
 * @param {string} options.width - Custom width (CSS value)
 * @returns {HTMLElement}
 */
export function text(options = {}) {
    const { size = 'md', width } = options;
    const el = createElement('div', `skeleton skeleton-text skeleton-text--${size}`);
    if (width) {
        el.style.width = width;
    }
    return el;
}

/**
 * Create a skeleton avatar element
 * @param {Object} options - Configuration options
 * @param {string} options.size - Size: 'sm', 'md', 'lg'
 * @returns {HTMLElement}
 */
export function avatar(options = {}) {
    const { size = 'md' } = options;
    return createElement('div', `skeleton skeleton-avatar skeleton-avatar--${size}`);
}

/**
 * Create a skeleton image placeholder
 * @param {Object} options - Configuration options
 * @param {string} options.variant - Variant: 'default', 'square', 'thumbnail'
 * @returns {HTMLElement}
 */
export function image(options = {}) {
    const { variant = 'default' } = options;
    const el = createElement('div', 'skeleton skeleton-image');
    if (variant !== 'default') {
        el.classList.add(`skeleton-image--${variant}`);
    }
    return el;
}

/**
 * Create a skeleton button placeholder
 * @param {Object} options - Configuration options
 * @param {string} options.size - Size: 'sm', 'md', 'lg'
 * @returns {HTMLElement}
 */
export function button(options = {}) {
    const { size = 'md' } = options;
    const el = createElement('div', 'skeleton skeleton-button');
    if (size !== 'md') {
        el.classList.add(`skeleton-button--${size}`);
    }
    return el;
}

/**
 * Create a generic skeleton block
 * @param {Object} options - Configuration options
 * @param {string} options.width - Width (CSS value)
 * @param {string} options.height - Height (CSS value)
 * @param {string} options.borderRadius - Border radius (CSS value)
 * @returns {HTMLElement}
 */
export function block(options = {}) {
    const { width = '100%', height = '1rem', borderRadius = '4px' } = options;
    const el = createElement('div', 'skeleton');
    el.style.width = width;
    el.style.height = height;
    el.style.borderRadius = borderRadius;
    return el;
}

/**
 * Create a station card skeleton
 * @returns {HTMLElement}
 */
export function stationCard() {
    const card = createElement('div', 'skeleton-station-card');

    // Header
    const header = createElement('div', 'skeleton-station-card__header');
    header.appendChild(createElement('div', 'skeleton skeleton-station-card__icon'));

    const titleGroup = createElement('div', 'skeleton-station-card__title-group');
    titleGroup.appendChild(createElement('div', 'skeleton skeleton-station-card__title'));
    titleGroup.appendChild(createElement('div', 'skeleton skeleton-station-card__subtitle'));
    header.appendChild(titleGroup);

    card.appendChild(header);

    // Stats
    const stats = createElement('div', 'skeleton-station-card__stats');
    for (let i = 0; i < 3; i++) {
        stats.appendChild(createElement('div', 'skeleton skeleton-station-card__stat'));
    }
    card.appendChild(stats);

    return card;
}

/**
 * Create a platform card skeleton
 * @param {number} instrumentCount - Number of instrument placeholders
 * @returns {HTMLElement}
 */
export function platformCard(instrumentCount = 3) {
    const card = createElement('div', 'skeleton-platform-card');

    // Header
    const header = createElement('div', 'skeleton-platform-card__header');
    header.appendChild(createElement('div', 'skeleton skeleton-platform-card__title'));
    header.appendChild(createElement('div', 'skeleton skeleton-platform-card__badge'));
    card.appendChild(header);

    // Instruments
    const instruments = createElement('div', 'skeleton-platform-card__instruments');
    for (let i = 0; i < instrumentCount; i++) {
        instruments.appendChild(createElement('div', 'skeleton skeleton-platform-card__instrument'));
    }
    card.appendChild(instruments);

    return card;
}

/**
 * Create a table row skeleton
 * @param {number} cellCount - Number of cells
 * @returns {HTMLElement}
 */
export function tableRow(cellCount = 4) {
    const row = createElement('div', 'skeleton-table-row');

    for (let i = 0; i < cellCount; i++) {
        const cell = createElement('div', 'skeleton skeleton-table-row__cell');
        if (i === 0) {
            cell.classList.add('skeleton-table-row__cell--id');
        } else if (i === 1) {
            cell.classList.add('skeleton-table-row__cell--name');
        } else if (i === cellCount - 1) {
            cell.classList.add('skeleton-table-row__cell--status');
        } else {
            cell.style.flex = '1';
        }
        row.appendChild(cell);
    }

    return row;
}

/**
 * Create an instrument list item skeleton
 * @returns {HTMLElement}
 */
export function instrumentItem() {
    const item = createElement('div', 'skeleton-instrument-item');

    item.appendChild(createElement('div', 'skeleton skeleton-instrument-item__icon'));

    const info = createElement('div', 'skeleton-instrument-item__info');
    info.appendChild(createElement('div', 'skeleton skeleton-instrument-item__name'));
    info.appendChild(createElement('div', 'skeleton skeleton-instrument-item__type'));
    item.appendChild(info);

    item.appendChild(createElement('div', 'skeleton skeleton-instrument-item__status'));

    return item;
}

/**
 * Create a stat card skeleton
 * @returns {HTMLElement}
 */
export function statCard() {
    const card = createElement('div', 'skeleton-stat-card');
    card.appendChild(createElement('div', 'skeleton skeleton-stat-card__label'));
    card.appendChild(createElement('div', 'skeleton skeleton-stat-card__value'));
    return card;
}

/**
 * Create a chart skeleton
 * @returns {HTMLElement}
 */
export function chart() {
    const chartEl = createElement('div', 'skeleton-chart');

    // Header
    const header = createElement('div', 'skeleton-chart__header');
    header.appendChild(createElement('div', 'skeleton skeleton-chart__title'));

    const legend = createElement('div', 'skeleton-chart__legend');
    legend.appendChild(createElement('div', 'skeleton skeleton-chart__legend-item'));
    legend.appendChild(createElement('div', 'skeleton skeleton-chart__legend-item'));
    header.appendChild(legend);

    chartEl.appendChild(header);
    chartEl.appendChild(createElement('div', 'skeleton skeleton-chart__area'));

    return chartEl;
}

/**
 * Create a form field skeleton
 * @returns {HTMLElement}
 */
export function formField() {
    const field = createElement('div', 'skeleton-modal-content__field');
    field.appendChild(createElement('div', 'skeleton skeleton-modal-content__label'));
    field.appendChild(createElement('div', 'skeleton skeleton-modal-content__input'));
    return field;
}

/**
 * Replace element content with skeleton loading state
 * @param {HTMLElement} container - Container element
 * @param {Function} skeletonBuilder - Function that returns skeleton elements
 * @returns {Function} Restore function to call when loading is complete
 */
export function showIn(container, skeletonBuilder) {
    // Store original children
    const originalChildren = [];
    while (container.firstChild) {
        originalChildren.push(container.removeChild(container.firstChild));
    }

    // Add skeleton classes
    container.classList.add('skeleton-container', 'is-loading');

    // Add skeleton content
    const skeleton = skeletonBuilder();
    if (skeleton instanceof HTMLElement) {
        container.appendChild(skeleton);
    } else if (skeleton instanceof DocumentFragment) {
        container.appendChild(skeleton);
    } else if (Array.isArray(skeleton)) {
        skeleton.forEach(el => container.appendChild(el));
    }

    // Return restore function
    return function restore(newContent) {
        // Clear skeleton
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        container.classList.remove('skeleton-container', 'is-loading');

        if (newContent !== undefined) {
            if (newContent instanceof HTMLElement) {
                container.appendChild(newContent);
            } else if (newContent instanceof DocumentFragment) {
                container.appendChild(newContent);
            } else if (Array.isArray(newContent)) {
                newContent.forEach(el => container.appendChild(el));
            }
        } else {
            // Restore original content
            originalChildren.forEach(child => container.appendChild(child));
        }
    };
}

/**
 * Create multiple skeleton elements
 * @param {Function} builder - Builder function
 * @param {number} count - Number of elements to create
 * @returns {DocumentFragment}
 */
export function repeat(builder, count) {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
        fragment.appendChild(builder());
    }
    return fragment;
}

/**
 * Create a station list skeleton
 * @param {number} count - Number of stations
 * @returns {DocumentFragment}
 */
export function stationList(count = 6) {
    return repeat(() => stationCard(), count);
}

/**
 * Create a platform list skeleton
 * @param {number} count - Number of platforms
 * @returns {DocumentFragment}
 */
export function platformList(count = 4) {
    return repeat(() => platformCard(), count);
}

/**
 * Create a table skeleton
 * @param {number} rowCount - Number of rows
 * @param {number} cellCount - Cells per row
 * @returns {HTMLElement}
 */
export function table(rowCount = 5, cellCount = 4) {
    const container = createElement('div', 'skeleton-table');
    for (let i = 0; i < rowCount; i++) {
        container.appendChild(tableRow(cellCount));
    }
    return container;
}

/**
 * Create a stats grid skeleton
 * @param {number} count - Number of stat cards
 * @returns {HTMLElement}
 */
export function statsGrid(count = 4) {
    const grid = createElement('div', 'skeleton-stats-grid');
    for (let i = 0; i < count; i++) {
        grid.appendChild(statCard());
    }
    return grid;
}

/**
 * Create a modal form skeleton
 * @param {number} fieldCount - Number of form fields
 * @returns {HTMLElement}
 */
export function modalForm(fieldCount = 6) {
    const container = createElement('div', 'skeleton-modal-content');
    const section = createElement('div', 'skeleton-modal-content__section');

    section.appendChild(createElement('div', 'skeleton skeleton-modal-content__section-title'));

    for (let i = 0; i < fieldCount; i++) {
        section.appendChild(formField());
    }

    container.appendChild(section);
    return container;
}

/**
 * Create an instrument list skeleton
 * @param {number} count - Number of instruments
 * @returns {HTMLElement}
 */
export function instrumentList(count = 5) {
    const list = createElement('div', 'skeleton-instrument-list');
    for (let i = 0; i < count; i++) {
        list.appendChild(instrumentItem());
    }
    return list;
}

/**
 * Skeleton namespace export
 */
export const Skeleton = {
    text,
    avatar,
    image,
    button,
    block,
    stationCard,
    platformCard,
    tableRow,
    instrumentItem,
    statCard,
    chart,
    formField,
    showIn,
    repeat,
    stationList,
    platformList,
    table,
    statsGrid,
    modalForm,
    instrumentList,
};

export default Skeleton;
