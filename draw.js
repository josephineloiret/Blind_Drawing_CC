let hidden_drawing; 
let hidden=true;
let drawing=false;
let X;
let Y;
let color='black';

function setup(){
  createCanvas(1500, 800); //canvas size that hides the drawing
  hidden_drawing=createGraphics(1500,800); //size of hidden drawing
  hidden_drawing.background('white'); //drawing background
  hidden_drawing.stroke(0); //drawing color
  hidden_drawing.strokeWeight(5); //thickness of drawing
}

function draw(){
  background('black'); //black background
  //INSTRUCTIONS:
  fill('white'); //text color of the instructions
  textSize(25); //text size of the instructions 
  text(`Use mouse to draw. Press r to reveal. Press s to save.`, 10, 40); //instructions for user
  textSize(15); //text size of the color instructions 
  text('Change stroke color: 1 for black, 2 for green, 3 for blue, 4 for red, 5 for yellow',10, 60) //instructions for color changing
  //show drawing or not
  if (!hidden){ //if hidden is false, drawing will be shown
    image(hidden_drawing,0,0);
  }
}

//start drawing function
function mousePressed(){
  drawing=true; //user started drawing so becomes true
  X=mouseX; //x position
  Y=mouseY; //y position
}

//function called when mouse is dragged while being pressed 
function mouseDragged(){
  hidden_drawing.stroke(color);           
  hidden_drawing.line(X,Y,mouseX,mouseY); 
  X=mouseX; //x position
  Y=mouseY; // y position
}

//stop drawing function
function mouseReleased(){
  drawing = false; //user stopped drawing so becomes false
}

//saving and revealing/hiding drawing
function keyPressed(){
  if (key==='r'){
    hidden=!hidden; //change value of hidden
  }
  if (key==='s') {
    saveCanvas(hidden_drawing,'drawing','png'); //save drawing as png
  }
  if (key==='1'){ //changing color, same below
    color='black';
  }
  if (key==='2'){
    color='green';
  }
  if (key==='3'){
    color='blue';
  }
  if (key==='4'){
    color='red';
  }
  if (key==='5'){
    color='yellow';
  }
}