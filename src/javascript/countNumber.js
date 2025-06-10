const counters = document.querySelectorAll(".js-counter .span");
const animated = new Set();

function animate(el) {
  if (animated.has(el)) return;
  animated.add(el);

  let count = 0;
  const target = +el.dataset.count;
  const step = target > 1 ? Math.ceil(target / 500) : 1;

  const timer = setInterval(() => {
    count = Math.min(count + step, target);
    el.textContent = count;
    if (count >= target) clearInterval(timer);
  }, 1);
}

window.addEventListener("scroll", () => {
  counters.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 100 && !animated.has(el)) {
      animate(el);
    }
  });
});
