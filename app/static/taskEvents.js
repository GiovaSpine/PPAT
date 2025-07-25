import { canvas, state } from "./taskState.js";
import { draw } from "./taskImageRenderer.js";
import { page_pos_to_canvas_pos, canvas_pos_to_image_pos, is_image_clicked } from "./taskUtils.js";


export function wait_for_click(ignore_first_click = false) {
  return new Promise((resolve) => {
    let ignored = !ignore_first_click;

    function handler(e) {
      const x = e.pageX;
      const y = e.pageY;

      if (!ignored) {
        ignored = true;  // ignores the first click if requested
        return;
      }

      if (!is_image_clicked(x, y)) {
        console.log("Click ignored (outiside the image)");
        return;  // continue to listen if the click is outside the image
      }

      canvas.removeEventListener("click", handler);
      resolve(e);  // return the position (you can choose which one (x, pageX, clientX))
    }

    canvas.addEventListener("click", handler);
  });
}

// ========================================================

// TEST

canvas.addEventListener("click", function(e){
  // function to test the click of the image
  const print = false;

  if(print){
    const x = e.pageX;
    const y = e.pageY;

    const image_clicked = is_image_clicked(x, y);
    console.log("is image clicked ?", image_clicked);

    const [cursur_x_canvas, cursur_y_canvas] = page_pos_to_canvas_pos(x, y);

    if(canvas_pos_to_image_pos(cursur_x_canvas, cursur_y_canvas) != null){
      const [cursur_x_image, cursur_y_image] = canvas_pos_to_image_pos(cursur_x_canvas, cursur_y_canvas);
      console.log("cursur position in the image:", cursur_x_image, cursur_y_image);
    }
  }
});

// ========================================================

// POSITION

let is_tracking = false;
let old_cursur_x = 0;
let old_cursur_y = 0;


canvas.addEventListener("mousedown", function(e) {
  if (e.button === 1) {  // 1 = scrolling wheel
    // start of tracking with scolling wheel

    is_tracking = true;

    old_cursur_x = e.pageX;
    old_cursur_y = e.pageY;

    e.preventDefault();  // to prevent the scroll
  }
});

canvas.addEventListener("mousemove", function(e) {
  if (is_tracking) {

    // let's see the difference between the current position of the cursur and old_cursur_x, old_cursur_y position
    const delta_x = e.pageX - old_cursur_x;
    const delta_y = e.pageY - old_cursur_y;

    state.image_x = state.image_x + delta_x;
    state.image_y = state.image_y + delta_y;

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

// ========================================================

// ZOOM AND SCALE

canvas.addEventListener("wheel", function (e) {
  e.preventDefault(); // avoid automatic scroll of the page

  // const factor = 1.1; is a reference
  const min_scale = 0.1, max_scale = 10;
  const delta = 64;

  // Warning: factor has to change based on the image size
  // because if it was constant a big image would be scaled more.
  // Let's take 640 x 640 pixels as a reference:
  // if 1.1 is the factor for 640 x 640 pixels, 64 is the delta between changes of dimension
  // if we want delta = 64 for every image, factor has to change
  const factor = (Math.max(state.image.width, state.image.height) + delta) / Math.max(state.image.width, state.image.height);

  // we will use them later...
  const [cursur_x_canvas, cursur_y_canvas] = page_pos_to_canvas_pos(e.pageX, e.pageY);
  const [cursur_x_image, cursur_y_image] = canvas_pos_to_image_pos(cursur_x_canvas, cursur_y_canvas, true);

  if (e.deltaY < 0) {
    // scroll up -> zoom in
    state.image_scale *= factor;
  } else {
    // scroll down -> zoom out
    state.image_scale /= factor;
  }

  // limit the scroll
  state.image_scale = Math.max(min_scale, Math.min(max_scale, state.image_scale));

  // we can't just increase or decrease image_scale
  // we want the zoom to happen in the position of the cursor, so image_x and image_y have to change
  state.image_x = cursur_x_canvas - (cursur_x_image * state.image_scale);
  state.image_y = cursur_y_canvas - (cursur_y_image * state.image_scale);

  draw();
});
