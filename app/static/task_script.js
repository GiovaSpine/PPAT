console.log("Test task");

// test to se if the canvas works
window.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("main_canvas");
    if (canvas.getContext) {
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "blue";
        ctx.fillRect(10, 10, 100, 50);
    }
});
