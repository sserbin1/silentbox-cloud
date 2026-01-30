const fs = require('fs');

// Simple 1x1 pixel PNG (purple #4F46E5) for placeholders
// This is a minimal valid PNG
const createPng = (width, height, r, g, b) => {
  // Create a simple PNG with solid color
  const { createCanvas } = require('canvas');
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
  ctx.fillRect(0, 0, width, height);
  // Draw "SB" text
  ctx.fillStyle = 'white';
  ctx.font = `bold ${Math.floor(width/3)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SB', width/2, height/2);
  return canvas.toBuffer('image/png');
};

console.log('Note: This requires canvas package. Using alternative method...');
