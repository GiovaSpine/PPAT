import { counter, ctx, state } from "./taskState.js";
import { draw, initial_position_and_scale } from "./taskImageRenderer.js";
import { fetch_data, fetch_image_list, fetch_image } from "./taskDataLoader.js";
import { wait_for_click, wait_for_click_or_escape, wait_for_enter_or_escape } from "./taskEvents.js";
import { BoundingBox, Line, Point } from "./taskClasses.js";
import { page_pos_to_canvas_pos, canvas_pos_to_image_pos, vector_diff } from "./taskUtils.js";

window.next_image = next_image;
window.prev_image = prev_image;
window.reset_view = reset_view;

window.add_vanishing_point = add_vanishing_point;
window.add_construction_point = add_construction_point;
window.add_label_point = add_label_point;
window.add_bounding_box = add_bounding_box;

window.delete_vanishing_point = delete_vanishing_point;
window.change_point_color = change_point_color;
window.toggle_point_visibility = toggle_point_visibility;
window.delete_point = delete_point;
window.toggle_bounding_box_visibility = toggle_bounding_box_visibility;
window.delete_bounding_box = delete_bounding_box;



async function main() {
  try {
    await fetch_data();
    await fetch_image_list();
    state.image = await fetch_image(state.index);

    // at this point we know nimages
    initialize_points_structures();

    // at this point you have the image
    initial_position_and_scale();

    draw();
  } catch (error) {
    console.error("Error during loading of certain datas:", error);
  }
}

main();

// ========================================================


async function next_image() {
  state.index++;
  if(state.index >= state.nimages) state.index = 0;

  state.image = await fetch_image(state.index);

  initial_position_and_scale();

  update_points_container();

  draw();

  // let's update the counter of images
  counter.textContent = `${state.index + 1} / ${state.nimages}`;
}


async function prev_image() {
  state.index--;
  if(state.index < 0) state.index = state.nimages - 1;

  state.image = await fetch_image(state.index);

  initial_position_and_scale();

  update_points_container();

  draw();

  // let's update the counter of images
  counter.textContent = `${state.index + 1} / ${state.nimages}`;
}

// ========================================================

function reset_view(){
  initial_position_and_scale();
  draw();
}

// ========================================================

// points structures
export let vanishing_points_x = null;  // array of nimages points, that rapresent vanishing points on the x axis
export let vanishing_points_y = null;
export let vanishing_points_z = null;
export let construction_points = null;  // array of nimages array of 100 construction points. Construction points are used to select label points precisely
export let label_points = null;  // array of nimages array of npoints label points. These are the actual label for the model
export let bounding_boxes = null;  // array of nimages bounding boxes
export let temp_lines = null;  // array of nimages lists that containes temporary lines to draw


function initialize_points_structures(){
  // we should also check if there are already annotations (for now we don't do that)

  vanishing_points_x = new Array(state.nimages);  // for an image there is only one vanishing point on the x axis
  vanishing_points_y = new Array(state.nimages);
  vanishing_points_z = new Array(state.nimages);

  construction_points = new Array(state.nimages);
  for(let i = 0; i < state.nimages; i++){
    // for an image there are max nconstructionpoints construction points
    construction_points[i] = new Array(state.nconstructionpoints);
  }

  label_points = new Array(state.nimages);
  for(let i = 0; i < state.nimages; i++){
    // for an image there are exactly npoints points
    label_points[i] = new Array(state.npoints);
  }

  bounding_boxes = new Array(state.nimages);

  temp_lines = new Array(state.nimages);
  for(let i = 0; i < state.nimages; i++){
    // we can have 'n' temporary lines, but in practice there are 4
    temp_lines[i] = [];
  }
}


// ========================================================

// FUNCTIONS TO WORK ON THE TASK


function set_all_buttons_enabled(enabled){
  // we use this function to block the user from pressing buttons after activating a function

  // set the navigation buttons
  document.getElementById("prev_button").disabled = !enabled;
  document.getElementById("next_button").disabled = !enabled;

  // set the buttons to work on the task
  document.getElementById("vp_x_button").disabled = !enabled;
  document.getElementById("vp_y_button").disabled = !enabled;
  document.getElementById("vp_z_button").disabled = !enabled;
  document.getElementById("construction_button").disabled = !enabled;
  document.getElementById("label_button").disabled = !enabled;
  document.getElementById("bb_button").disabled = !enabled;

  // set the buttons of the varius elements in points_container
  const container = document.getElementById("points_container");
  const buttons = container.querySelectorAll("button");
  buttons.forEach(button => {
    button.disabled = !enabled;
  });
}


async function add_vanishing_point(type_of_vp){
  set_all_buttons_enabled(false);  // deactivate all the buttons

  function undo_add_vanishing_point(){
    temp_lines[state.index] = [];
    draw();
    set_all_buttons_enabled(true);  // reactivate all the buttons
  }

  const color = (type_of_vp == "x") ? "red" : (type_of_vp == "y") ? "green" :  "blue";

  // let's wait the user to enter the first two points
  const e1 = await wait_for_click_or_escape();
  if(e1 == null) {undo_add_vanishing_point(); return;}
  const [cursur_x1_canvas, cursur_y1_canvas] = page_pos_to_canvas_pos(e1.pageX, e1.pageY);
  const [cursur_x1_image, cursur_y1_image] = canvas_pos_to_image_pos(cursur_x1_canvas, cursur_y1_canvas);

  const e2 = await wait_for_click_or_escape();
  if(e2 == null) {undo_add_vanishing_point(); return;}
  const [cursur_x2_canvas, cursur_y2_canvas] = page_pos_to_canvas_pos(e2.pageX, e2.pageY);
  const [cursur_x2_image, cursur_y2_image] = canvas_pos_to_image_pos(cursur_x2_canvas, cursur_y2_canvas);

  // we need to obtain the line between the first two
  const dir1 = vector_diff([cursur_x2_image, cursur_y2_image], [cursur_x1_image, cursur_y1_image]);  // dir goes from e1 to e2
  const line1 = new Line(cursur_x1_image, cursur_y1_image, dir1[0], dir1[1], color);
  
  temp_lines[state.index].push(line1);
  draw();

  // let's wait the user to enter the last two points
  const e3 = await wait_for_click_or_escape();
  if(e3 == null) {undo_add_vanishing_point(); return;}
  const [cursur_x3_canvas, cursur_y3_canvas] = page_pos_to_canvas_pos(e3.pageX, e3.pageY);
  const [cursur_x3_image, cursur_y3_image] = canvas_pos_to_image_pos(cursur_x3_canvas, cursur_y3_canvas);

  const e4 = await wait_for_click_or_escape();
  if(e4 == null) {undo_add_vanishing_point(); return;}
  const [cursur_x4_canvas, cursur_y4_canvas] = page_pos_to_canvas_pos(e4.pageX, e4.pageY);
  const [cursur_x4_image, cursur_y4_image] = canvas_pos_to_image_pos(cursur_x4_canvas, cursur_y4_canvas);

 // we need to obtain the line between the last two
  const dir2 = vector_diff([cursur_x4_image, cursur_y4_image], [cursur_x3_image, cursur_y3_image]);  // dir goes from e3 to e4
  const line2 = new Line(cursur_x3_image, cursur_y3_image, dir2[0], dir2[1], color);

  temp_lines[state.index].push(line2);
  draw();

  // we wait the user to press enter
  const is_enter_pressed = await wait_for_enter_or_escape();
  if(is_enter_pressed == null) {undo_add_vanishing_point(); return;}

  // now we find the intersection (that probably is outside the image)
  // that intersection Q is the vanishing point
  // we solve the linear system:
  // { Q = Pa + t1 * Da  ((Pa, Da) is line1)
  // { Q = Pb + t2 * Db  ((Pb, Db) is line2)
  const t2 = (line2.px * line1.dy - line1.px * line1.dy - line1.dx * line2.py + line1.dx * line1.py) / (line2.dy * line1.dx - line2.dx * line1.dy);
  const [qx, qy] = [line2.px + t2 * line2.dx, line2.py + t2 * line2.dy];
  
  // let's add the vanishing point in the vanishing_points array
  if(type_of_vp == 'x') vanishing_points_x[state.index] = [qx, qy];
  else if(type_of_vp == 'y') vanishing_points_y[state.index] = [qx, qy];
  else if(type_of_vp == 'z') vanishing_points_z[state.index] = [qx, qy];
  else console.log("Impossible to have this option in add_vanishing_point");

  // at the end we don't care about the lines that he chose to find the vanishing point
  temp_lines[state.index] = [];

  update_points_container();

  draw();

  set_all_buttons_enabled(true);  // reactivate all the buttons
}


async function add_label_point(){
  set_all_buttons_enabled(false);  // deactivate all the buttons

  const e = await wait_for_click();

  // we need to find an id for the point
  // we look at the first empty space in the label_points[state.index] vector
  let id = 0;
  for(; id < state.npoints; id++){
    if(label_points[state.index][id] == null) break;
  }

  // let's add the label point in label_points
  const [cursur_x_canvas, cursur_y_canvas] = page_pos_to_canvas_pos(e.pageX, e.pageY);
  const [cursur_x_image, cursur_y_image] = canvas_pos_to_image_pos(cursur_x_canvas, cursur_y_canvas);
  const point = new Point(cursur_x_image, cursur_y_image, "blue");
  label_points[state.index][id] = point;

  update_points_container();

  draw();

  set_all_buttons_enabled(true);  // reactivate all the buttons
}


async function add_construction_point(){
  set_all_buttons_enabled(false);  // deactivate all the buttons

  const e = await wait_for_click();

  // we need to find an id for the point
  // we look at the first empty space in the construction_points[state.index] vector
  let id = 0;
  for(; id < state.npoints; id++){
    if(construction_points[state.index][id] == null) break;
  }
  
  // let's add the construction point in construction_points
  const [cursur_x_canvas, cursur_y_canvas] = page_pos_to_canvas_pos(e.pageX, e.pageY);
  const [cursur_x_image, cursur_y_image] = canvas_pos_to_image_pos(cursur_x_canvas, cursur_y_canvas);
  const point = new Point(cursur_x_image, cursur_y_image, "gray");
  construction_points[state.index][id] = point;

  update_points_container();

  draw();

  set_all_buttons_enabled(true);  // reactivate all the buttons
}


async function add_bounding_box(){
  set_all_buttons_enabled(false);  // deactivate all the buttons

  function undo_add_bounding_box(){
    bounding_boxes[state.index] = null;
    draw();
    set_all_buttons_enabled(true);  // reactivate all the buttons
  }

  // let's wait the user to enter the first point
  const e1 = await wait_for_click_or_escape();
  if(e1 == null) {undo_add_bounding_box(); return;}
  const [cursur_x1_canvas, cursur_y1_canvas] = page_pos_to_canvas_pos(e1.pageX, e1.pageY);
  const [cursur_x1_image, cursur_y1_image] = canvas_pos_to_image_pos(cursur_x1_canvas, cursur_y1_canvas);

  const mousemove_handler = function(e) {
    const [cursur_x0_canvas, cursur_y0_canvas] = page_pos_to_canvas_pos(e.pageX, e.pageY);
    const [cursur_x0_image, cursur_y0_image] = canvas_pos_to_image_pos(cursur_x0_canvas, cursur_y0_canvas);

    // let's create the bounding box
    const bounding_box = new BoundingBox(cursur_x1_image, cursur_y1_image, cursur_x0_image, cursur_y0_image, "red");
    // let's add it already in bounding_boxes (we might remove it later)
    bounding_boxes[state.index] = bounding_box;
    draw();
  };

  // we show dynamically how the bounding box can be
  canvas.addEventListener("mousemove", mousemove_handler);

  const e2 = await wait_for_click_or_escape();

  // after the second click remove the dynamic show of the bounding box
  canvas.removeEventListener("mousemove", mousemove_handler);

  if(e2 == null) {undo_add_bounding_box(); return;}
  const [cursur_x2_canvas, cursur_y2_canvas] = page_pos_to_canvas_pos(e2.pageX, e2.pageY);
  const [cursur_x2_image, cursur_y2_image] = canvas_pos_to_image_pos(cursur_x2_canvas, cursur_y2_canvas);

  // let's create the bounding box
  const bounding_box = new BoundingBox(cursur_x1_image, cursur_y1_image, cursur_x2_image, cursur_y2_image, "red");
  // let's add it already in bounding_boxes (we might remove it later)
  bounding_boxes[state.index] = bounding_box;
  draw();

  // let's wait the user to press enter if he is happy with the selection
  // or ESC if he wants to undo it
  const is_enter_pressed = await wait_for_enter_or_escape();
  if(is_enter_pressed == null) {undo_add_bounding_box(); return};

  update_points_container();

  set_all_buttons_enabled(true);  // reactivate all the buttons
}

// ========================================================

// POINTS CONTAINER

function update_points_container(){
  const container = document.getElementById("points_container");

  // let's eliminate all of the childs, regardless of their names
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  // now we create the new childs

  // creation of vanishing points elements
  if(vanishing_points_x[state.index] != null){
    const point_div = document.createElement("div");
    point_div.className = "vanishing_point_x_item";
    point_div.id = `vanishing_point_x_box`;
    point_div.innerHTML = `
      <span>Vanishing Point X</span>
      <div class="controls">
        <button onclick="delete_vanishing_point('x')">🗑️</button>
      </div>
    `;
    container.appendChild(point_div);
  }

  if(vanishing_points_y[state.index] != null){
    const point_div = document.createElement("div");
    point_div.className = "vanishing_point_y_item";
    point_div.id = `vanishing_point_y_box`;
    point_div.innerHTML = `
      <span>Vanishing Point Y</span>
      <div class="controls">
        <button onclick="delete_vanishing_point('y')">🗑️</button>
      </div>
    `;
    container.appendChild(point_div);
  }

  if(vanishing_points_z[state.index] != null){
    const point_div = document.createElement("div");
    point_div.className = "vanishing_point_z_item";
    point_div.id = `vanishing_point_z_box`;
    point_div.innerHTML = `
      <span>Vanishing Point Z</span>
      <div class="controls">
        <button onclick="delete_vanishing_point('z')">🗑️</button>
      </div>
    `;
    container.appendChild(point_div);
  }

  // creation of construction points elements
  for(let i = 0; i < state.nconstructionpoints; i++){

    if(construction_points[state.index][i] != null){
      const point_div = document.createElement("div");
      point_div.className = "construction_point_item";
      point_div.id = `construction_point_${i}`;

      point_div.innerHTML = `
        <span>Construction Point ${i}</span>
        <div class="controls">
          <button onclick="change_point_color(${i}, 'construction')">🎨</button>
          <button onclick="toggle_point_visibility(${i}, 'construction', this)">👁️</button>
          <button onclick="delete_point(${i}, 'construction')">🗑️</button>
        </div>
      `;

      container.appendChild(point_div);
    }

  }

  // creation of label points elements
  for(let i = 0; i < state.npoints; i++){
    
    if(label_points[state.index][i] != null){
      const point_div = document.createElement("div");
      point_div.className = "label_point_item";
      point_div.id = `label_point_${i}`;

      point_div.innerHTML = `
        <span>Label Point ${i}</span>
        <div class="controls">
          <button onclick="change_point_color(${i}, 'label')">🎨</button>
          <button onclick="toggle_point_visibility(${i}, 'label', this)">👁️</button>
          <button onclick="delete_point(${i}, 'label')">🗑️</button>
        </div>
      `;

      container.appendChild(point_div);
    }
    
  }

  // creation of bounding box element
  if(bounding_boxes[state.index] != null){
    const point_div = document.createElement("div");
    point_div.className = "bounding_box_item";
    point_div.id = `bounding_box`;

    point_div.innerHTML = `
      <span>Bounding Box</span>
      <div class="controls">
        <button onclick="toggle_bounding_box_visibility(this)">👁️</button>
        <button onclick="delete_bounding_box()">🗑️</button>
      </div>
    `;

    container.appendChild(point_div);
  }

}


// Functions associated with the buttons in the points container
function delete_vanishing_point(type_of_vanishing_point){
  if(type_of_vanishing_point == 'x'){
    vanishing_points_x[state.index] = null;
  } else if(type_of_vanishing_point == 'y'){
    vanishing_points_y[state.index] = null;
  } else if(type_of_vanishing_point == 'z'){
    vanishing_points_z[state.index] = null;
  } else console.log("Impossible to have this option (in the functions of points container)");
  update_points_container();
}

function change_point_color(id, type_of_point) {

  if(type_of_point == 'label'){
    const div = document.getElementById(`label_point_${id}`);
    const colors = ["red", "blue", "green", "orange", "black"];
    const current = div.style.color || "black";
    const next = colors[(colors.indexOf(current) + 1) % colors.length];
    div.style.color = next;

    label_points[state.index][id].color = next;
  } else if(type_of_point == 'construction') {
    const div = document.getElementById(`construction_point_${id}`);
    const colors = ["red", "blue", "green", "orange", "black"];
    const current = div.style.color || "black";
    const next = colors[(colors.indexOf(current) + 1) % colors.length];
    div.style.color = next;

    construction_points[state.index][id].color = next;
  } else console.log("Impossible to have this option (in the functions of points container)");
  draw();
}

function toggle_point_visibility(id, type_of_point, button) {
  let hide;

  if(type_of_point == 'label'){
    hide = label_points[state.index][id].hide;
    label_points[state.index][id].hide = !label_points[state.index][id].hide;;
  } else if(type_of_point == 'construction') {
    hide = construction_points[state.index][id].hide;
    construction_points[state.index][id].hide = !construction_points[state.index][id].hide;
  } else console.log("Impossible to have this option (in the functions of points container)");

  button.textContent = hide ? "👁️" : "👁️‍🗨️";
  draw();
}

function delete_point(id, type_of_point) {
  if(type_of_point == 'label'){
    label_points[state.index][id] = null;
  } else if(type_of_point == 'construction') {
    construction_points[state.index][id] = null;
  } else console.log("Impossible to have this option (in the functions of points container)");

  draw();
  update_points_container();
}


function toggle_bounding_box_visibility(button){
  let hide = bounding_boxes[state.index].hide;
  bounding_boxes[state.index].hide = !bounding_boxes[state.index].hide;

  button.textContent = hide ? "👁️" : "👁️‍🗨️";
  draw();
}

function delete_bounding_box(){
  bounding_boxes[state.index] = null;
  draw();
  update_points_container();
}

