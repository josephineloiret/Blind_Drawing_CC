let hidden_drawing; 
let hidden=true;
let X;
let Y;
let color = [0, 0, 0]; //color array
let colorPickerX = 470; //x position of color box
let colorPickerY = 37; //y position of color box
let colorPickerWidth = 200;
let colorPickerHeight = 70; //reduced to fit in panel
let colorPickerBuffer;
let brushSize = 5; //brush size
let brushType = 'pencil'; //brush type: 'pencil', 'pen', 'watercolor', 'paintbrush'
let brushSizeSliderX = 850; //slider position
let brushSizeSliderY = 95; //slider position (below brush buttons on second row)
let brushSizeSliderWidth = 300; //slider track width
let brushSizeSliderHeight = 4; //slider track height
let minBrushSize = 1;
let maxBrushSize = 50;
let draggingSlider = false;
let selectionMode = false; //true when in selection mode
let selectionRect = null; //{x1, y1, x2, y2} or null if no selection
let selectingRect = false; //true when dragging to create selection
let selectStartX, selectStartY; //start position of selection drag
//periwinkle blue color constants
const PERIWINKLE_R = 160;
const PERIWINKLE_G = 160;
const PERIWINKLE_B = 225;
//responsive canvas sizing
const BASE_WIDTH = 1500;
const BASE_HEIGHT = 800;
let canvasScale = 1;

function setup(){
  //calculate canvas size to fit viewport
  let availableWidth = windowWidth - 100; //leave some margin
  let availableHeight = windowHeight - 200; //leave room for title/subtitle and margins
  
  //calculate scale to fit base dimensions within available space
  let scaleX = availableWidth / BASE_WIDTH;
  let scaleY = availableHeight / BASE_HEIGHT;
  canvasScale = min(scaleX, scaleY, 1); //never scale up, only down
  
  //create canvas with scaled dimensions
  let canvasWidth = BASE_WIDTH * canvasScale;
  let canvasHeight = BASE_HEIGHT * canvasScale;
  let canvas = createCanvas(canvasWidth, canvasHeight);
  canvas.parent('canvas-container');
  
  //hidden drawing uses base dimensions for quality
  hidden_drawing=createGraphics(BASE_WIDTH, BASE_HEIGHT);
  hidden_drawing.background('white'); //drawing background
  hidden_drawing.stroke(0); //drawing color
  hidden_drawing.strokeWeight(brushSize); //thickness of drawing
  
  //create color picker buffer
  colorPickerBuffer = createGraphics(colorPickerWidth, colorPickerHeight);
  drawColorPickerToBuffer();
}

function draw(){
  //gradient-like background
  background(20, 20, 30);
  
  //show drawing or not
  if (!hidden){ //if hidden is false, drawing will be shown fully
    image(hidden_drawing, 0, 0, width, height);
  } else {
    //if hidden is true, show black overlay
    if (selectionRect === null) {
      //no selection - hide entire drawing
      fill(0, 0, 0);
      noStroke();
      rect(0, 0, width, height);
    } else {
      //selection exists - show black overlay with only selected area visible
      push();
      //draw black overlay covering entire canvas
      fill(0, 0, 0);
      noStroke();
      rect(0, 0, width, height);
      
      //use clip to show only the selected rectangle area
      drawingContext.save();
      drawingContext.beginPath();
      let x1 = min(selectionRect.x1, selectionRect.x2) * canvasScale;
      let y1 = min(selectionRect.y1, selectionRect.y2) * canvasScale;
      let x2 = max(selectionRect.x1, selectionRect.x2) * canvasScale;
      let y2 = max(selectionRect.y1, selectionRect.y2) * canvasScale;
      drawingContext.rect(x1, y1, x2 - x1, y2 - y1);
      drawingContext.clip();
      //show drawing in clipped area
      image(hidden_drawing, 0, 0, width, height);
      drawingContext.restore();
      pop();
    }
  }
  
  //draw selection rectangle outline if in selection mode
  if (selectionMode) {
    if (selectingRect) {
      //show rectangle being dragged
      push();
      noFill();
      stroke(255, 255, 0); //yellow outline
      strokeWeight(2);
      let currentDrawingX = getDrawingX(mouseX);
      let currentDrawingY = getDrawingY(mouseY);
      let x1 = min(selectStartX, currentDrawingX) * canvasScale;
      let y1 = min(selectStartY, currentDrawingY) * canvasScale;
      let x2 = max(selectStartX, currentDrawingX) * canvasScale;
      let y2 = max(selectStartY, currentDrawingY) * canvasScale;
      rect(x1, y1, x2 - x1, y2 - y1);
      pop();
    } else if (selectionRect !== null) {
      //show current selection rectangle
      push();
      noFill();
      stroke(255, 255, 255); //white outline
      strokeWeight(2);
      let x1 = min(selectionRect.x1, selectionRect.x2) * canvasScale;
      let y1 = min(selectionRect.y1, selectionRect.y2) * canvasScale;
      let x2 = max(selectionRect.x1, selectionRect.x2) * canvasScale;
      let y2 = max(selectionRect.y2, selectionRect.y2) * canvasScale;
      rect(x1, y1, x2 - x1, y2 - y1);
      pop();
    }
  }
  
  //draw instructions panel with rounded background (on top)
  drawInstructions();
  
  //draw color picker (on top)
  drawColorPicker();
}

function drawColorPickerToBuffer(){
  //draw rectangular color picker
  //X axis = Hue (0-360), Y axis = Brightness (100% white at top, 0% black at bottom)
  //Saturation varies: 0% at top (white), 100% in middle, then back down as brightness decreases
  for (let x = 0; x < colorPickerWidth; x += 2) {
    for (let y = 0; y < colorPickerHeight; y += 2) {
      //calculate hue based on x position (0 to 360 degrees)
      let hue = map(x, 0, colorPickerWidth, 0, 360);
      //calculate brightness/value based on y position (100% at top, 0% at bottom)
      let bright = map(y, 0, colorPickerHeight, 100, 0);
      
      //calculate saturation: 0% at very top (white), 100% in upper-middle, then decrease as we approach black
      let sat;
      if (bright >= 60) {
        //top area: transition from white (sat=0) to full color (sat=100) - larger transition zone
        sat = map(bright, 100, 60, 0, 100);
      } else if (bright <= 10) {
        //bottom area: transition from full color to black (sat decreases)
        sat = map(bright, 10, 0, 100, 0);
      } else {
        //middle area: full saturation
        sat = 100;
      }
      
      //convert HSV to RGB
      let rgb = hsvToRgb(hue, sat, bright);
      
      colorPickerBuffer.fill(rgb[0], rgb[1], rgb[2]);
      colorPickerBuffer.noStroke();
      colorPickerBuffer.rect(x, y, 2, 2);
    }
  }
  
  //draw border
  colorPickerBuffer.stroke(200);
  colorPickerBuffer.strokeWeight(2);
  colorPickerBuffer.noFill();
  colorPickerBuffer.rect(0, 0, colorPickerWidth, colorPickerHeight);
}

function rgbToHsv(r, g, b) {
  r = r / 255;
  g = g / 255;
  b = b / 255;
  
  let max = Math.max(r, g, b);
  let min = Math.min(r, g, b);
  let delta = max - min;
  
  let h = 0;
  if (delta !== 0) {
    if (max === r) {
      h = ((g - b) / delta);
      if (h < 0) h += 6;
    } else if (max === g) {
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }
  }
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  if (h >= 360) h -= 360;
  
  let s = max === 0 ? 0 : Math.round((delta / max) * 100);
  let v = Math.round(max * 100);
  
  return [h, s, v];
}

function drawColorPicker(){
  push();
  scale(canvasScale);
  
  //draw cached color picker (no separate background - uses main panel background)
  image(colorPickerBuffer, colorPickerX, colorPickerY);
  
  //calculate position of current color on picker
  let hsv = rgbToHsv(color[0], color[1], color[2]);
  let hue = hsv[0];
  let bright = hsv[2]; //use brightness/value
  
  //map hue to x position (0-360 to 0-width)
  let selectorX = map(hue, 0, 360, colorPickerX, colorPickerX + colorPickerWidth);
  //map brightness to y position (100% at top, 0% at bottom)
  let selectorY = map(bright, 100, 0, colorPickerY, colorPickerY + colorPickerHeight);
  
  //clamp to picker bounds
  selectorX = constrain(selectorX, colorPickerX, colorPickerX + colorPickerWidth);
  selectorY = constrain(selectorY, colorPickerY, colorPickerY + colorPickerHeight);
  
  //draw current color indicator at calculated position
  //use white stroke for dark colors, black for light colors
  let isDark = bright < 50;
  fill(color[0], color[1], color[2]);
  stroke(isDark ? 255 : 0);
  strokeWeight(2);
  circle(selectorX, selectorY, 10);
  
  pop();
}

function hsvToRgb(h, s, v) {
  //convert HSV to RGB
  h = h / 360;
  s = s / 100;
  v = v / 100;
  
  let r, g, b;
  let i = floor(h * 6);
  let f = h * 6 - i;
  let p = v * (1 - s);
  let q = v * (1 - f * s);
  let t = v * (1 - (1 - f) * s);
  
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  
  return [floor(r * 255), floor(g * 255), floor(b * 255)];
}

function getColorFromPicker(mx, my) {
  //convert screen coordinates to base UI coordinates
  let baseX = mx / canvasScale;
  let baseY = my / canvasScale;
  
  //check if click is within color picker bounds
  if (baseX < colorPickerX || baseX > colorPickerX + colorPickerWidth ||
      baseY < colorPickerY || baseY > colorPickerY + colorPickerHeight) {
    return null;
  }
  
  //calculate hue based on x position (0 to 360 degrees)
  let hue = map(baseX, colorPickerX, colorPickerX + colorPickerWidth, 0, 360);
  //calculate brightness/value based on y position (100% at top, 0% at bottom)
  let bright = map(baseY, colorPickerY, colorPickerY + colorPickerHeight, 100, 0);
  
  //calculate saturation: 0% at very top (white), 100% in upper-middle, then decrease as we approach black
  let sat;
  if (bright >= 60) {
    //top area: transition from white (sat=0) to full color (sat=100) - larger transition zone
    sat = map(bright, 100, 60, 0, 100);
  } else if (bright <= 10) {
    //bottom area: transition from full color to black (sat decreases)
    sat = map(bright, 10, 0, 100, 0);
  } else {
    //middle area: full saturation
    sat = 100;
  }
  
  //convert to RGB
  return hsvToRgb(hue, sat, bright);
}

function drawInstructions(){
  push();
  scale(canvasScale);
  
  //draw clean panel background - reduced height since no title
  fill(255, 255, 255, 250);
  noStroke();
  rect(0, 0, BASE_WIDTH, 120);
  
  //left side buttons - before color (stacked vertically)
  let buttonSpacing = 12; //consistent spacing between buttons
  
  //calculate centered position for stacked buttons - bigger size
  let leftBtnWidth = 170;
  let leftBtnHeight = 38;
  let totalLeftButtonsHeight = leftBtnHeight * 2 + buttonSpacing;
  let leftButtonsCenterY = 60;
  let leftBtnX = 20;
  
  //Selection Mode toggle button (top)
  let selectModeBtnY = leftButtonsCenterY - totalLeftButtonsHeight / 2;
  fill(selectionMode ? 45 : PERIWINKLE_R, selectionMode ? 55 : PERIWINKLE_G, selectionMode ? 72 : PERIWINKLE_B);
  stroke(selectionMode ? 45 : PERIWINKLE_R, selectionMode ? 55 : PERIWINKLE_G, selectionMode ? 72 : PERIWINKLE_B);
  strokeWeight(1);
  rect(leftBtnX, selectModeBtnY, leftBtnWidth, leftBtnHeight, 3);
  fill(255);
  textSize(13);
  textStyle(NORMAL);
  textAlign(CENTER);
  text(selectionMode ? 'Drawing Mode' : 'Selection Mode', leftBtnX + leftBtnWidth/2, selectModeBtnY + 25);
  textAlign(LEFT);
  
  //Reveal/Hide button (below Selection Mode)
  let revealBtnY = selectModeBtnY + leftBtnHeight + buttonSpacing;
  fill(hidden ? PERIWINKLE_R : 45, hidden ? PERIWINKLE_G : 55, hidden ? PERIWINKLE_B : 72);
  stroke(hidden ? PERIWINKLE_R : 45, hidden ? PERIWINKLE_G : 55, hidden ? PERIWINKLE_B : 72);
  strokeWeight(1);
  rect(leftBtnX, revealBtnY, leftBtnWidth, leftBtnHeight, 3);
  fill(255);
  textSize(13);
  textStyle(NORMAL);
  textAlign(CENTER);
  text(hidden ? 'Reveal' : 'Hide', leftBtnX + leftBtnWidth/2, revealBtnY + 25);
  textAlign(LEFT);
  
  //Clear Selection button (only show if there's a selection)
  if (selectionRect !== null) {
    let clearSelBtnX = leftBtnX + leftBtnWidth + buttonSpacing;
    fill(PERIWINKLE_R, PERIWINKLE_G, PERIWINKLE_B);
    stroke(PERIWINKLE_R, PERIWINKLE_G, PERIWINKLE_B);
    strokeWeight(1);
    rect(clearSelBtnX, revealBtnY, 140, leftBtnHeight, 3);
    fill(255);
    textSize(13);
    textStyle(NORMAL);
    textAlign(CENTER);
    text('Clear Selection', clearSelBtnX + 70, revealBtnY + 25);
    textAlign(LEFT);
  }
  
  //color section - with better spacing from left buttons
  fill(45, 55, 72);
  textFont('Inter');
  textSize(15);
  textStyle(BOLD);
  text('Color:', 420, 30);
  
  //draw current color swatch
  fill(color[0], color[1], color[2]);
  stroke(200);
  strokeWeight(2);
  rect(420, 37, 42, 26, 3);
  
  //brush type section - with better spacing from color
  noStroke(); //remove any stroke/outline
  fill(0, 0, 0); //black color
  textFont('Inter');
  textSize(15);
  textStyle(BOLD);
  text('Brush:', 850, 30);
  
  //brush type buttons - positioned on top row
  let brushTypes = ['pencil', 'pen', 'watercolor', 'paintbrush'];
  let brushX = 850;
  let brushY = 37;
  let brushBtnWidth = 70;
  let brushBtnHeight = 30;
  let brushSpacing = 8; //increased spacing for better visual separation
  
  for (let i = 0; i < brushTypes.length; i++) {
    let btnX = brushX + i * (brushBtnWidth + brushSpacing);
    let isActive = brushType === brushTypes[i];
    
    //draw button border only (no background fill)
    noFill();
    stroke(isActive ? 45 : 200);
    strokeWeight(isActive ? 2 : 1);
    rect(btnX, brushY, brushBtnWidth, brushBtnHeight, 3);
    
    //draw brush preview that matches actual brush behavior
    push();
    let previewX = btnX + brushBtnWidth / 2;
    let previewY = brushY + brushBtnHeight / 2;
    let previewStartX = previewX - 15;
    let previewEndX = previewX + 15;
    
    if (brushTypes[i] === 'pencil') {
      //pencil preview - cross-hatched grainy texture like actual brush
      noStroke();
      fill(color[0], color[1], color[2]);
      
      //draw multiple layers with cross-hatching
      for (let layer = 0; layer < 2; layer++) {
        let layerOpacity = [0.5, 0.8][layer];
        for (let p = 0; p < 15; p++) {
          let t = p / 14;
          let px = lerp(previewStartX, previewEndX, t);
          
          //add cross-hatch variation
          let crossOffset = sin(t * PI * 6) * 1.5;
          px += crossOffset;
          
          //draw multiple parallel lines
          for (let l = 0; l < 5; l++) {
            let offset = (l - 2) * 1.5;
            let lineX = px;
            let lineY = previewY + offset;
            
            let noiseVal1 = noise(lineX * 0.4, lineY * 0.4, layer * 100 + l);
            let noiseVal2 = noise(lineX * 0.3, lineY * 0.3, layer * 100 + l + 50);
            let combinedNoise = (noiseVal1 + noiseVal2 * 0.7) / 1.7;
            
            if (combinedNoise > 0.3) {
              let opacity = layerOpacity * map(combinedNoise, 0, 1, 0.3, 1.0);
              let dotSize = brushSize * (0.15 + combinedNoise * 0.35);
              drawingContext.globalAlpha = opacity;
              circle(lineX, lineY, dotSize);
            }
          }
        }
      }
      drawingContext.globalAlpha = 1.0;
      
    } else if (brushTypes[i] === 'pen') {
      //pen preview - smooth with ink bleed
      stroke(color[0], color[1], color[2]);
      strokeCap(ROUND);
      strokeWeight(brushSize);
      line(previewStartX, previewY, previewEndX, previewY);
      
      //add subtle bleed
      drawingContext.globalAlpha = 0.25;
      strokeWeight(brushSize * 1.8);
      line(previewStartX, previewY, previewEndX, previewY);
      drawingContext.globalAlpha = 1.0;
      
    } else if (brushTypes[i] === 'watercolor') {
      //watercolor preview - fragmented particles with organic clustering
      noStroke();
      fill(color[0], color[1], color[2]);
      
      //draw particles with better clustering like actual brush
      for (let p = 0; p < 20; p++) {
        let t = p / 19;
        let baseX = lerp(previewStartX, previewEndX, t);
        
        //multiple noise layers for organic clustering
        let noiseVal1 = noise(baseX * 0.18, previewY * 0.18, p);
        let noiseVal2 = noise(baseX * 0.12, previewY * 0.12, p + 100);
        let noiseVal3 = noise(baseX * 0.25, previewY * 0.25, p + 200);
        let combinedNoise = (noiseVal1 * 0.4 + noiseVal2 * 0.3 + noiseVal3 * 0.3);
        
        //create clusters and gaps
        if (combinedNoise > 0.32 && noiseVal2 > 0.22) {
          let particleSize = brushSize * (0.2 + noiseVal2 * 1.2);
          
          //organic position variation
          let offsetX = (noiseVal1 - 0.5) * 4;
          let offsetY = (noiseVal2 - 0.5) * 4;
          
          //vary opacity for depth
          let opacity = map(combinedNoise, 0, 1, 0.5, 1.0) * (0.7 + noiseVal2 * 0.3);
          drawingContext.globalAlpha = opacity;
          
          circle(baseX + offsetX, previewY + offsetY, particleSize);
        }
      }
      drawingContext.globalAlpha = 1.0;
      
    } else if (brushTypes[i] === 'paintbrush') {
      //paintbrush preview - bristle marks
      stroke(color[0], color[1], color[2]);
      fill(color[0], color[1], color[2]);
      strokeCap(ROUND);
      
      //draw multiple bristle strokes
      let bristleCount = 4;
      for (let b = 0; b < bristleCount; b++) {
        let offset = (b - bristleCount/2) * 2;
        let noiseVal = noise(previewX * 0.2, previewY * 0.2, b);
        let weight = brushSize * (0.5 + noiseVal * 0.5);
        let opacity = map(noiseVal, 0, 1, 0.7, 1.0);
        
        drawingContext.globalAlpha = opacity;
        strokeWeight(weight);
        line(previewStartX, previewY + offset, previewEndX, previewY + offset + (noiseVal - 0.5) * 2);
      }
      drawingContext.globalAlpha = 1.0;
    }
    pop();
    
    //draw full label name - same font, same weight (not bold when selected)
    push();
    fill(isActive ? 45 : 113);
    textFont('Inter'); //use same font as rest of UI
    textSize(10); //bigger size
    textStyle(NORMAL); //always NORMAL weight - never bold
    let label = brushTypes[i].charAt(0).toUpperCase() + brushTypes[i].substring(1);
    textAlign(CENTER);
    text(label, btnX + brushBtnWidth/2, brushY + brushBtnHeight + 14);
    textAlign(LEFT); //reset alignment
    pop();
  }
  
  //draw brush size slider
  drawBrushSizeSlider();
  
  //right side buttons - after brushes (stacked vertically, centered)
  let rightBtnWidth = 170;
  let rightBtnHeight = 38;
  let totalRightButtonsHeight = rightBtnHeight * 2 + buttonSpacing;
  let buttonsCenterY = brushSizeSliderY - 30;
  let saveBtnY = buttonsCenterY - totalRightButtonsHeight / 2;
  let saveBtnX = BASE_WIDTH - rightBtnWidth - 20;
  
  //Save button (top)
  fill(PERIWINKLE_R, PERIWINKLE_G, PERIWINKLE_B);
  stroke(PERIWINKLE_R, PERIWINKLE_G, PERIWINKLE_B);
  strokeWeight(1);
  rect(saveBtnX, saveBtnY, rightBtnWidth, rightBtnHeight, 3);
  fill(255);
  textSize(13);
  textStyle(NORMAL);
  textAlign(CENTER);
  text('Save', saveBtnX + rightBtnWidth/2, saveBtnY + 25);
  textAlign(LEFT);
  
  //Clear Drawing button (below Save)
  let clearDrawBtnY = saveBtnY + rightBtnHeight + buttonSpacing;
  fill(PERIWINKLE_R, PERIWINKLE_G, PERIWINKLE_B);
  stroke(PERIWINKLE_R, PERIWINKLE_G, PERIWINKLE_B);
  strokeWeight(1);
  rect(saveBtnX, clearDrawBtnY, rightBtnWidth, rightBtnHeight, 3);
  fill(255);
  textSize(13);
  textStyle(NORMAL);
  textAlign(CENTER);
  text('Clear Drawing', saveBtnX + rightBtnWidth/2, clearDrawBtnY + 25);
  textAlign(LEFT);
  
  pop();
}

function drawBrushSizeSlider(){
  //calculate slider thumb position based on brushSize
  let sliderValue = map(brushSize, minBrushSize, maxBrushSize, 0, brushSizeSliderWidth);
  let thumbX = brushSizeSliderX + sliderValue;
  let thumbY = brushSizeSliderY;
  let thumbRadius = 8;
  
  //draw slider track
  fill(100, 100, 100); //dark gray track
  noStroke();
  rect(brushSizeSliderX, brushSizeSliderY - brushSizeSliderHeight/2, brushSizeSliderWidth, brushSizeSliderHeight, 2);
  
  //draw minus indicator on left
  fill(100, 100, 100);
  rect(brushSizeSliderX - 8, brushSizeSliderY - 1, 6, 2);
  
  //draw plus indicator on right
  fill(100, 100, 100);
  let plusX = brushSizeSliderX + brushSizeSliderWidth + 8;
  //horizontal line
  rect(plusX - 3, brushSizeSliderY - 1, 6, 2);
  //vertical line
  rect(plusX - 1, brushSizeSliderY - 3, 2, 6);
  
  //draw slider thumb (white circle with shadow)
  push();
  //shadow
  fill(0, 0, 0, 20);
  noStroke();
  circle(thumbX + 1, thumbY + 1, thumbRadius * 2);
  //thumb
  fill(255); //white
  noStroke();
  circle(thumbX, thumbY, thumbRadius * 2);
  pop();
}

//start drawing function
function mousePressed(){
  //convert mouse coordinates to base UI coordinates for UI checks
  let uiMouseX = mouseX / canvasScale;
  let uiMouseY = mouseY / canvasScale;
  
  //check if clicking on selection mode button (left side - top, stacked)
  let buttonSpacing = 12;
  let leftBtnWidth = 170;
  let leftBtnHeight = 38;
  let totalLeftButtonsHeight = leftBtnHeight * 2 + buttonSpacing;
  let leftButtonsCenterY = 60;
  let leftBtnX = 20;
  
  let selectModeBtnY = leftButtonsCenterY - totalLeftButtonsHeight / 2;
  if (uiMouseX >= leftBtnX && uiMouseX <= leftBtnX + leftBtnWidth &&
      uiMouseY >= selectModeBtnY && uiMouseY <= selectModeBtnY + leftBtnHeight) {
    selectionMode = !selectionMode;
    selectingRect = false;
    return;
  }
  
  //check if clicking on Reveal/Hide button (left side - below Selection Mode)
  let revealBtnY = selectModeBtnY + leftBtnHeight + buttonSpacing;
  if (uiMouseX >= leftBtnX && uiMouseX <= leftBtnX + leftBtnWidth &&
      uiMouseY >= revealBtnY && uiMouseY <= revealBtnY + leftBtnHeight) {
    hidden = !hidden;
    return;
  }
  
  //check if clicking on clear selection button
  if (selectionRect !== null) {
    let clearSelBtnX = leftBtnX + leftBtnWidth + buttonSpacing;
    if (uiMouseX >= clearSelBtnX && uiMouseX <= clearSelBtnX + 140 &&
        uiMouseY >= revealBtnY && uiMouseY <= revealBtnY + leftBtnHeight) {
      selectionRect = null;
      return;
    }
  }
  
  //if in selection mode, start creating selection rectangle
  if (selectionMode) {
    //don't start selection if clicking in UI area
    if (uiMouseY < 120) return;
    
    selectingRect = true;
    selectStartX = getDrawingX(mouseX);
    selectStartY = getDrawingY(mouseY);
    return; //don't draw when in selection mode
  }
  
  //check if clicking on color picker
  let newColor = getColorFromPicker(mouseX, mouseY);
  if (newColor !== null) {
    color = newColor;
    return; //don't start drawing if selecting color
  }
  
  //check if clicking on brush type buttons
  let brushTypes = ['pencil', 'pen', 'watercolor', 'paintbrush'];
  let brushX = 850;
  let brushY = 37;
  let brushBtnWidth = 70;
  let brushBtnHeight = 30;
  let brushSpacing = 8; //increased spacing
  
  if (uiMouseY >= brushY && uiMouseY <= brushY + brushBtnHeight + 20) {
    for (let i = 0; i < brushTypes.length; i++) {
      let btnX = brushX + i * (brushBtnWidth + brushSpacing);
      if (uiMouseX >= btnX && uiMouseX <= btnX + brushBtnWidth) {
        brushType = brushTypes[i];
        return; //don't start drawing if selecting brush type
      }
    }
  }
  
  //check if clicking on brush size slider (check before instruction area check)
  let thumbRadius = 8;
  let sliderValue = map(brushSize, minBrushSize, maxBrushSize, 0, brushSizeSliderWidth);
  let thumbX = brushSizeSliderX + sliderValue;
  let thumbY = brushSizeSliderY;
  
  //check if clicking on slider thumb or track (with larger hit area)
  if (uiMouseY >= brushSizeSliderY - thumbRadius - 5 && uiMouseY <= brushSizeSliderY + thumbRadius + 5 &&
      uiMouseX >= brushSizeSliderX - thumbRadius && uiMouseX <= brushSizeSliderX + brushSizeSliderWidth + thumbRadius) {
    draggingSlider = true;
    updateBrushSizeFromSlider();
    return; //don't start drawing if adjusting slider
  }
  
  //check if clicking on Save/Clear Drawing buttons (right side)
  let rightBtnWidth = 170;
  let rightBtnHeight = 38;
  let totalRightButtonsHeight = rightBtnHeight * 2 + buttonSpacing;
  let buttonsCenterY = brushSizeSliderY - 30;
  let saveBtnY = buttonsCenterY - totalRightButtonsHeight / 2;
  let saveBtnX = BASE_WIDTH - rightBtnWidth - 20;
  
  if (uiMouseX >= saveBtnX && uiMouseX <= saveBtnX + rightBtnWidth &&
      uiMouseY >= saveBtnY && uiMouseY <= saveBtnY + rightBtnHeight) {
    saveCanvas(hidden_drawing, 'drawing', 'png');
    return;
  }
  
  let clearDrawBtnY = saveBtnY + rightBtnHeight + buttonSpacing;
  if (uiMouseX >= saveBtnX && uiMouseX <= saveBtnX + rightBtnWidth &&
      uiMouseY >= clearDrawBtnY && uiMouseY <= clearDrawBtnY + rightBtnHeight) {
    hidden_drawing.background('white');
    return;
  }
  
  //don't start drawing if clicking in instruction area (but allow slider area)
  if (uiMouseY < 120) return;
  
  //convert screen coordinates to drawing coordinates
  X = getDrawingX(mouseX); //x position
  Y = getDrawingY(mouseY); //y position
}

//function called when mouse is dragged while being pressed 
function mouseDragged(){
  //if in selection mode and dragging selection rectangle
  if (selectionMode && selectingRect) {
    //selection rectangle is updated in draw() function via mouseX/mouseY
    return; //don't draw when selecting
  }
  
  //don't draw if in selection mode
  if (selectionMode) return;
  
  //check if dragging brush size slider
  if (draggingSlider) {
    updateBrushSizeFromSlider();
    return; //don't draw if adjusting slider
  }
  
  //check if dragging on color picker
  let newColor = getColorFromPicker(mouseX, mouseY);
  if (newColor !== null) {
    color = newColor;
    return; //don't draw if selecting color
  }
  
  //don't draw if in instruction area (but allow slider dragging)
  if ((mouseY < 120 * canvasScale || Y < 120) && !draggingSlider) return;
  
  //convert current mouse position to drawing coordinates
  let currentX = getDrawingX(mouseX);
  let currentY = getDrawingY(mouseY);
  
  //draw based on brush type - all use same brushSize, different textures
  hidden_drawing.push();
  let distVal = dist(X, Y, currentX, currentY);
  let angle = atan2(currentY - Y, currentX - X);
  let speed = distVal / max(1, frameCount % 60); //approximate speed
  let steps = max(30, floor(distVal / 0.8));
  
  if (brushType === 'pencil') {
    //pencil - advanced grainy texture with directional shading and realistic graphite
    hidden_drawing.noStroke();
    hidden_drawing.fill(color[0], color[1], color[2]);
    
    let brushWidth = brushSize * 2.2;
    let perpAngle = angle + PI/2;
    
    //draw multiple layers with advanced shading
    for (let layer = 0; layer < 4; layer++) {
      let layerOpacity = [0.3, 0.5, 0.7, 0.9][layer];
      let layerWidth = brushWidth * (1 - layer * 0.15);
      
      for (let i = 0; i <= steps * 4; i++) {
        let t = i / (steps * 4);
        let px = lerp(X, currentX, t);
        let py = lerp(Y, currentY, t);
        
        //directional shading strokes
        let lineCount = 12;
        for (let l = 0; l < lineCount; l++) {
          let offset = (l - lineCount/2) * (layerWidth / lineCount);
          let lineX = px + cos(perpAngle) * offset;
          let lineY = py + sin(perpAngle) * offset;
          
          //advanced cross-hatching with multiple directions
          let hatchAngle1 = angle + PI/4 + sin(t * PI * 8) * 0.3;
          let hatchAngle2 = angle - PI/4 + cos(t * PI * 8) * 0.3;
          let crossOffset1 = sin(t * PI * 10 + l * 0.5) * brushSize * 0.25;
          let crossOffset2 = cos(t * PI * 7 + l * 0.7) * brushSize * 0.2;
          
          lineX += cos(hatchAngle1) * crossOffset1 + cos(hatchAngle2) * crossOffset2;
          lineY += sin(hatchAngle1) * crossOffset1 + sin(hatchAngle2) * crossOffset2;
          
          //realistic graphite grain with multiple noise layers
          let noiseVal1 = noise(lineX * 0.5, lineY * 0.5, layer * 150 + l);
          let noiseVal2 = noise(lineX * 0.3, lineY * 0.3, layer * 150 + l + 500);
          let noiseVal3 = noise(lineX * 0.7, lineY * 0.7, layer * 150 + l + 1000);
          
          let combinedNoise = (noiseVal1 + noiseVal2 * 0.7 + noiseVal3 * 0.5) / 2.2;
          let opacity = layerOpacity * map(combinedNoise, 0, 1, 0.3, 1.0);
          let dotSize = brushSize * (0.15 + combinedNoise * 0.5);
          
          hidden_drawing.drawingContext.globalAlpha = opacity;
          hidden_drawing.circle(lineX, lineY, dotSize);
        }
      }
    }
    hidden_drawing.drawingContext.globalAlpha = 1.0;
    
  } else if (brushType === 'pen') {
    //pen - advanced ink flow with smooth pressure and realistic capillary action
    hidden_drawing.stroke(color[0], color[1], color[2]);
    hidden_drawing.strokeCap(ROUND);
    hidden_drawing.strokeJoin(ROUND);
    
    //draw with advanced pressure-sensitive width and ink flow
    let prevX = X;
    let prevY = Y;
    let prevPressure = 0.5;
    
    for (let i = 1; i <= steps; i++) {
      let t = i / steps;
      let px = lerp(X, currentX, t);
      let py = lerp(Y, currentY, t);
      
      //smooth pressure curve with acceleration consideration
      let pressure = sin(t * PI);
      let pressureChange = abs(pressure - prevPressure);
      let weight = brushSize * (0.65 + pressure * 0.35 + pressureChange * 0.2);
      
      //draw main stroke with smooth transitions
      hidden_drawing.strokeWeight(weight);
      hidden_drawing.line(prevX, prevY, px, py);
      
      //advanced ink bleed with multiple layers and capillary action
      let bleedLayers = [
        {alpha: 0.3, size: 1.8},
        {alpha: 0.2, size: 2.5},
        {alpha: 0.12, size: 3.5},
        {alpha: 0.08, size: 4.5}
      ];
      
      for (let bleed of bleedLayers) {
        hidden_drawing.drawingContext.globalAlpha = bleed.alpha;
        hidden_drawing.strokeWeight(weight * bleed.size);
        hidden_drawing.line(prevX, prevY, px, py);
      }
      
      hidden_drawing.drawingContext.globalAlpha = 1.0;
      
      prevX = px;
      prevY = py;
      prevPressure = pressure;
    }
    
  } else if (brushType === 'watercolor') {
    //watercolor - advanced organic texture with flow simulation and pigment dispersion
    hidden_drawing.noStroke();
    hidden_drawing.fill(color[0], color[1], color[2]);
    
    let brushWidth = brushSize * 4;
    let perpAngle = angle + PI/2;
    
    //draw particles with advanced flow simulation
    for (let i = 0; i <= steps * 6; i++) {
      let t = i / (steps * 6);
      let baseX = lerp(X, currentX, t);
      let baseY = lerp(Y, currentY, t);
      
      //flow direction affects particle distribution
      let flowAngle = angle + (noise(baseX * 0.1, baseY * 0.1) - 0.5) * 0.5;
      
      let particleLayers = 22;
      for (let layer = 0; layer < particleLayers; layer++) {
        let layerOffset = (layer - particleLayers/2) * (brushWidth / particleLayers);
        let px = baseX + cos(perpAngle) * layerOffset;
        let py = baseY + sin(perpAngle) * layerOffset;
        
        //advanced multi-frequency noise for organic clustering
        let noiseVal1 = noise(px * 0.18, py * 0.18, layer);
        let noiseVal2 = noise(px * 0.12, py * 0.12, layer + 400);
        let noiseVal3 = noise(px * 0.25, py * 0.25, layer + 800);
        let noiseVal4 = noise(px * 0.35, py * 0.35, layer + 1200);
        
        //combine noise for realistic pigment dispersion
        let combinedNoise = (noiseVal1 * 0.4 + noiseVal2 * 0.3 + noiseVal3 * 0.2 + noiseVal4 * 0.1);
        
        //create organic clusters with flow-based positioning
        if (combinedNoise > 0.32 && noiseVal2 > 0.22) {
          let particleSize = brushSize * (0.15 + noiseVal2 * 1.8);
          
          //flow-based offset for realistic watercolor behavior
          let flowOffset = (noiseVal1 - 0.5) * brushSize * 1.5;
          let offsetX = cos(flowAngle) * flowOffset + (noiseVal3 - 0.5) * brushSize * 0.8;
          let offsetY = sin(flowAngle) * flowOffset + (noiseVal4 - 0.5) * brushSize * 0.8;
          
          let particleX = px + offsetX;
          let particleY = py + offsetY;
          
          //vary opacity for depth and pigment concentration
          let baseOpacity = map(combinedNoise, 0, 1, 0.5, 1.0) * (0.7 + noiseVal2 * 0.3);
          
          //add transparent bleed layers like pen brush (transparent outlines) - even more transparent
          let bleedLayers = [
            {alpha: baseOpacity * 0.06, size: 1.8},
            {alpha: baseOpacity * 0.04, size: 2.5},
            {alpha: baseOpacity * 0.025, size: 3.5},
            {alpha: baseOpacity * 0.015, size: 4.5}
          ];
          
          //draw transparent bleed layers first (outermost to innermost)
          for (let bleed of bleedLayers) {
            hidden_drawing.drawingContext.globalAlpha = bleed.alpha;
            hidden_drawing.circle(particleX, particleY, particleSize * bleed.size);
          }
          
          //draw main particle with full opacity
          hidden_drawing.drawingContext.globalAlpha = baseOpacity;
          hidden_drawing.circle(particleX, particleY, particleSize);
        }
      }
    }
    hidden_drawing.drawingContext.globalAlpha = 1.0;
    
  } else if (brushType === 'paintbrush') {
    //paintbrush - advanced bristle dynamics with paint viscosity and realistic splatter physics
    hidden_drawing.stroke(color[0], color[1], color[2]);
    hidden_drawing.fill(color[0], color[1], color[2]);
    hidden_drawing.strokeCap(ROUND);
    
    let brushWidth = brushSize * 2.8;
    let perpAngle = angle + PI/2;
    
    //draw multiple bristles with advanced paint behavior
    let bristleCount = 10;
    for (let b = 0; b < bristleCount; b++) {
      let offset = (b - bristleCount/2) * (brushWidth / bristleCount);
      
      let prevX = X + cos(perpAngle) * offset;
      let prevY = Y + sin(perpAngle) * offset;
      let prevVelX = 0;
      let prevVelY = 0;
      
      for (let i = 1; i <= steps; i++) {
        let t = i / steps;
        let baseX = lerp(X, currentX, t);
        let baseY = lerp(Y, currentY, t);
        
        //calculate velocity for paint flow simulation
        let velX = baseX - prevX;
        let velY = baseY - prevY;
        let velocity = dist(0, 0, velX, velY);
        
        //advanced bristle dynamics with velocity-based variation
        let noiseVal1 = noise(baseX * 0.12, baseY * 0.12, b * 60);
        let noiseVal2 = noise(baseX * 0.18, baseY * 0.18, b * 60 + 150);
        let noiseVal3 = noise(baseX * 0.25, baseY * 0.25, b * 60 + 300);
        
        //velocity affects bristle spread
        let velocityFactor = min(velocity / 5, 1.5);
        let varOffset = (noiseVal1 - 0.5) * brushSize * (0.5 + velocityFactor * 0.3);
        
        let px = baseX + cos(perpAngle) * (offset + varOffset);
        let py = baseY + sin(perpAngle) * (offset + varOffset);
        
        //paint viscosity affects stroke weight and opacity
        let viscosity = 0.6 + noiseVal2 * 0.4;
        let weight = brushSize * (0.35 + noiseVal1 * 0.8) * viscosity;
        let opacity = map(noiseVal2, 0, 1, 0.65, 1.0) * (0.8 + velocityFactor * 0.2);
        
        hidden_drawing.drawingContext.globalAlpha = opacity;
        hidden_drawing.strokeWeight(weight);
        hidden_drawing.line(prevX, prevY, px, py);
        
        //advanced splatter physics based on velocity
        if (noiseVal1 > 0.65 && velocity > 2) {
          hidden_drawing.noStroke();
          let splatterSize = brushSize * (0.25 + noiseVal2 * 0.8);
          let splatterVel = velocity * 0.3;
          let splatterAngle = atan2(velY, velX) + (noiseVal1 - 0.5) * 0.8;
          
          hidden_drawing.circle(px + cos(splatterAngle) * splatterVel, 
                               py + sin(splatterAngle) * splatterVel, 
                               splatterSize);
          hidden_drawing.stroke(color[0], color[1], color[2]);
        }
        
        //paint drips with gravity simulation
        if (noiseVal2 > 0.8 && velocity < 1) {
          hidden_drawing.noStroke();
          hidden_drawing.drawingContext.globalAlpha = 0.75;
          let dripSize = brushSize * (0.4 + noiseVal3 * 0.4);
          hidden_drawing.circle(px, py + brushSize * (1 + noiseVal3), dripSize);
          hidden_drawing.drawingContext.globalAlpha = opacity;
        }
        
        prevX = px;
        prevY = py;
        prevVelX = velX;
        prevVelY = velY;
      }
    }
    hidden_drawing.drawingContext.globalAlpha = 1.0;
    hidden_drawing.strokeWeight(brushSize);
  }
  
  hidden_drawing.pop();
  X = currentX; //x position
  Y = currentY; // y position
}

//stop drawing function
function mouseReleased(){
  draggingSlider = false; //stop dragging slider
  
  //finish selection rectangle if we were selecting
  if (selectingRect) {
    selectionRect = {
      x1: selectStartX,
      y1: selectStartY,
      x2: getDrawingX(mouseX),
      y2: getDrawingY(mouseY)
    };
    selectingRect = false;
  }
}

function updateBrushSizeFromSlider(){
  //convert mouse to UI coordinates
  let uiMouseX = mouseX / canvasScale;
  //constrain mouseX to slider bounds
  let constrainedX = constrain(uiMouseX, brushSizeSliderX, brushSizeSliderX + brushSizeSliderWidth);
  //map slider position to brush size
  brushSize = map(constrainedX, brushSizeSliderX, brushSizeSliderX + brushSizeSliderWidth, minBrushSize, maxBrushSize);
  brushSize = round(brushSize); //round to integer
}

//convert scaled canvas coordinates to actual drawing coordinates
function getDrawingX(screenX) {
  return screenX / canvasScale;
}

function getDrawingY(screenY) {
  return screenY / canvasScale;
}

//convert drawing coordinates to scaled canvas coordinates
function getScreenX(drawingX) {
  return drawingX * canvasScale;
}

function getScreenY(drawingY) {
  return drawingY * canvasScale;
}

//handle window resize for orientation changes on iPad
function windowResized() {
  //recalculate scale
  let availableWidth = windowWidth - 100;
  let availableHeight = windowHeight - 200;
  let scaleX = availableWidth / BASE_WIDTH;
  let scaleY = availableHeight / BASE_HEIGHT;
  canvasScale = min(scaleX, scaleY, 1);
  
  //resize canvas
  resizeCanvas(BASE_WIDTH * canvasScale, BASE_HEIGHT * canvasScale);
}

//touch support for iPad and mobile devices
function touchStarted(){
  //call the same logic as mousePressed
  mousePressed();
  //prevent default behavior (like scrolling) when touching canvas
  return false;
}

function touchMoved(){
  //call the same logic as mouseDragged
  mouseDragged();
  //prevent default behavior (like scrolling) when dragging on canvas
  return false;
}

function touchEnded(){
  //call the same logic as mouseReleased
  mouseReleased();
  //prevent default behavior
  return false;
}
