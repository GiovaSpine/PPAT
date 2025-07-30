import { ctx, canvas, state } from "./taskState.js";
import { Line, Point } from "./taskClasses.js" ;
import { bounding_boxes, construction_points, label_points, temp_lines } from "./taskMain.js";

export function draw(){
  ctx.fillStyle = "rgb(230, 230, 230)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(state.image, state.image_x, state.image_y, state.image.width * state.image_scale, state.image.height * state.image_scale);

  // we need to draw the varius temporary lines...
  for(let i = 0; i < temp_lines[state.index].length; i++){
    temp_lines[state.index][i].draw();
  }

  // we need to draw the bounding box
  if(bounding_boxes[state.index] != null) bounding_boxes[state.index].draw();

  // we need to draw the varius points...
  for(let i = 0; i < state.nconstructionpoints; i++){
    if(construction_points[state.index][i] != null) construction_points[state.index][i].draw();
  }

  for(let i = 0; i < state.nimages; i++){
    if(label_points[state.index][i] != null) label_points[state.index][i].draw();
  }

  
  
}

export function initial_position_and_scale(){
  // determines the initial position and scale of the image
  if(state.image.width > canvas.width || state.image.height > canvas.height){
    // we need to scale down the image
    state.image_scale_width = canvas.width / state.image.width;
    state.image_scale_height = canvas.height / state.image.height;

    state.image_scale = Math.min(state.image_scale_width, state.image_scale_height);

    state.image_x = (canvas.width / 2) - ((state.image.width * state.image_scale) / 2);
    state.image_y = (canvas.height / 2) - ((state.image.height * state.image_scale) / 2);
  } else {

    state.image_scale = 1.0;
    
    state.image_x = (canvas.width / 2) - (state.image.width / 2);
    state.image_y = (canvas.height / 2) - (state.image.height / 2);
  }
}

export async function draw_initial_image_on_canvas(image, xi, yi) {
  if(image.width > canvas.width || image.height > canvas.height){
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
    ctx.drawImage(image, image_x, image_y);
  }
}
