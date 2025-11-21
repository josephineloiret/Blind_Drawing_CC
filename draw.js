let hidden_drawing, X, Y, colorPickerBuffer, canvasScale = 1;
let hidden = true, selectionMode = false, draggingSlider = false, selectingRect = false;
let color = [0, 0, 0], selectionRect = null, selectStartX, selectStartY;
let brushSize = 5, brushType = 'pencil', minBrushSize = 1, maxBrushSize = 50;
const colorPickerX = 470, colorPickerY = 37, colorPickerWidth = 200, colorPickerHeight = 70;
const brushSizeSliderX = 850, brushSizeSliderY = 95, brushSizeSliderWidth = 300, brushSizeSliderHeight = 4;
const PERIWINKLE = [160, 160, 225], BASE_WIDTH = 1500, BASE_HEIGHT = 800;

function setup(){
  canvasScale = min((windowWidth - 40) / BASE_WIDTH, (windowHeight - 200) / BASE_HEIGHT, 1);
  let canvas = createCanvas(BASE_WIDTH * canvasScale, BASE_HEIGHT * canvasScale);
  canvas.parent('canvas-container');
  
  hidden_drawing = createGraphics(BASE_WIDTH, BASE_HEIGHT);
  hidden_drawing.background('white');
  hidden_drawing.stroke(0);
  hidden_drawing.strokeWeight(brushSize);
  
  colorPickerBuffer = createGraphics(colorPickerWidth, colorPickerHeight);
  drawColorPickerToBuffer();
}

function draw(){
  background(20, 20, 30);
  
  if (!hidden){
    image(hidden_drawing, 0, 0, width, height);
  } else {
    if (selectionRect === null) {
      fill(0);
      noStroke();
      rect(0, 0, width, height);
    } else {
      push();
      fill(0);
      noStroke();
      rect(0, 0, width, height);
      drawingContext.save();
      drawingContext.beginPath();
      let x1 = min(selectionRect.x1, selectionRect.x2) * canvasScale;
      let y1 = min(selectionRect.y1, selectionRect.y2) * canvasScale;
      let x2 = max(selectionRect.x1, selectionRect.x2) * canvasScale;
      let y2 = max(selectionRect.y1, selectionRect.y2) * canvasScale;
      drawingContext.rect(x1, y1, x2 - x1, y2 - y1);
      drawingContext.clip();
      image(hidden_drawing, 0, 0, width, height);
      drawingContext.restore();
      pop();
    }
  }
  
  if (selectionMode) {
    if (selectingRect) {
      push();
      noFill();
      stroke(255, 255, 0);
      strokeWeight(2);
      let x1 = min(selectStartX, mouseX / canvasScale) * canvasScale;
      let y1 = min(selectStartY, mouseY / canvasScale) * canvasScale;
      let x2 = max(selectStartX, mouseX / canvasScale) * canvasScale;
      let y2 = max(selectStartY, mouseY / canvasScale) * canvasScale;
      rect(x1, y1, x2 - x1, y2 - y1);
      pop();
    } else if (selectionRect !== null) {
      push();
      noFill();
      stroke(255, 255, 255);
      strokeWeight(2);
      let x1 = min(selectionRect.x1, selectionRect.x2) * canvasScale;
      let y1 = min(selectionRect.y1, selectionRect.y2) * canvasScale;
      let x2 = max(selectionRect.x1, selectionRect.x2) * canvasScale;
      let y2 = max(selectionRect.y2, selectionRect.y2) * canvasScale;
      rect(x1, y1, x2 - x1, y2 - y1);
      pop();
    }
  }
  
  drawInstructions();
  drawColorPicker();
}

function getSat(bright) {
  return bright >= 60 ? map(bright, 100, 60, 0, 100) : bright <= 10 ? map(bright, 10, 0, 100, 0) : 100;
}

function inBounds(mx, my, x, y, w, h) {
  return mx >= x && mx <= x + w && my >= y && my <= y + h;
}

function drawButton(x, y, w, h, label, isActive = false) {
  let clr = isActive ? [45, 55, 72] : PERIWINKLE;
  fill(clr[0], clr[1], clr[2]);
  stroke(clr[0], clr[1], clr[2]);
  strokeWeight(1);
  rect(x, y, w, h, 3);
  fill(255);
  textSize(13);
  textStyle(NORMAL);
  textAlign(CENTER);
  text(label, x + w/2, y + 25);
  textAlign(LEFT);
}

function drawColorPickerToBuffer(){
  for (let x = 0; x < colorPickerWidth; x += 2) {
    for (let y = 0; y < colorPickerHeight; y += 2) {
      let hue = map(x, 0, colorPickerWidth, 0, 360);
      let bright = map(y, 0, colorPickerHeight, 100, 0);
      let rgb = hsvToRgb(hue, getSat(bright), bright);
      colorPickerBuffer.fill(rgb[0], rgb[1], rgb[2]);
      colorPickerBuffer.noStroke();
      colorPickerBuffer.rect(x, y, 2, 2);
    }
  }
  colorPickerBuffer.stroke(200);
  colorPickerBuffer.strokeWeight(2);
  colorPickerBuffer.noFill();
  colorPickerBuffer.rect(0, 0, colorPickerWidth, colorPickerHeight);
}

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  let max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
  let h = 0;
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
  }
  h = Math.round(h * 60) % 360;
  if (h < 0) h += 360;
  return [h, max === 0 ? 0 : Math.round((delta / max) * 100), Math.round(max * 100)];
}

function drawColorPicker(){
  push();
  scale(canvasScale);
  image(colorPickerBuffer, colorPickerX, colorPickerY);
  
  let hsv = rgbToHsv(color[0], color[1], color[2]);
  let hue = hsv[0], bright = hsv[2];
  
  let selectorX = constrain(map(hue, 0, 360, colorPickerX, colorPickerX + colorPickerWidth), colorPickerX, colorPickerX + colorPickerWidth);
  let selectorY = constrain(map(bright, 100, 0, colorPickerY, colorPickerY + colorPickerHeight), colorPickerY, colorPickerY + colorPickerHeight);
  
  fill(color[0], color[1], color[2]);
  stroke(bright < 50 ? 255 : 0);
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
  let x = mx / canvasScale, y = my / canvasScale;
  if (x < colorPickerX || x > colorPickerX + colorPickerWidth ||
      y < colorPickerY || y > colorPickerY + colorPickerHeight) return null;
  let hue = map(x, colorPickerX, colorPickerX + colorPickerWidth, 0, 360);
  let bright = map(y, colorPickerY, colorPickerY + colorPickerHeight, 100, 0);
  return hsvToRgb(hue, getSat(bright), bright);
}

function drawInstructions(){
  push();
  scale(canvasScale);
  fill(255, 255, 255, 250);
  noStroke();
  rect(0, 0, BASE_WIDTH, 120);
  
  let buttonSpacing = 12, leftBtnWidth = 170, leftBtnHeight = 38;
  let leftBtnX = 20, selectModeBtnY = 60 - (leftBtnHeight * 2 + buttonSpacing) / 2;
  let revealBtnY = selectModeBtnY + leftBtnHeight + buttonSpacing;
  
  drawButton(leftBtnX, selectModeBtnY, leftBtnWidth, leftBtnHeight, selectionMode ? 'Drawing Mode' : 'Selection Mode', selectionMode);
  drawButton(leftBtnX, revealBtnY, leftBtnWidth, leftBtnHeight, hidden ? 'Reveal' : 'Hide', !hidden);
  
  if (selectionRect !== null) {
    drawButton(leftBtnX + leftBtnWidth + buttonSpacing, revealBtnY, 140, leftBtnHeight, 'Clear Selection');
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
  
  let rightBtnWidth = 170, rightBtnHeight = 38;
  let saveBtnY = (brushSizeSliderY - 30) - (rightBtnHeight * 2 + buttonSpacing) / 2;
  let saveBtnX = BASE_WIDTH - rightBtnWidth - 20;
  
  drawButton(saveBtnX, saveBtnY, rightBtnWidth, rightBtnHeight, 'Save');
  drawButton(saveBtnX, saveBtnY + rightBtnHeight + buttonSpacing, rightBtnWidth, rightBtnHeight, 'Clear Drawing');
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

function mousePressed(){
  let mx = mouseX / canvasScale, my = mouseY / canvasScale;
  let buttonSpacing = 12, leftBtnWidth = 170, leftBtnHeight = 38;
  let leftBtnX = 20, selectModeBtnY = 60 - (leftBtnHeight * 2 + buttonSpacing) / 2;
  let revealBtnY = selectModeBtnY + leftBtnHeight + buttonSpacing;
  
  if (inBounds(mx, my, leftBtnX, selectModeBtnY, leftBtnWidth, leftBtnHeight)) {
    selectionMode = !selectionMode;
    selectingRect = false;
    return;
  }
  
  if (inBounds(mx, my, leftBtnX, revealBtnY, leftBtnWidth, leftBtnHeight)) {
    hidden = !hidden;
    return;
  }
  
  if (selectionRect !== null && inBounds(mx, my, leftBtnX + leftBtnWidth + buttonSpacing, revealBtnY, 140, leftBtnHeight)) {
    selectionRect = null;
    return;
  }
  
  if (selectionMode) {
    if (my >= 120) {
      selectingRect = true;
      selectStartX = mx;
      selectStartY = my;
    }
    return;
  }
  
  let newColor = getColorFromPicker(mouseX, mouseY);
  if (newColor !== null) { color = newColor; return; }
  
  let brushTypes = ['pencil', 'pen', 'watercolor', 'paintbrush'];
  let brushX = 850, brushY = 37, brushBtnWidth = 70, brushBtnHeight = 30, brushSpacing = 8;
  
  if (my >= brushY && my <= brushY + brushBtnHeight + 20) {
    for (let i = 0; i < brushTypes.length; i++) {
      if (inBounds(mx, my, brushX + i * (brushBtnWidth + brushSpacing), brushY, brushBtnWidth, brushBtnHeight)) {
        brushType = brushTypes[i];
        return;
      }
    }
  }
  
  let thumbRadius = 8;
  if (inBounds(mx, my, brushSizeSliderX - thumbRadius, brushSizeSliderY - thumbRadius - 5, 
      brushSizeSliderWidth + thumbRadius * 2, thumbRadius * 2 + 10)) {
    draggingSlider = true;
    updateBrushSizeFromSlider();
    return;
  }
  
  let rightBtnWidth = 170, rightBtnHeight = 38;
  let saveBtnY = (brushSizeSliderY - 30) - (rightBtnHeight * 2 + buttonSpacing) / 2;
  let saveBtnX = BASE_WIDTH - rightBtnWidth - 20;
  
  if (inBounds(mx, my, saveBtnX, saveBtnY, rightBtnWidth, rightBtnHeight)) {
    saveCanvas(hidden_drawing, 'drawing', 'png');
    return;
  }
  
  if (inBounds(mx, my, saveBtnX, saveBtnY + rightBtnHeight + buttonSpacing, rightBtnWidth, rightBtnHeight)) {
    hidden_drawing.background('white');
    return;
  }
  
  if (my < 120) return;
  X = mx;
  Y = my;
}

function mouseDragged(){
  if (selectionMode && selectingRect) return;
  if (selectionMode) return;
  
  if (draggingSlider) { updateBrushSizeFromSlider(); return; }
  
  let newColor = getColorFromPicker(mouseX, mouseY);
  if (newColor !== null) { color = newColor; return; }
  
  let my = mouseY / canvasScale;
  if (my < 120 || Y < 120) return;
  
  let currentX = mouseX / canvasScale;
  let currentY = mouseY / canvasScale;
  
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

function mouseReleased(){
  draggingSlider = false;
  if (selectingRect) {
    selectionRect = { x1: selectStartX, y1: selectStartY, x2: mouseX / canvasScale, y2: mouseY / canvasScale };
    selectingRect = false;
  }
}

function updateBrushSizeFromSlider(){
  let mx = mouseX / canvasScale;
  let constrainedX = constrain(mx, brushSizeSliderX, brushSizeSliderX + brushSizeSliderWidth);
  brushSize = round(map(constrainedX, brushSizeSliderX, brushSizeSliderX + brushSizeSliderWidth, minBrushSize, maxBrushSize));
}

function windowResized() {
  canvasScale = min((windowWidth - 40) / BASE_WIDTH, (windowHeight - 200) / BASE_HEIGHT, 1);
  resizeCanvas(BASE_WIDTH * canvasScale, BASE_HEIGHT * canvasScale);
}

function touchStarted() { mousePressed(); return false; }
function touchMoved() { mouseDragged(); return false; }
function touchEnded() { mouseReleased(); return false; }
