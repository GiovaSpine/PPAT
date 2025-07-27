import { counter, state } from "./taskState.js";
import { draw, initial_position_and_scale } from "./taskImageRenderer.js";
import { fetch_data, fetch_image_list, fetch_image } from "./taskDataLoader.js";
import { wait_for_click } from "./taskEvents.js";
window.next_image = next_image;
window.prev_image = prev_image;
window.reset_view = reset_view;
window.add_vanishing_point_x = add_vanishing_point_x;

async function main() {
  try {
    await fetch_data();
    await fetch_image_list();
    state.image = await fetch_image(state.index);

    // at this point you have the image
    initial_position_and_scale();

    draw();
  } catch (error) {
    console.error("Error during loading of certain datas:", error);
  }
}

main();

async function next_image() {
  state.index++;
  if(state.index >= state.nimages) state.index = 0;

  state.image = await fetch_image(state.index);

  initial_position_and_scale();

  draw();
  counter.textContent = `${state.index + 1} / ${state.nimages}`;
}

async function prev_image() {
  state.index--;
  if(state.index < 0) state.index = state.nimages - 1;

  state.image = await fetch_image(state.index);

  initial_position_and_scale();

  draw();
  counter.textContent = `${state.index + 1} / ${state.nimages}`;
}

function reset_view(){
  initial_position_and_scale();
  draw();
}

async function add_vanishing_point_x(){
  const e1 = await wait_for_click();
  const e2 = await wait_for_click();
  const e3 = await wait_for_click();
  const e4 = await wait_for_click();
}
