// public/components/sidebar.js
function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
}

function loadSidebar() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/";
    return;
  }

  const user = parseJwt(token);
  if (!user) {
    window.location.href = "/";
    return;
  }

  const sidebar = document.getElementById("sidebar");
  if (!sidebar) return;

  // Sidebar structure
  sidebar.innerHTML = `
    <div class="logo">
      <img src="/img/logo.png" alt="CourseFlow">
      <span class="logo-text">CourseFlow</span>
    </div>
    <ul id="menuList"></ul>
  `;

  const menuList = sidebar.querySelector("#menuList");
  let menuItems = [];

  if (user.role === "instructor") {
    menuItems = [
      { name: "Courses", icon: "school", url: "/courses" },
      { name: "Manage Courses", icon: "edit", url: "/courses/manage" }
    ];
  } else {
    menuItems = [
      { name: "Courses", icon: "school", url: "/courses" }
    ];
  }

  menuList.innerHTML = menuItems
    .map(item => `
      <li>
        <a href="${item.url}">
          <i class="material-icons">${item.icon}</i>
          ${item.name}
        </a>
      </li>
    `)
    .join("");
}
