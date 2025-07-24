console.log("Testing task_script.js");


const counter = document.getElementById("counter");

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = 1400;
canvas.height = 800;

let npoints = 0;
let nimages = 0;
let image_list = [];

const task_directory = '/task/';
const images_directory = task_directory + 'Images/';

let index = 0;

let cursur_x = 0;
let cursur_y = 0;
let zoom = 100;

let image_x = 0;
let image_y = 0;
let image_width = 0;
let image_height = 0;
let image_scale = 1.0;

class Point {
  constructor(x, y, color){
    // in an image x is the rows, y is the columns and (0, 0) is at the top left corner
    this.x = x;
    this.y = y;
    this.color = color;
    this.radius = 20;
  }
  draw(){
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ============================================================================


// various functions for fetching...
async function fetch_data() {
  const response = await fetch(task_directory + "data.json");
  if (!response.ok) {
    throw new Error("Error during data.json fetch");
  }
  const data = await response.json();
  console.log("data: ", data);
  npoints = data.npoints;
  nimages = data.nimages;
  return null;
}
async function fetch_image_list() {
  const response = await fetch(task_directory + "images.json");
  if (!response.ok) {
    throw new Error("Error during images.json fetch");
  }
  const data = await response.json();
  console.log("image list: ", data);
  image_list = data;
  return null;
}
async function fetch_image(index) {
  if(index >= 0 && index < nimages){
    const response = await fetch(images_directory + image_list[index]);
    if (!response.ok) {
      throw new Error("Error during image fetch");
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    console.log("image: ", url);
    return url;
  } else {
    console.log("Not valid index in fetch_image");
    return null;
  }
}


async function main() {
  try {
    await fetch_data();
    await fetch_image_list();

    draw_initial_image_on_canvas(index);

  } catch (error) {
    console.error("Error during loading of certain datas:", error);
  }
}

main();



async function draw_initial_image_on_canvas(index) {
  const url = await fetch_image(index);
  if (url == null) return;

  const image = new Image();
  image.onload = function () {

    if(image.width > canvas.width || image.height > canvas.height){
      // we need to scale down the image

      image_scale_width = canvas.width / image.width;
      image_scale_height = canvas.height / image.height;
      
      image_scale = Math.min(image_scale_width, image_scale_height);
      
      image_x = (canvas.width / 2) - ((image.width * image_scale) / 2);
      image_y = (canvas.height / 2) - ((image.height * image_scale) / 2);
      
      image_width = image.width * image_scale;
      image_height = image.height * image_scale;

      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, image_x, image_y, image_width, image_height);
      URL.revokeObjectURL(url); // free the memory
    } else {

      image_x = (canvas.width / 2) - (image.width / 2);
      image_y = (canvas.height / 2) - (image.height / 2);

      image_width = image.width;
      image_height = image.height;

      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, image_x, image_y)
      URL.revokeObjectURL(url); // free the memory
    }
    
  };
  image.src = url;
}

function next_image() {
    if (index < nimages - 1) {
    image_x = 0;
    image_y = 0;
    image_scale = 1.0;
    index++;
    draw_initial_image_on_canvas(index);
    counter.textContent = `${index + 1} / ${nimages}`;
    }
}

function prev_image() {
    if (index > 0) {
    image_x = 0;
    image_y = 0;
    image_scale = 1.0;
    index--;
    draw_initial_image_on_canvas(index);
    counter.textContent = `${index + 1} / ${nimages}`;
    }
}




window.addEventListener("click", function(e){ 
  const rect = canvas.getBoundingClientRect();
  
  // coordinates of x, y inside the canvas
  // because rect.top considers the viewport, we have to add window.scrollY (to obtain absolute position in the page)
  const cursur_x_canvas = e.x  - rect.left;
  const cursur_y_canvas = e.pageY - (rect.top + window.scrollY);

  // am i clicking on the image ?
  if(image_x >= 0 && image_x + image_width <= canvas.width){
    // the image is inside the canvas
    if(cursur_x_canvas >= image_x && cursur_x_canvas <= image_x + image_width){
      console.log("x is inside");
    } else {
      console.log("x is outside");
    }
  } else {
    // the image is outside the canvas (we can't trust image_x or image_x + image_width)
    if(cursur_x_canvas >= Math.max(image_x, 0) && cursur_x_canvas <= Math.min(image_x + image_width, canvas.width)){
      console.log("x is inside");
    } else {
      console.log("x is outside");
    }
  }

  if(image_y >= 0 && image_y + image_height <= canvas.height){
    // the image is inside the canvas
    if(cursur_y_canvas >= image_y && cursur_y_canvas <= image_y + image_height){
      console.log("y is in inside");
    } else {
      console.log("y is outside");
    }
  } else {
    // the image is outside the canvas (we can't trust image_y or image_y + image_height)
    if(cursur_y_canvas >= Math.max(image_y, 0) && cursur_y_canvas <= Math.min(image_y + image_height, canvas.height)){
      console.log("y is in inside");
    } else {
      console.log("y is outside");
    }
  }


})
