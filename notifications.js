function closeAllNotificationMenus() {
  document.querySelectorAll('.notification-dropdown').forEach(menu => {
    menu.classList.remove('active');
  });
}

function toggleNotificationMenu(button) {
  const menu = button.parentElement.querySelector('.notification-dropdown');
  if (!menu) {
    return;
  }

  const isActive = menu.classList.contains('active');
  closeAllNotificationMenus();
  if (!isActive) {
    menu.classList.add('active');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const notificationButtons = document.querySelectorAll('.notification-btn');

  notificationButtons.forEach(button => {
    if (button.parentElement.querySelector('.notification-dropdown')) {
      return;
    }

    const dropdown = document.createElement('div');
    dropdown.className = 'notification-dropdown';
    dropdown.innerHTML = `
      <div class="notification-header">Notifications</div>
      <div class="notification-list">
        <div class="notification-item">
          <div class="notification-title">New invoice received</div>
          <div class="notification-meta">2 mins ago</div>
        </div>
        <div class="notification-item">
          <div class="notification-title">Project update posted</div>
          <div class="notification-meta">1 hour ago</div>
        </div>
        <div class="notification-item">
          <div class="notification-title">Payment overdue reminder</div>
          <div class="notification-meta">Today</div>
        </div>
      </div>
      <button class="notification-action" type="button">View all notifications</button>
    `;

    const viewAllButton = dropdown.querySelector('.notification-action');
    viewAllButton.addEventListener('click', (event) => {
      event.stopPropagation();
      closeAllNotificationMenus();
      window.location.href = 'notifications.html';
    });

    button.parentElement.style.position = 'relative';
    button.parentElement.appendChild(dropdown);

    button.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleNotificationMenu(button);
    });
  });

  document.addEventListener('click', () => {
    closeAllNotificationMenus();
  });
});
