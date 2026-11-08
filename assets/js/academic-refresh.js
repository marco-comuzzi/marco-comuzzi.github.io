/* Progressive enhancement: all publications and links work without JavaScript. */
(function () {
  "use strict";
  var menu = document.querySelector("#site-nav button");
  var overflow = document.querySelector("#navigation-overflow");
  if (menu && overflow) {
    var syncMenu = function () {
      menu.setAttribute("aria-expanded", String(!overflow.classList.contains("hidden")));
    };
    new MutationObserver(syncMenu).observe(overflow, { attributes: true, attributeFilter: ["class"] });
    syncMenu();
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !overflow.classList.contains("hidden")) {
        overflow.classList.add("hidden");
        menu.classList.remove("close");
        syncMenu();
        menu.focus();
      }
    });
  }
  if (document.body.getAttribute("data-page") !== "/publications/") return;
  var archive = document.querySelector(".archive");
  var input = document.getElementById("publication-query");
  var count = document.getElementById("publication-count");
  var control = document.querySelector(".publication-search");
  if (!archive || !input || !count || !control) return;
  // Direct paragraphs after the Book heading are complete citation blocks.
  var started = false;
  var entries = [];
  Array.prototype.forEach.call(archive.children, function (element) {
    if (element.id === "book") started = true;
    if (started && element.tagName === "P") {
      element.classList.add("publication-entry");
      entries.push(element);
    }
  });
  if (!entries.length) return;
  control.hidden = false;
  function filter() {
    var query = input.value.trim().toLocaleLowerCase();
    var visible = 0;
    entries.forEach(function (entry) {
      entry.hidden = entry.textContent.toLocaleLowerCase().indexOf(query) === -1;
      if (!entry.hidden) visible += 1;
    });
    count.textContent = visible + " of " + entries.length + " publication entries shown";
  }
  input.addEventListener("input", filter);
  // Jumping to a year should never land on a section hidden by an old query.
  document.querySelector(".publication-years").addEventListener("click", function (event) {
    var link = event.target.closest("a");
    if (link) {
      input.value = "";
      filter();
      // The theme's smooth-scroll handler prevents native hash updates.
      // Preserve deep links and browser history without interfering with scrolling.
      if (link.hash && window.location.hash !== link.hash) {
        window.history.pushState(null, "", link.hash);
      }
    }
  });
  filter();
}());
