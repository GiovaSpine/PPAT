import { canvas, state } from "./taskState.js";

// CANVAS / IMAGE UTILS FUNCTIONS

export function page_pos_to_canvas_pos(x, y){
  // converts a postion relative to the page to a position relative to the canvas
  // it can't return null (because if the canvas was clicked in a certain position, it was clicked on the canvas)
  const rect = canvas.getBoundingClientRect();

  // coordinates of x, y inside the canvas
  // because rect.top considers the viewport, we have to add window.scrollY (to obtain absolute position in the page)
  const cursur_x_canvas = x - rect.left;
  const cursur_y_canvas = y - (rect.top + window.scrollY);

  return [cursur_x_canvas, cursur_y_canvas];
}

export function canvas_pos_to_image_pos(x, y, return_anyway=false){
  // converts a position relative to canvas to a position relative to the image
  // returns null if the canvas position is outside the image and return_anyway = false
  // if return_anyway = true return the position regardless

  const cursur_x_image = (x - state.image_x) / state.image_scale;
  const cursur_y_image = (y - state.image_y) / state.image_scale;

  if(return_anyway) return [cursur_x_image, cursur_y_image];

  if(cursur_x_image < 0 || cursur_x_image >= state.image.width || cursur_y_image < 0 || cursur_y_image >= state.image.height) return null;
  else return [cursur_x_image, cursur_y_image];
}

export function is_image_clicked(x, y){
  const [cursur_x_canvas, cursur_y_canvas] = page_pos_to_canvas_pos(x, y);

  // x_inside = true when the x position for the cursur was inside the image during click
  // (the same for y)
  let x_inside, y_inside;

  // am i clicking on the image ?
  if(state.image_x >= 0 && state.image_x + (state.image.width * state.image_scale) - 1 <= canvas.width - 1){
    // the image is inside the canvas
    if(cursur_x_canvas >= state.image_x && cursur_x_canvas <= state.image_x + (state.image.width * state.image_scale)){
      x_inside = true;
    } else {
      x_inside = false;
    }
  } else {
    // the image is outside the canvas (we can't trust image_x or image_x + (image.width * image_scale))
    if(cursur_x_canvas >= Math.max(state.image_x, 0) && cursur_x_canvas <= Math.min(state.image_x + (state.image.width * state.image_scale), canvas.width)){
      x_inside = true;
    } else {
      x_inside = false;
    }
  }


  if(state.image_y >= 0 && state.image_y + (state.image.height * state.image_scale) - 1 <= canvas.height - 1){
    // the image is inside the canvas
    if(cursur_y_canvas >= state.image_y && cursur_y_canvas <= state.image_y + (state.image.height * state.image_scale)){
      y_inside = true;
    } else {
      y_inside = false;
    }
  } else {
    // the image is outside the canvas (we can't trust image_y or image_y + (image.height * image_scale) )
    if(cursur_y_canvas >= Math.max(state.image_y, 0) && cursur_y_canvas <= Math.min(state.image_y + (state.image.height * state.image_scale), canvas.height)){
      y_inside = true;
    } else {
      y_inside = false;
    }
  }
  
  return x_inside && y_inside;
}

// ========================================================

// VECTOR OPERATIONS

export function vector_add(a, b) {
  return a.map((val, i) => val + b[i]);
}

export function vector_diff(a, b) {
  return a.map((val, i) => val - b[i]);
}

export function vector_dot(a, b) {
  return a.reduce((sum, val, i) => sum + val * b[i], 0);
}

export function vector_norm(v) {
  return Math.sqrt(v.reduce((sum, val) => sum + val * val, 0));
}

export function vector_normalize(v) {
  const norm = vector_norm(v);
  if (norm === 0) throw new Error("Cannot normalize zero vector");
  return v.map(val => val / norm);
}
