/**
 * Browser-only and closure-free so Playwright can serialize this exact function.
 * Scrollable landmarks are not an overflow exemption: overflow-y:auto also
 * computes overflow-x:auto and can hide broken narrow-screen layouts.
 */
export function collectLayoutEvidence() {
  const tolerance = 1;
  const viewportWidth = document.documentElement.clientWidth;
  const normalize = (value) =>
    String(value || '')
      .replace(/\s+/g, ' ')
      .trim();
  const rounded = (value) => Math.round(value * 100) / 100;
  const describe = (element) => {
    const rect = element.getBoundingClientRect();
    return {
      tag: element.tagName.toLowerCase(),
      id: element.id || null,
      role: element.getAttribute('role'),
      className:
        typeof element.className === 'string' ? normalize(element.className).slice(0, 240) : null,
      text: normalize(element.textContent).slice(0, 160),
      left: rounded(rect.left),
      right: rounded(rect.right),
      top: rounded(rect.top),
      bottom: rounded(rect.bottom),
      width: rounded(rect.width),
      height: rounded(rect.height),
    };
  };
  const isVisible = (element) => {
    const rect = element.getBoundingClientRect();
    if (element.closest('[hidden],[aria-hidden="true"]') || rect.width <= 0 || rect.height <= 0)
      return false;
    for (let current = element; current; current = current.parentElement) {
      const style = getComputedStyle(current);
      if (
        style.display === 'none' ||
        ['hidden', 'collapse'].includes(style.visibility) ||
        Number.parseFloat(style.opacity || '1') <= 0
      )
        return false;
      // Screen-reader-only labels remain in the accessibility tree but paint
      // no pixels. Recognize their actual clipping geometry, not class names.
      const clip = style.clip.match(/^rect\(([^)]+)\)$/);
      if (clip && ['absolute', 'fixed'].includes(style.position)) {
        const values = clip[1].split(/[,\s]+/).filter(Boolean);
        if (values.length === 4 && values.every((value) => /^-?[\d.]+px$/.test(value))) {
          const [top, right, bottom, left] = values.map(Number.parseFloat);
          if (right <= left || bottom <= top) return false;
        }
      }
      const inset = style.clipPath.match(/^inset\(([^()]+)\)$/);
      if (inset) {
        const values = inset[1]
          .split(/\s+round\s+/)[0]
          .trim()
          .split(/\s+/);
        if (
          values.length >= 1 &&
          values.length <= 4 &&
          values.every((value) => /^-?[\d.]+(?:px|%)$/.test(value))
        ) {
          const [top, right = top, bottom = top, left = right] = values;
          const box = current.getBoundingClientRect();
          const pixels = (value, extent) =>
            Number.parseFloat(value) * (value.endsWith('%') ? extent / 100 : 1);
          if (
            pixels(left, box.width) + pixels(right, box.width) >= box.width ||
            pixels(top, box.height) + pixels(bottom, box.height) >= box.height
          )
            return false;
        }
      }
    }
    return true;
  };
  const isLandmark = (element) =>
    element === document.documentElement ||
    element === document.body ||
    element.matches('main,[role="main"]');
  const hasName = (element) => {
    if (normalize(element.getAttribute('aria-label'))) return true;
    return normalize(element.getAttribute('aria-labelledby'))
      .split(/\s+/)
      .some((id) => normalize(document.getElementById(id)?.textContent));
  };
  const isAllowedScrollRegion = (element) =>
    !isLandmark(element) &&
    element.getAttribute('data-screenshot-horizontal-scroll') === 'true' &&
    element.getAttribute('role') === 'region' &&
    element.tabIndex >= 0 &&
    !element.closest('[inert]') &&
    hasName(element) &&
    ['auto', 'scroll'].includes(getComputedStyle(element).overflowX);
  const outside = (rect, boundary) => ({
    left: Math.max(0, boundary.left - rect.left),
    right: Math.max(0, rect.right - boundary.right),
  });
  const clientBoundary = (element) => {
    const rect = element.getBoundingClientRect();
    // DOM client dimensions exclude borders and the vertical scrollbar.
    const scale = element.offsetWidth ? rect.width / element.offsetWidth : 1;
    const left = rect.left + (element.clientLeft || 0) * scale;
    return { left, right: left + element.clientWidth * scale };
  };
  const visibleElements = [...document.querySelectorAll('body, body *')].filter(isVisible);
  const meaningful = visibleElements.filter(
    (element) =>
      element.matches(
        'a[href],button,input,select,textarea,summary,[role],[tabindex],img,video,canvas,table,pre,code,p,h1,h2,h3,h4,h5,h6,li,dt,dd',
      ) ||
      [...element.childNodes].some(
        (node) => node.nodeType === Node.TEXT_NODE && normalize(node.textContent),
      ),
  );
  const viewportOverflowingElements = [];
  const clippedElements = [];
  for (const element of meaningful) {
    let rect = element.getBoundingClientRect();
    let clipped = null;
    for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
      const overflowX = getComputedStyle(ancestor).overflowX;
      if (isAllowedScrollRegion(ancestor)) {
        // Only this region's own boundary is exempt, not its outer ancestors.
        rect = ancestor.getBoundingClientRect();
        continue;
      }
      if (!['auto', 'scroll', 'hidden', 'clip'].includes(overflowX)) continue;
      const amount = outside(rect, clientBoundary(ancestor));
      if (!clipped && (amount.left > tolerance || amount.right > tolerance)) {
        clipped = {
          ...describe(element),
          clipped_by: describe(ancestor),
          overflow_x: overflowX,
          clipped_left_px: rounded(amount.left),
          clipped_right_px: rounded(amount.right),
        };
      }
    }
    if (rect.left < -tolerance || rect.right > viewportWidth + tolerance)
      viewportOverflowingElements.push(describe(element));
    if (clipped) clippedElements.push(clipped);
  }
  const horizontallyOverflowingContainers = visibleElements
    .filter(
      (element) =>
        element instanceof HTMLElement &&
        element.clientWidth > 0 &&
        element.scrollWidth > element.clientWidth + tolerance,
    )
    .filter(
      (element) =>
        !isAllowedScrollRegion(element) &&
        (isLandmark(element) ||
          ['auto', 'scroll', 'hidden', 'clip'].includes(getComputedStyle(element).overflowX)),
    )
    .map((element) => ({
      ...describe(element),
      client_width: element.clientWidth,
      scroll_width: element.scrollWidth,
      overflow_x: getComputedStyle(element).overflowX,
    }));
  const textOverflowingElements = [];
  for (const element of visibleElements) {
    if (element.matches('script,style,noscript,template')) continue;
    const textNodes = [...element.childNodes].filter(
      (node) => node.nodeType === Node.TEXT_NODE && normalize(node.textContent),
    );
    if (!textNodes.length) continue;
    // An inline span's box can grow with a long token. Check the nearest real
    // formatting container as well as text inside fixed-width block spans.
    let container = element;
    while (
      container &&
      (['inline', 'contents'].includes(getComputedStyle(container).display) ||
        !container.clientWidth)
    )
      container = container.parentElement;
    if (!container || isAllowedScrollRegion(container)) continue;
    const boundary = clientBoundary(container);
    for (const node of textNodes) {
      const range = document.createRange();
      range.selectNodeContents(node);
      const overflowingRects = [...range.getClientRects()].filter((rect) => {
        const amount = outside(rect, boundary);
        return rect.width > 0 && (amount.left > tolerance || amount.right > tolerance);
      });
      if (overflowingRects.length) {
        textOverflowingElements.push({
          ...describe(element),
          text: normalize(node.textContent).slice(0, 160),
          overflowing_container: describe(container),
          text_left: rounded(Math.min(...overflowingRects.map((rect) => rect.left))),
          text_right: rounded(Math.max(...overflowingRects.map((rect) => rect.right))),
        });
      }
    }
  }
  return {
    viewportOverflowingElements: viewportOverflowingElements.slice(0, 30),
    clippedElements: clippedElements.slice(0, 30),
    horizontallyOverflowingContainers: horizontallyOverflowingContainers.slice(0, 30),
    textOverflowingElements: textOverflowingElements.slice(0, 30),
  };
}
