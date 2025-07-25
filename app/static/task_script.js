console.log("Testing task_script.js");


const counter = document.getElementById("counter");  // the counter element that shows 1/34, for example

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

let image = null;
let image_x = 0;
let image_y = 0;
let image_scale = 1.0;


let vanishing_points_x = new Array(nimages);
let vanishing_points_y = new Array(nimages);
let vanishing_points_z = new Array(nimages);
let construction_points = new Array(nimages);
let label_points = new Array(nimages);


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
  if (index >= 0 && index < nimages) {
    const response = await fetch(images_directory + image_list[index]);
    if (!response.ok) {
      throw new Error("Errore durante il fetch dell'immagine");
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve(img); // risolviamo solo quando l'immagine è completamente pronta
        URL.revokeObjectURL(url);  // forse c'è da sposrtarlo
      };
      img.src = url;
    });
  } else {
    console.log("Indice non valido in fetch_image V2");
    return null;
  }
}


async function main() {
  try {
    await fetch_data();
    await fetch_image_list();
    image = await fetch_image(index);

    // at this point you have the image
    initial_position_and_scale();

    draw();

  } catch (error) {
    console.error("Error during loading of certain datas:", error);
  }
}

main();


function initial_position_and_scale(){
  // determines the initial position and scale of the image
  if(image.width > canvas.width || image.height > canvas.height){
    // we need to scale down the image
    image_scale_width = canvas.width / image.width;
    image_scale_height = canvas.height / image.height;
    
    image_scale = Math.min(image_scale_width, image_scale_height);
    
    image_x = (canvas.width / 2) - ((image.width * image_scale) / 2);
    image_y = (canvas.height / 2) - ((image.height * image_scale) / 2);
  } else {

    image_scale = 1.0;

    image_x = (canvas.width / 2) - (image.width / 2);
    image_y = (canvas.height / 2) - (image.height / 2);
  }
}


async function draw_initial_image_on_canvas(image, xi, yi) {

  if(image.width > canvas.width || image.height > canvas.height){
    // we need to scale down the image

    image_scale_width = canvas.width / image.width;
    image_scale_height = canvas.height / image.height;
    
    image_scale = Math.min(image_scale_width, image_scale_height);
    
    image_x = (canvas.width / 2) - ((image.width * image_scale) / 2) + xi;
    image_y = (canvas.height / 2) - ((image.height * image_scale) / 2) + yi;
    
    image_width = image.width * image_scale;
    image_height = image.height * image_scale;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, image_x, image_y, image_width, image_height);
  } else {

    image_x = (canvas.width / 2) - (image.width / 2) + xi;
    image_y = (canvas.height / 2) - (image.height / 2) + yi;

    image_width = image.width;
    image_height = image.height;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, image_x, image_y)
  }
    

}


function draw(){
  ctx.fillStyle = "rgb(230, 230, 230)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, image_x, image_y, image.width * image_scale, image.height * image_scale);
}

// ============================================================================

async function next_image() {
    if (index < nimages - 1) {
    index++;
    
    image = await fetch_image(index);
    // instead of remembering what was the last position and scale of the image, we reset those
    initial_position_and_scale();

    
    draw();
    counter.textContent = `${index + 1} / ${nimages}`;
    }
}

async function prev_image() {
    if (index > 0) {
    index--;

    image = await fetch_image(index);
    // instead of remembering what was the last position and scale of the image, we reset those
    initial_position_and_scale();

    draw();
    counter.textContent = `${index + 1} / ${nimages}`;
    }
}

function reset_view(){
  initial_position_and_scale();
  draw();
}



async function add_vanishing_point(){

  const e1 = await wait_for_click(ignore_first_click=true);  // the first click is the click of the button

  const e2 = await wait_for_click();
  
  const e3 = await wait_for_click();

  const e4 = await wait_for_click();

}



function wait_for_click(ignore_first_click = false) {
  return new Promise((resolve) => {
    let ignored = !ignore_first_click;

    function handler(e) {
      const x = e.pageX;
      const y = e.pageY;

      if (!ignored) {
        ignored = true; // ignores the first click if rquested
        return;
      }

      if (!is_image_clicked(x, y)) {
        console.log("Click ignored (outiside the image)");
        return; // continue to listen if the click is outside the image
      }

      document.removeEventListener("click", handler);
      resolve(e);
    }

    document.addEventListener("click", handler);
  });
}






// ============================================================================


function is_image_clicked(x, y){

  // x_inside = true when the x position for the cursur was inside the image during click
  // (the same for y)
  let x_inside;
  let y_inside;

  const rect = canvas.getBoundingClientRect();
  
  // coordinates of x, y inside the canvas
  // because rect.top considers the viewport, we have to add window.scrollY (to obtain absolute position in the page)
  const cursur_x_canvas = x  - rect.left;
  const cursur_y_canvas = y - (rect.top + window.scrollY);

  // am i clicking on the image ?
  if(image_x >= 0 && image_x + image.width - 1 <= canvas.width - 1){
    // the image is inside the canvas
    if(cursur_x_canvas >= image_x && cursur_x_canvas <= image_x + image.width){
      x_inside = true;
    } else {
      x_inside = false;
    }
  } else {
    // the image is outside the canvas (we can't trust image_x or image_x + image.width)
    if(cursur_x_canvas >= Math.max(image_x, 0) && cursur_x_canvas <= Math.min(image_x + image.width, canvas.width)){
      x_inside = true;
    } else {
      x_inside = false;
    }
  }

  if(image_y >= 0 && image_y + image.height - 1 <= canvas.height - 1){
    // the image is inside the canvas
    if(cursur_y_canvas >= image_y && cursur_y_canvas <= image_y + image.height){
      y_inside = true;
    } else {
      y_inside = false;
    }
  } else {
    // the image is outside the canvas (we can't trust image_y or image_y + image.height)
    if(cursur_y_canvas >= Math.max(image_y, 0) && cursur_y_canvas <= Math.min(image_y + image.height, canvas.height)){
      y_inside = true;
    } else {
      y_inside = false;
    }
  }

  return x_inside && y_inside;
}

function is_click_in_canvas(x, y){

  const rect = canvas.getBoundingClientRect();
  
  // coordinates of x, y inside the canvas
  // because rect.top considers the viewport, we have to add window.scrollY (to obtain absolute position in the page)
  const cursur_x_canvas = x  - rect.left;
  const cursur_y_canvas = y - (rect.top + window.scrollY);

  // am i clicking inside the canvas ?
  const x_inside = cursur_x_canvas >= 0 && cursur_x_canvas < canvas.width;
  const y_inside = cursur_y_canvas >= 0 && cursur_y_canvas < canvas.height;
  
  return x_inside && y_inside;
}

window.addEventListener("click", function(e){

  // for the y, it's necessary to use pageY, because there can be scroll of the page
  const x = e.pageX;
  const y = e.pageY

  const image_clicked = is_image_clicked(x, y);
  console.log("is image clicked ?", image_clicked);

})


let is_tracking = false;
let old_cursur_x = 0;
let old_cursur_y = 0;

document.addEventListener("mousedown", function(e) {
  if (e.button === 1 && is_click_in_canvas(e.pageX, e.pageY)) {  // 1 = scrolling wheel
    // start of tracking with scolling wheel

    is_tracking = true;

    old_cursur_x = e.pageX;
    old_cursur_y = e.pageY;
  
    e.preventDefault();  // to prevent the scroll
  }
});

document.addEventListener("mousemove", function(e) {
  if (is_tracking && is_click_in_canvas(e.pageX, e.pageY)) {

    // let's see the difference between the current position of the cursur and old_cursur_x, old_cursur_y position

    let delta_x = e.pageX - old_cursur_x;
    let delta_y = e.pageY - old_cursur_y;

    image_x = image_x + delta_x;
    image_y = image_y + delta_y;

    draw();

    // let's update old_cursur_x, old_cursur_y position
    old_cursur_x = e.pageX;
    old_cursur_y = e.pageY;
  }
});

document.addEventListener("mouseup", function(e) {
  if (e.button === 1 && is_tracking) {  // 1 = scrolling wheel
    // stop tracking with scrolling wheel
    is_tracking = false;
  }
});