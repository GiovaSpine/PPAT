import { counter, ctx, state } from "./taskState.js";
import { draw, initial_position_and_scale } from "./taskImageRenderer.js";
import { fetch_data, fetch_image_list, fetch_image } from "./taskDataLoader.js";
import { wait_for_click } from "./taskEvents.js";
import { Line, Point } from "./taskClasses.js";
import { page_pos_to_canvas_pos, canvas_pos_to_image_pos, vector_diff } from "./taskUtils.js";

window.next_image = next_image;
window.prev_image = prev_image;
window.reset_view = reset_view;

window.add_vanishing_point = add_vanishing_point;
window.add_construction_point = add_construction_point;
window.add_label_point = add_label_point;
window.change_point_color = change_point_color;
window.toggle_point_visibility = toggle_point_visibility;
window.delete_point = delete_point;



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
  counter.textContent = `${state.index + 1} / ${state.nimages}`;
}


async function prev_image() {
  state.index--;
  if(state.index < 0) state.index = state.nimages - 1;

  state.image = await fetch_image(state.index);

  initial_position_and_scale();

  update_points_container();

  draw();
  counter.textContent = `${state.index + 1} / ${state.nimages}`;
}

// ========================================================

function reset_view(){
  initial_position_and_scale();
  draw();
}

// ========================================================

// points structures
export let vanishing_points_x = null;  // array of nimages points, that rapresents vanishing points on the x axis
export let vanishing_points_y = null;
export let vanishing_points_z = null;
export let construction_points = null;  // array of nimages array of 100 construction points. Construction points are used to select label points precisely
export let label_points = null;  // array of nimages array of npoints label points. These are the actual label for the model
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

  temp_lines = new Array(state.nimages);
  for(let i = 0; i < state.nimages; i++){
    // for an image there are exactly npoints points
    temp_lines[i] = [];
  }
}


// ========================================================

// FUNCTIONS TO WORK ON THE TASK

let last_call_id = 0;

async function add_vanishing_point(type_of_vp){
  const this_call_id = ++last_call_id;

  if(temp_lines[state.index].length != 0){
    // that means we pressed the button add_vanishing_point after not completing the selection of a vanishing point
    // we assume that the user was not satisfied of his selection and wants to undo it
    // so have to remove the current temporary lines
    temp_lines[state.index] = [];
    draw();
  }

  const color = (type_of_vp == "x") ? "red" : (type_of_vp == "y") ? "green" :  "blue";

  const e1 = await wait_for_click(); if(this_call_id != last_call_id) return;
  
  const e2 = await wait_for_click(); if(this_call_id != last_call_id) return;
  // we need to obtain the line between the two
  const [cursur_x1_canvas, cursur_y1_canvas] = page_pos_to_canvas_pos(e1.pageX, e1.pageY);
  const [cursur_x1_image, cursur_y1_image] = canvas_pos_to_image_pos(cursur_x1_canvas, cursur_y1_canvas);
  const [cursur_x2_canvas, cursur_y2_canvas] = page_pos_to_canvas_pos(e2.pageX, e2.pageY);
  const [cursur_x2_image, cursur_y2_image] = canvas_pos_to_image_pos(cursur_x2_canvas, cursur_y2_canvas);

  const dir1 = vector_diff([cursur_x2_image, cursur_y2_image], [cursur_x1_image, cursur_y1_image]);  // dir goes from e1 to e2
  const line1 = new Line(cursur_x1_image, cursur_y1_image, dir1[0], dir1[1], color);
  
  temp_lines[state.index].push(line1);
  draw();

  const e3 = await wait_for_click(); if(this_call_id != last_call_id) return;
  const e4 = await wait_for_click(); if(this_call_id != last_call_id) return;
  // we need to obtain the line between the two
  const [cursur_x3_canvas, cursur_y3_canvas] = page_pos_to_canvas_pos(e3.pageX, e3.pageY);
  const [cursur_x3_image, cursur_y3_image] = canvas_pos_to_image_pos(cursur_x3_canvas, cursur_y3_canvas);
  const [cursur_x4_canvas, cursur_y4_canvas] = page_pos_to_canvas_pos(e4.pageX, e4.pageY);
  const [cursur_x4_image, cursur_y4_image] = canvas_pos_to_image_pos(cursur_x4_canvas, cursur_y4_canvas);

  const dir2 = vector_diff([cursur_x4_image, cursur_y4_image], [cursur_x3_image, cursur_y3_image]);  // dir goes from e3 to e4
  const line2 = new Line(cursur_x3_image, cursur_y3_image, dir2[0], dir2[1], color);

  temp_lines[state.index].push(line2);
  draw();

  // we wait the user to press enter

  const aspetta = await wait_for_click(); if(this_call_id != last_call_id) return;

  // now we find the intersection (that probably is outside the image)
  // that intersection Q is the vanishing point
  // we solve the linear system:
  // { Q = Pa + t1 * Da  ((Pa, Da) is line1)
  // { Q = Pb + t2 * Db  ((Pb, Db) is line2)

  const t2 = (line2.px * line1.dy - line1.px * line1.dy - line1.dx * line2.py + line1.dx * line1.py) / (line2.dy * line1.dx - line2.dx * line1.dy);
  const [qx, qy] = [line2.px + t2 * line2.dx, line2.py + t2 * line2.dy];

  console.log("====>", qx, qy);


  // at the end we don't care about the lines that he chose
  temp_lines[state.index] = [];
  draw();
}



async function add_label_point(){
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
}



async function add_construction_point(){
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

  for(let i = 0; i < state.npoints; i++){
    
    if(label_points[state.index][i] != null){
      const point_div = document.createElement("div");
      point_div.className = "label_point_item";
      point_div.id = `label_point_${i}`;

      point_div.innerHTML = `
        <span>Label Point ${i}</span>
        <div class="controls">
          <button onclick="change_point_color(${i}, 'label')">🎨</button>
          <button onclick="toggle_point_visibility(${i}, 'label')">👁️</button>
          <button onclick="delete_point(${i}, 'label')">🗑️</button>
        </div>
      `;

      container.appendChild(point_div);
    }
    
  }

  for(let i = 0; i < state.nconstructionpoints; i++){

    if(construction_points[state.index][i] != null){
      const pointDiv = document.createElement("div");
      pointDiv.className = "construction_point_item";
      pointDiv.id = `construction_point_${i}`;

      pointDiv.innerHTML = `
        <span>Construction Point ${i}</span>
        <div class="controls">
          <button onclick="change_point_color(${i}, 'construction')">🎨</button>
          <button onclick="toggle_point_visibility(${i}, 'construction')">👁️</button>
          <button onclick="delete_point(${i}, 'construction')">🗑️</button>
        </div>
      `;

      container.appendChild(pointDiv);
    }

  }

}


// Functions associated with the buttons in the points container
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

function toggle_point_visibility(id, type_of_point) {
  if(type_of_point == 'label'){
    const div = document.getElementById(`label_point_${id}`);

    label_points[state.index][id].hide = !label_points[state.index][id].hide;;
  } else if(type_of_point == 'construction') {
    const div = document.getElementById(`construction_point_${id}`);

    construction_points[state.index][id].hide = !construction_points[state.index][id].hide;
  } else console.log("Impossible to have this option (in the functions of points container)");
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
