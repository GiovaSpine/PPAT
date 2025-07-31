import { counter, message_element, ucanvas, state, colors, icons_directories } from "./taskState.js";
import { draw, initial_position_and_scale } from "./taskImageRenderer.js";
import { fetch_data, fetch_image_list, fetch_image } from "./taskDataLoader.js";
import { wait_for_click_or_escape, wait_for_enter_or_escape } from "./taskEvents.js";
import { BoundingBox, ConstructionLine, Line, Point } from "./taskClasses.js";
import { page_pos_to_canvas_pos, canvas_pos_to_image_pos, vector_diff, is_image_clicked, vector_normalize } from "./taskUtils.js";

window.next_image = next_image;
window.prev_image = prev_image;
window.reset_view = reset_view;

window.add_vanishing_point = add_vanishing_point;
window.add_point = add_point;
window.add_construction_line = add_construction_line;
window.add_bounding_box = add_bounding_box;

window.delete_vanishing_point = delete_vanishing_point;
window.change_point_color = change_point_color;
window.toggle_point_visibility = toggle_point_visibility;
window.toggle_line_to_vp_visibility = toggle_line_to_vp_visibility;
window.delete_point = delete_point;
window.change_c_line_color = change_c_line_color;
window.toggle_c_line_visibility = toggle_c_line_visibility;
window.delete_c_line = delete_c_line;
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
  // let's reset the message
  message_element.textContent = "";
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
  // let's reset the message
  message_element.textContent = "";
}

// ========================================================

function reset_view(){
  initial_position_and_scale();
  draw();
}

// ========================================================

// points structures
export let vanishing_points_x = null;  // array of 'nimages' points, that rapresent vanishing points on the x axis
export let vanishing_points_y = null;
export let vanishing_points_z = null;
export let construction_points = null;  // array of 'nimages' array of  'nconstructionpoints' construction points. Construction points are used to select label points precisely
export let label_points = null;  // array of 'nimages' array of 'npoints' label points. These are the actual labels for the model
export let construction_lines = null;  // array of 'nimages' array of  'nconstructionlines' construction lines
export let bounding_boxes = null;  // array of 'nimages' bounding boxes
export let temp_lines = null;  // array of 'nimages' lists that containes temporary lines to draw


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

  construction_lines = new Array(state.nimages);
  for(let i = 0; i < state.nimages; i++){
    // for an image there are max nconstructionpoints construction points
    construction_lines[i] = new Array(state.nconstructionlines);
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
  document.getElementById("construction_line_button").disabled = !enabled;
  document.getElementById("bb_button").disabled = !enabled;

  // set the buttons of the varius elements in points_container
  const container = document.getElementById("points_container");
  const buttons = container.querySelectorAll("button");
  buttons.forEach(button => {
    button.disabled = !enabled;
  });
}


async function add_vanishing_point(type_of_vp){

  // check if there is already a vanishing point for type_of_vp axis
  const message = "Warning: there is already a vanishing point on the " + type_of_vp + " axis for this image";
  if(type_of_vp == 'x' && vanishing_points_x[state.index] != null) {message_element.textContent = message; return;}
  else if(type_of_vp == 'y' && vanishing_points_y[state.index] != null) {message_element.textContent = message; return;}
  else if(type_of_vp == 'z' && vanishing_points_z[state.index] != null) {message_element.textContent = message; return;}
  else message_element.textContent = "Select two point for the first line and two other points for the second line; press enter to confirm the selection or esc to undo the operation";


  set_all_buttons_enabled(false);  // deactivate all the buttons

  function undo_add_vanishing_point(){
    message_element.textContent = "";
    temp_lines[state.index] = [];
    draw();
    set_all_buttons_enabled(true);  // reactivate all the buttons
  }

  const color = colors[type_of_vp];

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

  message_element.textContent = "";
  update_points_container();
  draw();
  set_all_buttons_enabled(true);  // reactivate all the buttons
}


async function add_point(type_of_point){

  // check if there user added the vanishing points for every axis
  const is_vp_x_set = vanishing_points_x[state.index] != null;
  const is_vp_y_set = vanishing_points_y[state.index] != null;
  const is_vp_z_set = vanishing_points_z[state.index] != null;

  if (is_vp_x_set && is_vp_y_set && is_vp_z_set) {
    message_element.textContent = "Select the point or press esc to undo the operation";
  } else {
    // else there is at least one vanishing point that is not present
    let message = `Cannot add ${type_of_point} point: `;

    // let's find the missing vanishing points
    const missing = [];
    if (!is_vp_x_set) missing.push("x");
    if (!is_vp_y_set) missing.push("y");
    if (!is_vp_z_set) missing.push("z");

    if (missing.length >= 2) {
      message += "vanishing points missing for axes: " + missing.join(", ");
    } else {
      message += "vanishing point missing for axis: " + missing[0];
    }
    message_element.textContent = message;
    return;
  }

  // check if the user added to many points
  // we need to find an id for the point
  // we look at the first empty space in the corrisponding array
  let id = 0;
  if(type_of_point == "label"){
    for(; id < state.npoints; id++){
      if(label_points[state.index][id] == null) break;
    }
    if(id >= state.npoints){
      message_element.textContent = `Warning: you have reached tha max amount of label points: ${state.npoints}`;
      return;
    }
  } else if(type_of_point == "construction"){
    for(; id < state.nconstructionpoints; id++){
      if(construction_points[state.index][id] == null) break;
    }
    if(id >= state.nconstructionpoints){
      message_element.textContent = `Warning: you have reached tha max amount of construction points: ${state.nconstructionpoints}`;
      return;
    }
  } else console.log("Impossible to have this option in add_point");
  
  set_all_buttons_enabled(false);  // deactivate all the buttons

  const e = await wait_for_click_or_escape();
  if(e == null) {message_element.textContent = ""; set_all_buttons_enabled(true); return;}

  // let's make the point
  const [cursur_x_canvas, cursur_y_canvas] = page_pos_to_canvas_pos(e.pageX, e.pageY);
  const [cursur_x_image, cursur_y_image] = canvas_pos_to_image_pos(cursur_x_canvas, cursur_y_canvas);
  const point = new Point(cursur_x_image, cursur_y_image, colors[type_of_point]);

  // we need to add the perspective (the lines to the vanishing points)
  // let's calculate the vector from the point to the vanishing points (it's just point - vanishing point, all normalized)
  const dir_p_vp_x = vector_normalize(vector_diff([vanishing_points_x[state.index][0], vanishing_points_x[state.index][1]], [point.x, point.y]));
  const dir_p_vp_y = vector_normalize(vector_diff([vanishing_points_y[state.index][0], vanishing_points_y[state.index][1]], [point.x, point.y]));
  const dir_p_vp_z = vector_normalize(vector_diff([vanishing_points_z[state.index][0], vanishing_points_z[state.index][1]], [point.x, point.y]));
  point.line_to_vp_x = new Line(point.x, point.y, dir_p_vp_x[0], dir_p_vp_x[1] , colors["x"]);
  point.line_to_vp_y = new Line(point.x, point.y, dir_p_vp_y[0], dir_p_vp_y[1] , colors["y"]);
  point.line_to_vp_z = new Line(point.x, point.y, dir_p_vp_z[0], dir_p_vp_z[1] , colors["z"]);

  // let's add the point to the corresponding array
  if(type_of_point == "label"){
    label_points[state.index][id] = point;
  } else if(type_of_point == "construction"){
    construction_points[state.index][id] = point;
  } else console.log("Impossible to have this option in add_point");

  message_element.textContent = "";
  update_points_container();
  draw();
  set_all_buttons_enabled(true);  // reactivate all the buttons
}


async function add_construction_line(){
  // check if the user added to many construction lines
  // we need to find an id for the construction line
  // we look at the first empty space in the construction_lines array
  let id = 0;
  for(; id < state.nconstructionlines; id++){
    if(construction_lines[state.index][id] == null) break;
  }
  if(id >= state.nconstructionlines){
    // we have reached the max amount of construction lines
    message_element.textContent = `Warning: you have reached tha max amount of construction lines: ${state.nconstructionlines}`;
    return;
  }

  message_element.textContent = "Select two points to add a construction line; press enter to confirm the selection or esc to undo the operation ";

  set_all_buttons_enabled(false);  // deactivate all the buttons

  function undo_add_construction_line(id){
    message_element.textContent = "";
    construction_lines[state.index][id] = null;
    draw();
    set_all_buttons_enabled(true);  // reactivate all the buttons
  }

  // let's wait the user to enter the two points
  const e1 = await wait_for_click_or_escape();
  if(e1 == null) {undo_add_construction_line(id); return;}
  const [cursur_x1_canvas, cursur_y1_canvas] = page_pos_to_canvas_pos(e1.pageX, e1.pageY);
  const [cursur_x1_image, cursur_y1_image] = canvas_pos_to_image_pos(cursur_x1_canvas, cursur_y1_canvas);


  const mousemove_handler = function(e) {
    if(is_image_clicked(e.pageX, e.pageY)){
      const [cursur_x0_canvas, cursur_y0_canvas] = page_pos_to_canvas_pos(e.pageX, e.pageY);
      const [cursur_x0_image, cursur_y0_image] = canvas_pos_to_image_pos(cursur_x0_canvas, cursur_y0_canvas);

      // let's create the construction line
      const contruction_line = new ConstructionLine(cursur_x1_image, cursur_y1_image, cursur_x0_image, cursur_y0_image, colors["construction_line"]);
      // let's add it already in construction_lines (we might remove it later)
      construction_lines[state.index][id] = contruction_line;
      draw();
    }
  };

  // we show dynamically how the construction line can be
  ucanvas.addEventListener("mousemove", mousemove_handler);

  const e2 = await wait_for_click_or_escape();

  // after the second click remove the dynamic show of the construction line
  ucanvas.removeEventListener("mousemove", mousemove_handler);

  if(e2 == null) {undo_add_construction_line(id); return;}
  const [cursur_x2_canvas, cursur_y2_canvas] = page_pos_to_canvas_pos(e2.pageX, e2.pageY);
  const [cursur_x2_image, cursur_y2_image] = canvas_pos_to_image_pos(cursur_x2_canvas, cursur_y2_canvas);

  const contruction_line = new ConstructionLine(cursur_x1_image, cursur_y1_image, cursur_x2_image, cursur_y2_image, colors["construction_line"]);
  // let's add the contruction_line in construction_lines, to draw it
  construction_lines[state.index][id] = contruction_line;
  draw();

  // we wait the user to press enter
  const is_enter_pressed = await wait_for_enter_or_escape();
  if(is_enter_pressed == null) {undo_add_construction_line(id); return;}

  message_element.textContent = "";
  update_points_container();
  draw();
  set_all_buttons_enabled(true);  // reactivate all the buttons
}


async function add_bounding_box(){

  // check if there is already a bounding box
  if(bounding_boxes[state.index] != null){
    message_element.textContent = "Warning: there is already a bounding box for this image";
    return;
  } else message_element.textContent = "Select the two vertices for the bounding box; press enter to confirm the selection or esc to undo the operation";
  

  set_all_buttons_enabled(false);  // deactivate all the buttons

  function undo_add_bounding_box(){
    message_element.textContent = "";
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
    if(is_image_clicked(e.pageX, e.pageY)){
      const [cursur_x0_canvas, cursur_y0_canvas] = page_pos_to_canvas_pos(e.pageX, e.pageY);
      const [cursur_x0_image, cursur_y0_image] = canvas_pos_to_image_pos(cursur_x0_canvas, cursur_y0_canvas);

      // let's create the bounding box
      const bounding_box = new BoundingBox(cursur_x1_image, cursur_y1_image, cursur_x0_image, cursur_y0_image, colors["bounding_box"]);
      // let's add it already in bounding_boxes (we might remove it later)
      bounding_boxes[state.index] = bounding_box;
      draw();
    }
  };

  // we show dynamically how the bounding box can be
  ucanvas.addEventListener("mousemove", mousemove_handler);

  const e2 = await wait_for_click_or_escape();

  // after the second click remove the dynamic show of the bounding box
  ucanvas.removeEventListener("mousemove", mousemove_handler);

  if(e2 == null) {undo_add_bounding_box(); return;}
  const [cursur_x2_canvas, cursur_y2_canvas] = page_pos_to_canvas_pos(e2.pageX, e2.pageY);
  const [cursur_x2_image, cursur_y2_image] = canvas_pos_to_image_pos(cursur_x2_canvas, cursur_y2_canvas);

  // let's create the bounding box
  const bounding_box = new BoundingBox(cursur_x1_image, cursur_y1_image, cursur_x2_image, cursur_y2_image, colors["bounding_box"]);
  // let's add it already in bounding_boxes (we might remove it later)
  bounding_boxes[state.index] = bounding_box;
  draw();

  // let's wait the user to press enter if he is happy with the selection
  // or ESC if he wants to undo it
  const is_enter_pressed = await wait_for_enter_or_escape();
  if(is_enter_pressed == null) {undo_add_bounding_box(); return};

  message_element.textContent = "";
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
  // we have to look at some properties of the points, lines and bounding boxes
  // like "hide" to see which type of eye icon we have to use (hidder or not)
  // and "color" so that we can color the title of the point or line with the same color

  // creation of vanishing points elements
  if(vanishing_points_x[state.index] != null){
    const point_div = document.createElement("div");
    point_div.className = "vanishing_point_x_item";
    point_div.id = `vanishing_point_x_box`;
    point_div.innerHTML = `
      <span>Vanishing Point X</span>
      <div class="controls">
        <button onclick="delete_vanishing_point('x')">
          <img src="${icons_directories["trash"]}" alt="Delete" class="icon_button">
        </button>
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
        <button onclick="delete_vanishing_point('y')">
          <img src="${icons_directories["trash"]}" alt="Delete" class="icon_button">
        </button>
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
        <button onclick="delete_vanishing_point('z')">
          <img src="${icons_directories["trash"]}" alt="Delete" class="icon_button">
        </button>
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

      const eye_icon_directory = (construction_points[state.index][i].hide) ? icons_directories["eye-hidden"] : icons_directories["eye"];
      const eye_x_icon_directory = (construction_points[state.index][i].line_to_vp_x.hide) ? icons_directories["eye-hidden-x"] : icons_directories["eye-x"];
      const eye_y_icon_directory = (construction_points[state.index][i].line_to_vp_y.hide) ? icons_directories["eye-hidden-y"] : icons_directories["eye-y"];
      const eye_z_icon_directory = (construction_points[state.index][i].line_to_vp_z.hide) ? icons_directories["eye-hidden-z"] : icons_directories["eye-z"];

      point_div.innerHTML = `
        <span style="color: ${construction_points[state.index][i].color}">Construction Point ${i}</span>
        <div class="controls">
          <button onclick="change_point_color(${i}, 'construction')">
            <img src="${icons_directories["artist-palette"]}" alt="Artist Palette" class="icon_button">
          </button>
          <button onclick="toggle_point_visibility(${i}, 'construction')">
            <img src="${eye_icon_directory}" alt="Eye" class="icon_button">
          </button>
          <button onclick="delete_point(${i}, 'construction')">
            <img src="${icons_directories["trash"]}" alt="Delete" class="icon_button">
          </button>
          <button onclick="toggle_line_to_vp_visibility(${i}, 'construction', 'x')">
            <img src="${eye_x_icon_directory}" alt="Eye X" class="icon_button">
          </button>
          <button onclick="toggle_line_to_vp_visibility(${i}, 'construction', 'y')">
            <img src="${eye_y_icon_directory}" alt="Eye Y" class="icon_button">
          </button>
          <button onclick="toggle_line_to_vp_visibility(${i}, 'construction', 'z')">
            <img src="${eye_z_icon_directory}" alt="Eye Z" class="icon_button">
          </button>
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

      const eye_icon_directory = (label_points[state.index][i].hide) ? icons_directories["eye-hidden"] : icons_directories["eye"];
      const eye_x_icon_directory = (label_points[state.index][i].line_to_vp_x.hide) ? icons_directories["eye-hidden-x"] : icons_directories["eye-x"];
      const eye_y_icon_directory = (label_points[state.index][i].line_to_vp_y.hide) ? icons_directories["eye-hidden-y"] : icons_directories["eye-y"];
      const eye_z_icon_directory = (label_points[state.index][i].line_to_vp_z.hide) ? icons_directories["eye-hidden-z"] : icons_directories["eye-z"];

      point_div.innerHTML = `
        <span style="color: ${label_points[state.index][i].color}">Label Point ${i}</span>
        <div class="controls">
          <button onclick="change_point_color(${i}, 'label')">
            <img src="${icons_directories["artist-palette"]}" alt="Artist Palette" class="icon_button">
          </button>
          <button onclick="toggle_point_visibility(${i}, 'label')">
            <img src="${eye_icon_directory}" alt="Eye" class="icon_button">
          </button>
          <button onclick="delete_point(${i}, 'label')">
            <img src="${icons_directories["trash"]}" alt="Delete" class="icon_button">
          </button>
          <button onclick="toggle_line_to_vp_visibility(${i}, 'label', 'x')">
             <img src="${eye_x_icon_directory}" alt="Eye X" class="icon_button">
          </button>
          <button onclick="toggle_line_to_vp_visibility(${i}, 'label', 'y')">
             <img src="${eye_y_icon_directory}" alt="Eye Y" class="icon_button">
          </button>
          <button onclick="toggle_line_to_vp_visibility(${i}, 'label', 'z')">
             <img src="${eye_z_icon_directory}" alt="Eye Z" class="icon_button">
          </button>
        </div>
      `;

      container.appendChild(point_div);
    }
    
  }

  // creation of construction lines
  for(let i = 0; i < state.nconstructionlines; i++){

    if(construction_lines[state.index][i] != null){
      const point_div = document.createElement("div");
      point_div.className = "construction_line_item";
      point_div.id = `construction_line_${i}`;

      const eye_icon_directory = (construction_lines[state.index][i].hide) ? icons_directories["eye-hidden"] : icons_directories["eye"];

      point_div.innerHTML = `
        <span style="color: ${construction_lines[state.index][i].color}">Construction Line ${i}</span>
        <div class="controls">
          <button onclick="change_c_line_color(${i})">
            <img src="${icons_directories["artist-palette"]}" alt="Artist Palette" class="icon_button">
          </button>
          <button onclick="toggle_c_line_visibility(${i})">
            <img src="${eye_icon_directory}" alt="Eye" class="icon_button">
          </button>
          <button onclick="delete_c_line(${i})">
            <img src="${icons_directories["trash"]}" alt="Delete" class="icon_button">
          </button>
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

    const eye_icon_directory = (bounding_boxes[state.index].hide) ? icons_directories["eye-hidden"] : icons_directories["eye"];

    point_div.innerHTML = `
      <span>Bounding Box</span>
      <div class="controls">
        <button onclick="toggle_bounding_box_visibility()">
          <img src="${eye_icon_directory}" alt="Eye" class="icon_button">
        </button>
        <button onclick="delete_bounding_box()">
          <img src="${icons_directories["trash"]}" alt="Delete" class="icon_button">
        </button>
      </div>
    `;

    container.appendChild(point_div);
  }

}


// Functions associated with the buttons in the points container

function delete_vanishing_point(type_of_vp){
  // but what happens to the points alreay present ? we have to delete all of them
  for(let i = 0; i < state.nconstructionpoints; i++){
    construction_points[state.index][i] = null;
  }
  for(let i = 0; i < state.nimages; i++){
    label_points[state.index][i] = null;
  }

  if(type_of_vp == 'x'){
    vanishing_points_x[state.index] = null;
  } else if(type_of_vp == 'y'){
    vanishing_points_y[state.index] = null;
  } else if(type_of_vp == 'z'){
    vanishing_points_z[state.index] = null;
  } else console.log("Impossible to have this option (in the functions of points container)");

  draw();
  update_points_container();
}

// ------------------------------------

function change_point_color(id, type_of_point) {
  if(type_of_point == 'label'){
    const local_colors = colors["label_points_possibile_colors"];
    const current = label_points[state.index][id].color;
    const next = local_colors[(local_colors.indexOf(current) + 1) % local_colors.length];
    label_points[state.index][id].color = next;
  } else if(type_of_point == 'construction') {
    const local_colors = colors["construction_points_possibile_colors"];
    const current = construction_points[state.index][id].color;
    const next = local_colors[(local_colors.indexOf(current) + 1) % local_colors.length];
    construction_points[state.index][id].color = next;
  } else console.log("Impossible to have this option (in the functions of points container)");
  draw();
  update_points_container();
}

function toggle_point_visibility(id, type_of_point) {
  if(type_of_point == 'label'){
    label_points[state.index][id].hide = !label_points[state.index][id].hide;;
  } else if(type_of_point == 'construction') {
    construction_points[state.index][id].hide = !construction_points[state.index][id].hide;
  } else console.log("Impossible to have this option (in the functions of points container)");

  draw();
  update_points_container();
}

function toggle_line_to_vp_visibility(id, type_of_point, type_of_vp){
  if(type_of_point == 'label'){

    if(type_of_vp == 'x'){
      label_points[state.index][id].line_to_vp_x.hide = !label_points[state.index][id].line_to_vp_x.hide;
    }
    else if(type_of_vp == 'y'){
      label_points[state.index][id].line_to_vp_y.hide = !label_points[state.index][id].line_to_vp_y.hide;
    }
    else if(type_of_vp == 'z'){
      label_points[state.index][id].line_to_vp_z.hide = !label_points[state.index][id].line_to_vp_z.hide;
    }
    else console.log("Impossible to have this option (in the functions of points container)");
    
  } else if(type_of_point == 'construction') {

    if(type_of_vp == 'x'){
      construction_points[state.index][id].line_to_vp_x.hide = !construction_points[state.index][id].line_to_vp_x.hide;
    }
    else if(type_of_vp == 'y'){
      construction_points[state.index][id].line_to_vp_y.hide = !construction_points[state.index][id].line_to_vp_y.hide;
    }
    else if(type_of_vp == 'z'){
      construction_points[state.index][id].line_to_vp_z.hide = !construction_points[state.index][id].line_to_vp_z.hide;
    }
    else console.log("Impossible to have this option (in the functions of points container)");

  } else console.log("Impossible to have this option (in the functions of points container)");

  draw();
  update_points_container();
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

// ------------------------------------

function change_c_line_color(id){
  const local_colors = colors["construction_lines_possibile_colors"];
  const current = construction_lines[state.index][id].color;
  const next = local_colors[(local_colors.indexOf(current) + 1) % local_colors.length];
  construction_lines[state.index][id].color = next;
  draw();
  update_points_container();
}

function toggle_c_line_visibility(id){
  construction_lines[state.index][id].hide = !construction_lines[state.index][id].hide;
  draw();
  update_points_container();
}

function delete_c_line(id){
  construction_lines[state.index][id] = null;
  draw();
  update_points_container();
}

// ------------------------------------

function toggle_bounding_box_visibility(){
  bounding_boxes[state.index].hide = !bounding_boxes[state.index].hide;

  draw();
  update_points_container();
}

function delete_bounding_box(){
  bounding_boxes[state.index] = null;
  draw();
  update_points_container();
}

