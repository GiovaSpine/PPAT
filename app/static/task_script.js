console.log("Testing task_script.js");


const counter = document.getElementById('counter');

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
let image_x = 0;
let image_y = 0;
let image_scale = 1.0;


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
    console.error("Errore durante il caricamento dati:", error);
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
      
      if(image_scale_width < image_scale_height) image_scale = image_scale_width;
      else image_scale = image_scale_height;

      console.log(image_scale);
      
      image_x = (canvas.width / 2) - ((image.width * image_scale) / 2);
      image_y = (canvas.height / 2) - ((image.height * image_scale) / 2);

      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, image_x, image_y, image.width * image_scale, image.height * image_scale);
      URL.revokeObjectURL(url); // free the memory
    } else {

      image_x = (canvas.width / 2) - (image.width / 2);
      image_y = (canvas.height / 2) - (image.height / 2);

      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, image_x, image_y)
      
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


