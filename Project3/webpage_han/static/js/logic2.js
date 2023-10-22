// Highlight when moon illumination <=10 and cloud cover <= 10
document.addEventListener('DOMContentLoaded', function () {
    const rows = document.querySelectorAll("tr");
    rows.forEach(row => {
        const moonIllumination = parseInt(row.cells[1].textContent);
        const totalCloudCover = parseFloat(row.cells[3].textContent);
        if (moonIllumination <= 10 && totalCloudCover <= 10) {
            row.classList.add("highlight");
        }
    });
});
