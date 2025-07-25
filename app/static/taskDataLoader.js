import { task_directory, images_directory, state } from "./taskState.js";

// various functions for fetching...

export async function fetch_data() {
  const response = await fetch(task_directory + "data.json");
  if (!response.ok) throw new Error("Error during data.json fetch");
  const data = await response.json();
  console.log("data: ", data);
  state.npoints = data.npoints;
  state.nimages = data.nimages;
  return null;
}

export async function fetch_image_list() {
  const response = await fetch(task_directory + "images.json");
  if (!response.ok) throw new Error("Error during images.json fetch");
  const data = await response.json();
  console.log("image list: ", data);
  state.image_list = data;
  return null;
}

export async function fetch_image(index) {
  if (index >= 0 && index < state.nimages) {
    const response = await fetch(images_directory + state.image_list[index]);
    if (!response.ok) throw new Error("Error during fetch of an image");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve(img);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    });
  } else {
    console.log("Not valid index in fetch_image(index)");
    return null;
  }
}
