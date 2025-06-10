const html = document.getElementById("htmlPage");
const checkbox = document.getElementById("checkSwitch");
const themeToggle = document.getElementById("themeToggle");

function updateTheme(isDark) {
  html.setAttribute("data-bs-theme", isDark ? "dark" : "light");
  themeToggle.classList.remove("bi-moon-fill", "bi-sun-fill");
  themeToggle.classList.add(isDark ? "bi-sun-fill" : "bi-moon-fill");
  checkbox.checked = isDark;
  localStorage.setItem("theme", isDark ? "dark" : "light");
}

const savedTheme = localStorage.getItem("theme");
updateTheme(savedTheme === "dark");

themeToggle.addEventListener("click", () => {
  updateTheme(!checkbox.checked);
});
updateTheme(checkbox.checked);
