function handleLogout() {
  const confirmed = window.confirm('Are you sure you want to log out?');
  if (!confirmed) {
    return;
  }

  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (error) {
    // Ignore storage errors
  }

  window.location.href = 'login.html';
}

function closeAllProfileMenus() {
  document.querySelectorAll('.profile-dropdown').forEach(menu => {
    menu.classList.remove('active');
  });
}

function toggleProfileMenu(button) {
  const menu = button.parentElement.querySelector('.profile-dropdown');
  if (!menu) {
    return;
  }

  const isActive = menu.classList.contains('active');
  closeAllProfileMenus();
  if (!isActive) {
    menu.classList.add('active');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-action="logout"]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      handleLogout();
    });
  });

  const profileButtons = document.querySelectorAll('.profile-btn');

  profileButtons.forEach(button => {
    if (button.parentElement.querySelector('.profile-dropdown')) {
      return;
    }

    const dropdown = document.createElement('div');
    dropdown.className = 'profile-dropdown';
    dropdown.innerHTML = `
      <button class="profile-menu-item" type="button">Logout</button>
    `;

    dropdown.querySelector('.profile-menu-item').addEventListener('click', (event) => {
      event.stopPropagation();
      closeAllProfileMenus();
      handleLogout();
    });

    button.parentElement.style.position = 'relative';
    button.parentElement.appendChild(dropdown);

    button.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleProfileMenu(button);
    });
  });

  document.addEventListener('click', () => {
    closeAllProfileMenus();
  });
});
