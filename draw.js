//defining global variables:
let hidden_drawing; //drawing canvas
let X, Y; //mouse position
let color_select_buff; //buffer for color selection tool
let canvas_scale=1; //used for size of device
let hidden=true;//start in hidden
let selection_mode=false; //start with this off
let brush_size_slider=false;
let selecting_rectangle=false;
let color=[0, 0, 0]; //initial color
let selection_rectangle=null; //stores the selection rectangle coordinates
let brush_size=5; //initial
let brush_stroke='pencil';//initial
let min_brush_size=1;
let max_brush_size=25;
const color_selector_X=470, color_selector_Y=37; //top left of color box
const color_selector_width=200, color_selector_height=70;
const brush_size_slider_X=850, brush_size_slider_Y=95; 
const brush_size_slider_width=300, brush_size_slider_height=4;
const button_blue=[160, 160, 225]; //color for buttons
const canvas_base_width=1500, canvas_base_height=800; //initial canvas without scaling

function setup(){ //runs first
  //scale canvas to device 
  canvas_scale=min((windowWidth-40)/canvas_base_width, (windowHeight-200)/canvas_base_height, 1);
  let canvas=createCanvas(canvas_base_width * canvas_scale, canvas_base_height * canvas_scale);
  canvas.parent('canvas-container');
  
  //create hidden drawing canvas
  hidden_drawing=createGraphics(canvas_base_width, canvas_base_height);
  hidden_drawing.background('white');
  hidden_drawing.stroke(0); //color of stroke
  hidden_drawing.strokeWeight(brush_size);
  
  //create color selector gradient
  color_select_buff=createGraphics(color_selector_width, color_selector_height);
  drawColorPickerToBuffer();
}

function draw(){ //constantly runs
  background(0); //black
  //selection rectangle visual
  if (!hidden){ //then reveal
    image(hidden_drawing, 0, 0, width, height);
  } else { //hide
    if (selection_rectangle === null) { //no selection rectangle
      fill(0);
      noStroke();
      rect(0, 0, width, height);
    } else { //selection rectangle was picked
      push();
      fill(0);
      noStroke();
      rect(0, 0, width, height); //black background
      //reveal only selected area
      drawingContext.save();
      drawingContext.beginPath();
      //scale selection
      let x1=min(selection_rectangle.x1, selection_rectangle.x2)*canvas_scale;
      let y1=min(selection_rectangle.y1, selection_rectangle.y2)*canvas_scale;
      let x2=max(selection_rectangle.x1, selection_rectangle.x2)*canvas_scale;
      let y2=max(selection_rectangle.y1, selection_rectangle.y2)*canvas_scale;
      drawingContext.rect(x1, y1, x2 - x1, y2 - y1);
      drawingContext.clip();
      image(hidden_drawing, 0, 0, width, height);
      drawingContext.restore();
      pop();
    }
  }
  //selecting rectangle visual
  if (selection_mode) {
    if (selecting_rectangle) { //user making selection
      push();
      noFill();
      stroke(255, 255, 0); //outline yellow
      strokeWeight(2);
      //scale selection rectangle
      let x1=min(selection_start_x, mouseX / canvas_scale) * canvas_scale;
      let y1=min(selection_start_Y, mouseY / canvas_scale) * canvas_scale;
      let x2=max(selection_start_x, mouseX / canvas_scale) * canvas_scale;
      let y2=max(selection_start_Y, mouseY / canvas_scale) * canvas_scale;
      rect(x1, y1, x2 - x1, y2 - y1); //draw
      pop();
      
    } else if (selection_rectangle !== null) {
      //when selection was completed
      push();
      noFill();
      stroke(255, 255, 255); //white
      strokeWeight(2);
      //scale final selection
      let x1=min(selection_rectangle.x1, selection_rectangle.x2) * canvas_scale;
      let y1=min(selection_rectangle.y1, selection_rectangle.y2) * canvas_scale;
      let x2=max(selection_rectangle.x1, selection_rectangle.x2) * canvas_scale;
      let y2=max(selection_rectangle.y2, selection_rectangle.y2) * canvas_scale;
      rect(x1, y1, x2 - x1, y2 - y1); //draw
      pop();
    }
  }
  
  //INTERFACE
  drawInstructions(); //toolbar
  drawColorPicker(); //colorpicker
}

//FUNCTIONS
//color wheel saturation/brightness
function getSat(bright) {
  return bright >= 60 ? map(bright, 100, 60, 0, 100) : bright <= 10 ? map(bright, 10, 0, 100, 0) : 100;
}

//use this for clicking mouse detection to check if mouse is in the drawing rectangle
function inBounds(mx, my, x, y, w, h) {
  return mx >= x && mx <= x + w && my >= y && my <= y + h;
}

//draw buttons and their labels
function drawButton(x, y, w, h, label, is_active=false) {
  let clr=is_active ? [45, 55, 72] : button_blue;  //dark blue or light blue
  //make button rectangle
  fill(clr[0], clr[1], clr[2]);
  stroke(clr[0], clr[1], clr[2]);
  strokeWeight(1);
  rect(x, y, w, h, 3);
  //draw label text
  fill(255); //white
  textSize(13);
  textStyle(NORMAL);
  textAlign(CENTER);
  text(label, x + w/2, y + 25); //center
  textAlign(LEFT); 
}

//color selector - called once in setup
function drawColorPickerToBuffer(){
  //loop through every 2 pixels to create the gradient
  for (let x=0; x < color_selector_width; x += 2) {
    for (let y=0; y < color_selector_height; y += 2) {
      let hue=map(x, 0, color_selector_width, 0, 360); //left to right colors
      let bright=map(y, 0, color_selector_height, 100, 0); //top to bottom
      //Convert HSV to RGB and draw pixel
      let rgb=hsvToRgb(hue, getSat(bright), bright);
      color_select_buff.fill(rgb[0], rgb[1], rgb[2]);
      color_select_buff.noStroke();
      color_select_buff.rect(x, y, 2, 2); //2x2 pixel square
    }
  }
  //color selector border
  color_select_buff.stroke(200); //light gray
  color_select_buff.strokeWeight(2);
  color_select_buff.noFill();
  color_select_buff.rect(0, 0, color_selector_width, color_selector_height);
}

//RGB to HSV - use to position selector circle
function rgbToHsv(r, g, b) {
  //normalize RGB values to 0-1 range
  r /= 255; 
  g /= 255; 
  b /= 255;
  //find min, max for brightness and saturation
  let max=Math.max(r, g, b), min=Math.min(r, g, b), delta=max - min;
  //calculate hue
  let h=0;
  if (delta !== 0) {
    if (max === r) h=((g - b) / delta) + (g < b ? 6 : 0);//red max
    else if (max === g) h=(b - r) / delta + 2;//green max
    else h=(r - g) / delta + 4; //blue max
  }
  h=Math.round(h * 60) % 360; //degree conversion
  if (h < 0) h += 360; //check if positive
  //return [hue, saturation %, brightness %]
  return [h, max === 0 ? 0 : Math.round((delta / max) * 100), Math.round(max * 100)];
}

//draw color selector
function drawColorPicker(){
  push();
  scale(canvas_scale); //scale to device
  image(color_select_buff, color_selector_X, color_selector_Y); //draw the pre-rendered color selection gradient
  //convert current color to HSV to determine selector position of circle
  let hsv=rgbToHsv(color[0], color[1], color[2]);
  let hue=hsv[0], bright=hsv[2];
  //map HSV values to pixel coordinates on the color picker
  let selector_x=constrain(map(hue, 0, 360, color_selector_X, color_selector_X + color_selector_width), color_selector_X, color_selector_X + color_selector_width);
  let selector_y=constrain(map(bright, 100, 0, color_selector_Y, color_selector_Y + color_selector_height), color_selector_Y, color_selector_Y + color_selector_height);
  //draw selector circle showing current color
  fill(color[0], color[1], color[2]);
  stroke(bright < 50 ? 255 : 0);  //white outline for darker colors but black for rest
  strokeWeight(2);
  circle(selector_x, selector_y, 10);
  pop();
}

//HSV to RGB - to convert color selection to color to draw on canvas
function hsvToRgb(h, s, v) {
  //normalize
  h=h / 360;
  s=s / 100;
  v=v / 100;
  let r, g, b;
  //detrmine part of color wheel
  let i=floor(h * 6);
  let f=h * 6 - i;
  //find exact color
  let p=v * (1 - s);
  let q=v * (1 - f * s);
  let t=v * (1 - (1 - f) * s);
  //assign RGB color from calculation
  switch (i % 6) {
    case 0: r=v; g=t; b=p; break;
    case 1: r=q; g=v; b=p; break;
    case 2: r=p; g=v; b=t; break;
    case 3: r=p; g=q; b=v; break;
    case 4: r=t; g=p; b=v; break;
    case 5: r=v; g=p; b=q; break;
  }
  //convert back to 0-255 range 
  return [floor(r * 255), floor(g * 255), floor(b * 255)];
}

//if picking color - get color
function getColorFromPicker(mx, my) {
  //mouse coordinates conversion
  let x=mx / canvas_scale, y=my / canvas_scale;
  //if mouse is not on color selector tool return null
  if (x < color_selector_X || x > color_selector_X + color_selector_width ||
      y < color_selector_Y || y > color_selector_Y + color_selector_height) return null;
  //if mouse is on color selector tool - get color
  let hue=map(x, color_selector_X, color_selector_X + color_selector_width, 0, 360);
  let bright=map(y, color_selector_Y, color_selector_Y + color_selector_height, 100, 0);
  //convert to RGBn
  return hsvToRgb(hue, getSat(bright), bright);
}

//FUNCTIONS FOR DRAWING INTERFACE
//draw main instruction toolbar
function drawInstructions(){
  push();
  scale(canvas_scale);  //scale to device
  fill(255, 255, 255, 250); //white background
  noStroke();
  rect(0, 0, canvas_base_width, 120);

  //reveal and selection mode buttons
  let button_spacing=12, left_button_width=170, left_button_height=38;
  let left_button_x=20;
  let select_mode_button_y=60 - (left_button_height * 2 + button_spacing) / 2; //center in toolbar vertically
  let reveal_button_y=select_mode_button_y + left_button_height + button_spacing;
  //draw selection mode button
  drawButton(left_button_x, select_mode_button_y, left_button_width, left_button_height, 
             selection_mode ? 'Drawing Mode' : 'Selection Mode', selection_mode);
  //reveal and hide button
  drawButton(left_button_x, reveal_button_y, left_button_width, left_button_height, 
             hidden ? 'Reveal' : 'Hide', !hidden);
  //clear selection button
  if (selection_rectangle !== null) {
    drawButton(left_button_x + left_button_width + button_spacing, reveal_button_y, 140, left_button_height, 'Clear Selection');
  }
  
  //color selector section
  fill(45, 55, 72);  //text color
  textFont('Inter');
  textSize(15);
  textStyle(BOLD);
  text('Color:', 420, 30);
  //current color swatch
  fill(color[0], color[1], color[2]);
  stroke(200); 
  strokeWeight(2);
  rect(420, 37, 42, 26, 3);
  
  //brush type section
  noStroke();
  fill(0, 0, 0); //black text
  textFont('Inter');
  textSize(15);
  textStyle(BOLD);
  text('Brush:', 850, 30);
  //brush buttons with previews
  let brush_strokes=['pencil', 'pen', 'watercolor', 'paintbrush'];
  let brush_x=850;
  let brush_y=37;
  let brush_button_width=70;
  let brush_button_height=30;
  let brush_spacing=8;
  for (let i=0; i < brush_strokes.length; i++) {
    let button_x=brush_x + i * (brush_button_width + brush_spacing);
    let is_active=brush_stroke === brush_strokes[i];
    //draw button
    fill(is_active ? [45, 55, 72] : [255, 255, 255]);
    stroke(is_active ? 45 : 200);
    strokeWeight(is_active ? 2 : 1);
    rect(button_x, brush_y, brush_button_width, brush_button_height, 3);
    //draw text label
    fill(is_active ? 255 : 45);
    textFont('Inter');
    textSize(10);
    textStyle(NORMAL);
    textAlign(CENTER, CENTER);
    let label=brush_strokes[i].charAt(0).toUpperCase() + brush_strokes[i].substring(1);
    text(label, button_x + brush_button_width/2, brush_y + brush_button_height/2);
    textAlign(LEFT);
  }
  
  //brush size slider
  drawBrushSizeSlider();
  //save and clear drawing buttons
  let right_button_width=170, right_button_height=38;
  let save_button_y=(brush_size_slider_Y - 30) - (right_button_height * 2 + button_spacing) / 2;
  let save_button_x=canvas_base_width - right_button_width - 20;
  drawButton(save_button_x, save_button_y, right_button_width, right_button_height, 'Save');
  drawButton(save_button_x, save_button_y + right_button_height + button_spacing, right_button_width, right_button_height, 'Clear Drawing');
  pop();
}

//draw brush size slider
function drawBrushSizeSlider(){
  //calculate slider circle position depending on brush size 
  let slider_value=map(brush_size, min_brush_size, max_brush_size, 0, brush_size_slider_width);
  let thumb_x=brush_size_slider_X + slider_value;
  let thumb_y=brush_size_slider_Y;
  let thumb_radius=8;
  //draw line
  fill(100, 100, 100);
  noStroke();
  rect(brush_size_slider_X, brush_size_slider_Y - brush_size_slider_height/2, brush_size_slider_width, brush_size_slider_height, 2);
  //draw minus
  fill(100, 100, 100);
  rect(brush_size_slider_X - 8, brush_size_slider_Y - 1, 6, 2);
  //draw plus
  fill(100, 100, 100);
  let plus_x=brush_size_slider_X + brush_size_slider_width + 8;
  rect(plus_x - 3, brush_size_slider_Y - 1, 6, 2);
  rect(plus_x - 1, brush_size_slider_Y - 3, 2, 6);
  //draw slider circle
  push();
  fill(0, 0, 0, 20);
  noStroke();
  circle(thumb_x + 1, thumb_y + 1, thumb_radius * 2);
  fill(255);
  noStroke();
  circle(thumb_x, thumb_y, thumb_radius * 2);
  pop();
}

//mouse interaction functions
function mousePressed(){
  //unscale mouse coordinates
  let mx=mouseX / canvas_scale, my=mouseY / canvas_scale;
  //define button positions
  let button_spacing=12, left_button_width=170, left_button_height=38;
  let left_button_x=20, select_mode_button_y=60 - (left_button_height * 2 + button_spacing) / 2;
  let reveal_button_y=select_mode_button_y + left_button_height + button_spacing;
  //check selection mode button
  if (inBounds(mx, my, left_button_x, select_mode_button_y, left_button_width, left_button_height)) {
    selection_mode=!selection_mode;  // Toggle mode
    selecting_rectangle=false;  // Cancel any in-progress selection
    return;
  }
  //reveal button
  if (inBounds(mx, my, left_button_x, reveal_button_y, left_button_width, left_button_height)) {
    hidden=!hidden;
    return;
  }
  //clear selection button
  if (selection_rectangle !== null && inBounds(mx, my, left_button_x + left_button_width + button_spacing, reveal_button_y, 140, left_button_height)) {
    selection_rectangle=null; //clear selection 
    return;
  }
  //if in selection mode, create selection
  if (selection_mode) {
    if (my >= 120) {
      selecting_rectangle=true;
      selection_start_x=mx;
      selection_start_Y=my;
    }
    return;
  }
  //check if color picker is clicked
  let new_color=getColorFromPicker(mouseX, mouseY);
  if (new_color !== null) { 
    color=new_color; //update
    return;
  }
  //check if brush type button is clicked
  let brush_strokes=['pencil', 'pen', 'watercolor', 'paintbrush'];
  let brush_x=850, brush_y=37, brush_button_width=70, brush_button_height=30, brush_spacing=8;
  if (my >= brush_y && my <= brush_y + brush_button_height + 20) {
    for (let i=0; i < brush_strokes.length; i++) {
      if (inBounds(mx, my, brush_x + i * (brush_button_width + brush_spacing), brush_y, brush_button_width, brush_button_height)) {
        brush_stroke=brush_strokes[i];  //update
        return;
      }
    }
  }
  //check if brush size slider is clicked
  let thumb_radius=8;
  if (inBounds(mx, my, brush_size_slider_X - thumb_radius, brush_size_slider_Y - thumb_radius - 5, 
      brush_size_slider_width + thumb_radius * 2, thumb_radius * 2 + 10)) {
    brush_size_slider=true;  // Start dragging slider
    updateBrushSizeFromSlider();  // Update size immediately
    return;
  }
  //check save and clear drawing buttons
  let right_button_width=170, right_button_height=38;
  let save_button_y=(brush_size_slider_Y - 30) - (right_button_height * 2 + button_spacing) / 2;
  let save_button_x=canvas_base_width - right_button_width - 20;
  //check save button
  if (inBounds(mx, my, save_button_x, save_button_y, right_button_width, right_button_height)) {
    saveCanvas(hidden_drawing, 'drawing', 'png');
    return;
  }
  //check clear drawing button
  if (inBounds(mx, my, save_button_x, save_button_y + right_button_height + button_spacing, right_button_width, right_button_height)) {
    hidden_drawing.background('white');
    return;
  }
  //if in drawing mode with mouse pressed on canvas, start drawing
  if (my < 120) return;
  X=mx;
  Y=my;
}

//mouse dragging functionality
function mouseDragged(){
  //if in selection mode, don't draw
  if (selection_mode && selecting_rectangle) return;
  if (selection_mode) return;
  //brush size slider
  if (brush_size_slider) { 
    updateBrushSizeFromSlider(); 
    return; 
  }
  //color selector dragging
  let new_color=getColorFromPicker(mouseX, mouseY);
  if (new_color !== null) { 
    color=new_color; 
    return; 
  }
  //check if mouse is still on canvas
  let my=mouseY / canvas_scale;
  if (my < 120 || Y < 120) return;
  //get current mouse position
  let current_x=mouseX / canvas_scale;
  let current_y=mouseY / canvas_scale;

  //prepare drawing - save drawing state
  hidden_drawing.push();
  //calculate stroke info
  let dist_val=dist(X, Y, current_x, current_y);
  let angle=atan2(current_y - Y, current_x - X);
  let speed=dist_val / max(1, frameCount % 60);
  let steps=max(30, floor(dist_val / 0.8));
  //pencil 
  if (brush_stroke === 'pencil') {
    hidden_drawing.noStroke();
    hidden_drawing.fill(color[0], color[1], color[2]);
    let brush_width=brush_size * 2.2;
    let perp_angle=angle + PI/2;
    //layering
    for (let layer=0; layer < 4; layer++) {
      let layer_opacity=[0.3, 0.5, 0.7, 0.9][layer];
      let layer_width=brush_width * (1 - layer * 0.15);
      //smoothing
      for (let i=0; i <= steps * 4; i++) {
        let t=i / (steps * 4);  // Position along stroke (0 to 1)
        let px=lerp(X, current_x, t);
        let py=lerp(Y, current_y, t);
        //draw lines
        let line_count=12;
        for (let l=0; l < line_count; l++) {
          let offset=(l - line_count/2) * (layer_width / line_count);
          let line_x=px + cos(perp_angle) * offset;
          let line_y=py + sin(perp_angle) * offset;
          //cross-hatching
          let hatch_angle_1=angle + PI/4 + sin(t * PI * 8) * 0.3;
          let hatch_angle_2=angle - PI/4 + cos(t * PI * 8) * 0.3;
          let cross_offset_1=sin(t * PI * 10 + l * 0.5) * brush_size * 0.25;
          let cross_offset_2=cos(t * PI * 7 + l * 0.7) * brush_size * 0.2;
          line_x += cos(hatch_angle_1) * cross_offset_1 + cos(hatch_angle_2) * cross_offset_2;
          line_y += sin(hatch_angle_1) * cross_offset_1 + sin(hatch_angle_2) * cross_offset_2;
          //grain
          let noise_val_1=noise(line_x * 0.5, line_y * 0.5, layer * 150 + l);
          let noise_val_2=noise(line_x * 0.3, line_y * 0.3, layer * 150 + l + 500);
          let noise_val_3=noise(line_x * 0.7, line_y * 0.7, layer * 150 + l + 1000);
          //noise
          let combined_noise=(noise_val_1 + noise_val_2 * 0.7 + noise_val_3 * 0.5) / 2.2;
          let opacity=layer_opacity * map(combined_noise, 0, 1, 0.3, 1.0);
          let dot_size=brush_size * (0.15 + combined_noise * 0.5);
          hidden_drawing.drawingContext.globalAlpha=opacity;
          hidden_drawing.circle(line_x, line_y, dot_size);
        }
      }
    }
    hidden_drawing.drawingContext.globalAlpha=1.0;
    
    //pen
  } else if (brush_stroke === 'pen') {
    hidden_drawing.stroke(color[0], color[1], color[2]);
    hidden_drawing.strokeCap(ROUND); 
    hidden_drawing.strokeJoin(ROUND);
    //track previous for smoothing
    let prev_x=X;
    let prev_y=Y;
    let prev_pressure=0.5;
    //pressure variation
    for (let i=1; i <= steps; i++) {
      let t=i / steps;
      let px=lerp(X, current_x, t);
      let py=lerp(Y, current_y, t);
      //pressure sensitivity
      let pressure=sin(t * PI);
      let pressure_change=abs(pressure - prev_pressure);
      let weight=brush_size * (0.65 + pressure * 0.35 + pressure_change * 0.2);
      //main ink stroke
      hidden_drawing.strokeWeight(weight);
      hidden_drawing.line(prev_x, prev_y, px, py);
      //ink bleed effect
      let bleed_layers=[
        {alpha: 0.3, size: 1.8},
        {alpha: 0.2, size: 2.5},
        {alpha: 0.12, size: 3.5},
        {alpha: 0.08, size: 4.5}
      ];
      for (let bleed of bleed_layers) {
        hidden_drawing.drawingContext.globalAlpha=bleed.alpha;
        hidden_drawing.strokeWeight(weight * bleed.size);
        hidden_drawing.line(prev_x, prev_y, px, py);
      }
      hidden_drawing.drawingContext.globalAlpha=1.0; 
      //update for watercolor
      prev_x=px;
      prev_y=py;
      prev_pressure=pressure;
    }
    
  //watercolor
  } else if (brush_stroke === 'watercolor') {
    hidden_drawing.noStroke();
    hidden_drawing.fill(color[0], color[1], color[2]);
    let brush_width=brush_size * 4;
    let perp_angle=angle + PI/2;
    //draw particles along stroke
    for (let i=0; i <= steps * 6; i++) {
      let t=i / (steps * 6);
      let base_x=lerp(X, current_x, t);
      let base_y=lerp(Y, current_y, t);
      //flow direction since it should be like a water color brush
      let flow_angle=angle + (noise(base_x * 0.1, base_y * 0.1) - 0.5) * 0.5;
      //particles across brush width
      let particle_layers=22;
      for (let layer=0; layer < particle_layers; layer++) {
        let layer_offset=(layer - particle_layers/2) * (brush_width / particle_layers);
        let px=base_x + cos(perp_angle) * layer_offset;
        let py=base_y + sin(perp_angle) * layer_offset;
        //noise for pigment dispersion
        let noise_val_1=noise(px * 0.18, py * 0.18, layer);
        let noise_val_2=noise(px * 0.12, py * 0.12, layer + 400);
        let noise_val_3=noise(px * 0.25, py * 0.25, layer + 800);
        let noise_val_4=noise(px * 0.35, py * 0.35, layer + 1200);
        //combine noise from previous step
        let combined_noise=(noise_val_1 * 0.4 + noise_val_2 * 0.3 + noise_val_3 * 0.2 + noise_val_4 * 0.1);
        //create gaps and clusters from the particles
        if (combined_noise > 0.32 && noise_val_2 > 0.22) {
          let particle_size=brush_size * (0.15 + noise_val_2 * 1.8);
          //particles moving like in water
          let flow_offset=(noise_val_1 - 0.5) * brush_size * 1.5;
          let offset_x=cos(flow_angle) * flow_offset + (noise_val_3 - 0.5) * brush_size * 0.8;
          let offset_y=sin(flow_angle) * flow_offset + (noise_val_4 - 0.5) * brush_size * 0.8;
          let particle_x=px + offset_x;
          let particle_y=py + offset_y;
          //opacity variation
          let base_opacity=map(combined_noise, 0, 1, 0.5, 1.0) * (0.7 + noise_val_2 * 0.3);
          //ink bleed effect
          let bleed_layers=[
            {alpha: base_opacity * 0.06, size: 1.8},
            {alpha: base_opacity * 0.04, size: 2.5},
            {alpha: base_opacity * 0.025, size: 3.5},
            {alpha: base_opacity * 0.015, size: 4.5}
          ];
          //bleed layers first
          for (let bleed of bleed_layers) {
            hidden_drawing.drawingContext.globalAlpha=bleed.alpha;
            hidden_drawing.circle(particle_x, particle_y, particle_size * bleed.size);
          }
          //main stroke
          hidden_drawing.drawingContext.globalAlpha=base_opacity;
          hidden_drawing.circle(particle_x, particle_y, particle_size);
        }
      }
    }
    hidden_drawing.drawingContext.globalAlpha=1.0;
    
  //paintbrush
  } else if (brush_stroke === 'paintbrush') {
    hidden_drawing.stroke(color[0], color[1], color[2]);
    hidden_drawing.fill(color[0], color[1], color[2]);
    hidden_drawing.strokeCap(ROUND);
    let brush_width=brush_size * 2.8;
    let perp_angle=angle + PI/2; //we want paint brush strokes so perpendicular to the stroke direction
    //multiple bristles
    let bristle_count=10;
    for (let b=0; b < bristle_count; b++) {
      //position bristles
      let offset=(b - bristle_count/2) * (brush_width / bristle_count);
      //previous speed of bristle and its position
      let prev_x=X + cos(perp_angle) * offset;
      let prev_y=Y + sin(perp_angle) * offset;
      let prev_vel_x=0;
      let prev_vel_y=0;
      //draw bristles stroke
      for (let i=1; i <= steps; i++) {
        let t=i / steps;
        let base_x=lerp(X, current_x, t);
        let base_y=lerp(Y, current_y, t);
        //calculate speed of brush movement
        let vel_x=base_x - prev_x;
        let vel_y=base_y - prev_y;
        let velocity=dist(0, 0, vel_x, vel_y);
        //bristle noise
        let noise_val_1=noise(base_x * 0.12, base_y * 0.12, b * 60);
        let noise_val_2=noise(base_x * 0.18, base_y * 0.18, b * 60 + 150);
        let noise_val_3=noise(base_x * 0.25, base_y * 0.25, b * 60 + 300);
        //fast speed, bristles spread more
        let velocity_factor=min(velocity / 5, 1.5);
        let var_offset=(noise_val_1 - 0.5) * brush_size * (0.5 + velocity_factor * 0.3);
        //bristle position with variation
        let px=base_x + cos(perp_angle) * (offset + var_offset);
        let py=base_y + sin(perp_angle) * (offset + var_offset);
        //opacity
        let viscosity=0.6 + noise_val_2 * 0.4;
        let weight=brush_size * (0.35 + noise_val_1 * 0.8) * viscosity;
        let opacity=map(noise_val_2, 0, 1, 0.65, 1.0) * (0.8 + velocity_factor * 0.2);
        //draw bristle stroke
        hidden_drawing.drawingContext.globalAlpha=opacity;
        hidden_drawing.strokeWeight(weight);
        hidden_drawing.line(prev_x, prev_y, px, py);
        //splatter
        if (noise_val_1 > 0.65 && velocity > 2) {
          hidden_drawing.noStroke();
          let splatter_size=brush_size * (0.25 + noise_val_2 * 0.8);
          let splatter_vel=velocity * 0.3;
          let splatter_angle=atan2(vel_y, vel_x) + (noise_val_1 - 0.5) * 0.8;
          //splatter drops
          hidden_drawing.circle(px + cos(splatter_angle) * splatter_vel, 
                               py + sin(splatter_angle) * splatter_vel, 
                               splatter_size);
          hidden_drawing.stroke(color[0], color[1], color[2]);
        }
        //paintdrips
        if (noise_val_2 > 0.8 && velocity < 1) {
          hidden_drawing.noStroke();
          hidden_drawing.drawingContext.globalAlpha=0.75;
          let drip_size=brush_size * (0.4 + noise_val_3 * 0.4);
          //drip falling
          hidden_drawing.circle(px, py + brush_size * (1 + noise_val_3), drip_size);
          hidden_drawing.drawingContext.globalAlpha=opacity;
        }
        //update for next use 
        prev_x=px;
        prev_y=py;
        prev_vel_x=vel_x;
        prev_vel_y=vel_y;
      }
    }
    hidden_drawing.drawingContext.globalAlpha=1.0;
    hidden_drawing.strokeWeight(brush_size);
  }
  
  //finish drawing
  hidden_drawing.pop(); //restore drawing state
  X=current_x; //update previous X position
  Y=current_y; //update previous Y position
}

//mouse realease function
function mouseReleased(){
  brush_size_slider=false; //stop dragging brush size slider
  //if stopped selecting rectangle, save it
  if (selecting_rectangle) {
    selection_rectangle={ 
      x1: selection_start_x, 
      y1: selection_start_Y, 
      x2: mouseX / canvas_scale, 
      y2: mouseY / canvas_scale 
    };
    selecting_rectangle=false;
  }
}

//update brush size from slider
function updateBrushSizeFromSlider(){
  let mx=mouseX / canvas_scale;
  //constrain mouse position to slider bounds
  let constrained_x=constrain(mx, brush_size_slider_X, brush_size_slider_X + brush_size_slider_width);
  //map slider position to brush size range
  brush_size=round(map(constrained_x, brush_size_slider_X, brush_size_slider_X + brush_size_slider_width, min_brush_size, max_brush_size));
}

//calculates canvas scale for different devices
function windowResized() {
  canvas_scale=min((windowWidth - 40) / canvas_base_width, (windowHeight - 200) / canvas_base_height, 1);
  resizeCanvas(canvas_base_width * canvas_scale, canvas_base_height * canvas_scale);
}

//tablet or phone user will not ruin drawing from touch
function touchStarted() { mousePressed(); return false; }
function touchMoved() { mouseDragged(); return false; }
function touchEnded() { mouseReleased(); return false; }
