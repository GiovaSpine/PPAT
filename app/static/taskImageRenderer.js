import { lctx, uctx, lcanvas,state } from "./taskState.js";
import { bounding_boxes, construction_lines, construction_points, label_points, temp_lines } from "./taskMain.js";

export function draw(){
  // before drawing we have to eliminate the content of the upper canvas
  uctx.clearRect(0, 0, lcanvas.width, lcanvas.height);

  // draw the image
  lctx.fillStyle = "rgb(230, 230, 230)";
  lctx.fillRect(0, 0, lcanvas.width, lcanvas.height);
  lctx.drawImage(state.image, state.image_x, state.image_y, state.image.width * state.image_scale, state.image.height * state.image_scale);

  // we need to draw the varius temporary lines...
  for(let i = 0; i < temp_lines[state.index].length; i++){
    temp_lines[state.index][i].draw();
  }

  // we need to draw the bounding box
  if(bounding_boxes[state.index] != null) bounding_boxes[state.index].draw();

  // we need to draw the construction lines
  for(let i = 0; i < state.nconstructionlines; i++){
    if(construction_lines[state.index][i] != null) construction_lines[state.index][i].draw();
  }

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
  if(state.image.width > lcanvas.width || state.image.height > lcanvas.height){
    // we need to scale down the image
    state.image_scale_width = lcanvas.width / state.image.width;
    state.image_scale_height = lcanvas.height / state.image.height;

    state.image_scale = Math.min(state.image_scale_width, state.image_scale_height);

    state.image_x = (lcanvas.width / 2) - ((state.image.width * state.image_scale) / 2);
    state.image_y = (lcanvas.height / 2) - ((state.image.height * state.image_scale) / 2);
  } else {

    state.image_scale = 1.0;
    
    state.image_x = (lcanvas.width / 2) - (state.image.width / 2);
    state.image_y = (lcanvas.height / 2) - (state.image.height / 2);
  }
}
