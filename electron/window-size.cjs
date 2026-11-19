function constrainWindowSize(size, area) {
  const width = Math.min(size.width, area.width), height = Math.min(size.height, area.height);
  return { ...size, width, height,
    ...(size.minWidth !== undefined ? { minWidth: Math.min(size.minWidth, width) } : {}),
    ...(size.minHeight !== undefined ? { minHeight: Math.min(size.minHeight, height) } : {}),
  };
}

function windowSize(size, parent) {
  const { screen } = require('electron');
  const display = parent && !parent.isDestroyed()
    ? screen.getDisplayMatching(parent.getBounds()) : screen.getPrimaryDisplay();
  return constrainWindowSize(size, display.workAreaSize);
}

module.exports = { constrainWindowSize, windowSize };
