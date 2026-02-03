(() => {
  const TOAST_DURATION = 2600;

  const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

  const normalize = (text) => (text || '').toString().toLowerCase().trim();

  const roleRoutes = {
    admin: ['admin.html'],
    store: ['store.html'],
    scm: ['scm.html'],
    planning: ['planning-billing.html'],
    accounts: ['accounts-banking.html']
  };

  const publicPages = ['login.html', 'signup.html', 'forgot-password.html', 'reset-password.html', 'index.html'];

  const getRoleFromQuery = () => {
    const params = new URLSearchParams(window.location.search);
    const role = params.get('role');
    return role && roleRoutes[role] ? role : '';
  };

  const getStoredRole = () => {
    try {
      return localStorage.getItem('erpRole') || sessionStorage.getItem('erpRole') || '';
    } catch (error) {
      return '';
    }
  };

  const persistRole = (role) => {
    try {
      localStorage.setItem('erpRole', role);
      sessionStorage.setItem('erpRole', role);
    } catch (error) {
      // Ignore storage errors
    }
  };

  const getCurrentPage = () => {
    const path = window.location.pathname || '';
    const file = path.split('/').pop();
    return file || 'index.html';
  };

  const applyRoleAccess = () => {
    const roleFromQuery = getRoleFromQuery();
    const role = roleFromQuery || getStoredRole();

    if (roleFromQuery) {
      persistRole(roleFromQuery);
    }

    const currentPage = getCurrentPage();
    if (publicPages.includes(currentPage)) {
      return;
    }

    if (!role || !roleRoutes[role]) {
      window.location.href = 'login.html';
      return;
    }

    const allowed = roleRoutes[role];
    if (!allowed.includes(currentPage)) {
      window.location.href = allowed[0];
      return;
    }

    document.querySelectorAll('.nav-menu .nav-link').forEach((link) => {
      const href = link.getAttribute('href');
      if (!href) return;
      const normalizedHref = href.replace(/^\/+/, '');
      const item = link.closest('.nav-item');
      if (!item) return;
      item.style.display = allowed.includes(normalizedHref) ? '' : 'none';
    });
  };

  const ensureToastContainer = () => {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  };

  const showToast = (message) => {
    const container = ensureToastContainer();
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    window.setTimeout(() => {
      toast.classList.remove('show');
      window.setTimeout(() => {
        toast.remove();
      }, 300);
    }, TOAST_DURATION);
  };

  const ensureModalRoot = () => {
    let backdrop = document.querySelector('.ui-modal-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'ui-modal-backdrop';
      backdrop.innerHTML = `
        <div class="ui-modal" role="dialog" aria-modal="true">
          <div class="ui-modal-header">
            <div class="ui-modal-title"></div>
            <button class="ui-modal-close" type="button">&times;</button>
          </div>
          <form class="ui-modal-form">
            <div class="ui-modal-body"></div>
            <div class="ui-modal-footer">
              <button type="button" class="btn btn-secondary" data-modal-cancel>Cancel</button>
              <button type="submit" class="btn btn-primary" data-modal-submit>Save</button>
            </div>
          </form>
        </div>
      `;
      document.body.appendChild(backdrop);
    }
    return backdrop;
  };

  const openModal = ({ title, fields, submitLabel = 'Save', onSubmit }) => {
    const backdrop = ensureModalRoot();
    const modal = backdrop.querySelector('.ui-modal');
    const titleEl = backdrop.querySelector('.ui-modal-title');
    const body = backdrop.querySelector('.ui-modal-body');
    const form = backdrop.querySelector('.ui-modal-form');
    const submitButton = backdrop.querySelector('[data-modal-submit]');

    titleEl.textContent = title;
    submitButton.textContent = submitLabel;
    body.innerHTML = '';

    fields.forEach((field) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'form-group';
      const label = document.createElement('label');
      label.className = 'form-label';
      label.textContent = field.label;
      const input = field.type === 'select'
        ? document.createElement('select')
        : document.createElement(field.type === 'textarea' ? 'textarea' : 'input');

      input.className = field.type === 'textarea' ? 'form-textarea' : 'form-input';
      if (field.type === 'select') {
        input.className = 'form-select';
        (field.options || []).forEach((optionValue) => {
          const option = document.createElement('option');
          option.textContent = optionValue;
          option.value = optionValue;
          input.appendChild(option);
        });
      }

      if (field.type === 'date' || field.type === 'month' || field.type === 'file') {
        input.type = field.type;
      }

      if (field.placeholder) {
        input.placeholder = field.placeholder;
      }

      if (field.value && field.type !== 'file') {
        input.value = field.value;
      }

      if (field.readOnly) {
        input.readOnly = true;
      }

      if (field.disabled) {
        input.disabled = true;
      }

      input.dataset.field = field.name;
      wrapper.appendChild(label);
      wrapper.appendChild(input);
      body.appendChild(wrapper);
    });

    const closeModal = () => {
      backdrop.classList.remove('active');
      form.onsubmit = null;
    };

    backdrop.querySelector('.ui-modal-close').onclick = closeModal;
    backdrop.querySelector('[data-modal-cancel]').onclick = closeModal;
    backdrop.onclick = (event) => {
      if (event.target === backdrop) {
        closeModal();
      }
    };

    form.onsubmit = (event) => {
      event.preventDefault();
      const values = {};
      form.querySelectorAll('[data-field]').forEach((input) => {
        if (input.disabled) {
          return;
        }
        if (input.type === 'file') {
          values[input.dataset.field] = input.files && input.files[0] ? input.files[0].name : '';
          return;
        }
        values[input.dataset.field] = input.value.trim();
      });
      if (onSubmit) {
        onSubmit(values);
      }
      closeModal();
    };

    backdrop.classList.add('active');
  };

  const defaultNotifications = [
    { text: '3 new RFQ responses received.', meta: '5 minutes ago', tone: 'info' },
    { text: 'Purchase order PO-1287 approved.', meta: '25 minutes ago', tone: 'success' },
    { text: 'Low stock alert: Cement (OPC 53).', meta: '1 hour ago', tone: 'warning' },
    { text: 'Invoice INV-2026-0205 is overdue.', meta: 'Today · 9:10 AM', tone: 'danger' }
  ];

  const closeAllNotificationMenus = () => {
    document.querySelectorAll('.notification-dropdown').forEach(menu => {
      menu.classList.remove('active');
    });
  };

  const renderNotificationDropdown = (dropdown, notifications) => {
    const list = notifications.map((item) => `
      <div class="notification-item">
        <span class="notification-dot ${item.tone || 'info'}"></span>
        <div class="notification-content">
          <div class="notification-text">${item.text}</div>
          <div class="notification-meta">${item.meta}</div>
        </div>
      </div>
    `).join('');

    dropdown.innerHTML = `
      <div class="notification-header">
        <div class="notification-title">Notifications</div>
        <button class="notification-mark-read" type="button">Mark all read</button>
      </div>
      <div class="notification-list">
        ${list}
      </div>
      <div class="notification-footer">
        <button class="notification-view-all" type="button">View all</button>
      </div>
    `;
  };

  const setupNotificationDropdown = (button) => {
    if (!button || button.parentElement.querySelector('.notification-dropdown')) {
      return;
    }

    const dropdown = document.createElement('div');
    dropdown.className = 'notification-dropdown';
    renderNotificationDropdown(dropdown, defaultNotifications);

    dropdown.addEventListener('click', (event) => {
      event.stopPropagation();
    });

    const parent = button.parentElement;
    parent.style.position = 'relative';
    parent.appendChild(dropdown);

    const badge = button.querySelector('.notification-badge');

    dropdown.querySelector('.notification-mark-read').addEventListener('click', (event) => {
      event.stopPropagation();
      closeAllNotificationMenus();
      if (badge) {
        badge.textContent = '0';
        badge.style.display = 'none';
      }
      showToast('All notifications marked as read.');
    });

    dropdown.querySelector('.notification-view-all').addEventListener('click', (event) => {
      event.stopPropagation();
      closeAllNotificationMenus();
      showToast('Opening all notifications...');
    });

    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const isActive = dropdown.classList.contains('active');
      closeAllNotificationMenus();
      if (!isActive) {
        dropdown.classList.add('active');
      }
    });
  };

  const openAddUserModal = () => {
    openModal({
      title: 'Add User',
      submitLabel: 'Add User',
      fields: [
        { name: 'name', label: 'Full Name', placeholder: 'Enter full name' },
        { name: 'email', label: 'Email Address', placeholder: 'name@company.com' },
        { name: 'role', label: 'Role', type: 'select', options: ['Administrator', 'Project Manager', 'Procurement Manager', 'Finance Manager'] },
        { name: 'department', label: 'Department', placeholder: 'IT / Projects / SCM' },
        { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
      ],
      onSubmit: (values) => {
        const usersTable = document.querySelector('#users table tbody');
        if (!usersTable) {
          showToast('User table not found.');
          return;
        }
        const initials = values.name
          .split(' ')
          .filter(Boolean)
          .map((part) => part[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();
        const statusClass = normalize(values.status) === 'active' ? 'badge-success' : 'badge-warning';
        const roleClassMap = {
          'administrator': 'badge-danger',
          'project manager': 'badge-info',
          'procurement manager': 'badge-warning',
          'finance manager': 'badge-success'
        };
        const roleClass = roleClassMap[normalize(values.role)] || 'badge-info';
        const now = new Date();
        const formatted = now.toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>
            <div style="display: flex; align-items: center; gap: 12px;">
              <div class="avatar" style="background: #3b82f6; width: 36px; height: 36px;">${initials || 'NU'}</div>
              <strong>${values.name || 'New User'}</strong>
            </div>
          </td>
          <td>${values.email || 'user@buildpro.com'}</td>
          <td><span class="badge ${roleClass}">${values.role || 'Project Manager'}</span></td>
          <td>${values.department || 'General'}</td>
          <td><span class="badge ${statusClass}">${values.status || 'Active'}</span></td>
          <td>${formatted}</td>
          <td>
            <button class="btn btn-secondary btn-icon" style="padding: 6px;" data-action="edit-user" onclick="editUserRow(this)">📝</button>
            <button class="btn btn-secondary btn-icon" style="padding: 6px;" data-action="toggle-user" onclick="toggleUserRow(this)">🔒</button>
          </td>
        `;
        usersTable.prepend(row);
        initButtons();
        showToast('User added successfully.');
      }
    });
  };

  const openCreateRoleModal = () => {
    openModal({
      title: 'Create Role',
      submitLabel: 'Create Role',
      fields: [
        { name: 'roleName', label: 'Role Name', placeholder: 'e.g., Site Manager' },
        { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Short description of the role.' }
      ],
      onSubmit: (values) => {
        const rolesTab = document.querySelector('#roles');
        const saveButton = rolesTab?.querySelector('[data-action="save-permissions"]') || rolesTab?.querySelector('button.btn.btn-primary');
        if (!rolesTab || !saveButton) {
          showToast('Roles section not found.');
          return;
        }
        const block = document.createElement('div');
        block.style.marginBottom = '24px';
        block.innerHTML = `
          <h4 style="margin-bottom: 12px;">${values.roleName || 'New Role'}</h4>
          <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;">${values.description || 'Custom permissions set.'}</div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
            <label style="display: flex; align-items: center; gap: 8px;"><input type="checkbox" checked><span>View Dashboard</span></label>
            <label style="display: flex; align-items: center; gap: 8px;"><input type="checkbox"><span>Manage Users</span></label>
            <label style="display: flex; align-items: center; gap: 8px;"><input type="checkbox"><span>View Reports</span></label>
          </div>
        `;
        saveButton.parentElement.insertBefore(block, saveButton);
        showToast('Role created successfully.');
      }
    });
  };

  const openUploadDocumentModal = () => {
    openModal({
      title: 'Upload Document',
      submitLabel: 'Upload',
      fields: [
        { name: 'docName', label: 'Document Name', placeholder: 'Document name' },
        { name: 'file', label: 'Select File', type: 'file' },
        { name: 'type', label: 'Type', type: 'select', options: ['PDF', 'XLSX', 'DOCX'] },
        { name: 'category', label: 'Category', type: 'select', options: ['Technical', 'Financial', 'Legal', 'Operations'] },
        { name: 'uploadedBy', label: 'Uploaded By', placeholder: 'User name' },
        { name: 'size', label: 'Size', placeholder: 'e.g., 1.8 MB' }
      ],
      onSubmit: (values) => {
        const docsTable = document.querySelector('#documents table tbody');
        if (!docsTable) {
          showToast('Documents table not found.');
          return;
        }
        const now = new Date();
        const dateText = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
        const categoryClassMap = {
          'technical': 'badge-info',
          'financial': 'badge-success',
          'legal': 'badge-warning',
          'operations': 'badge-primary'
        };
        const categoryClass = categoryClassMap[normalize(values.category)] || 'badge-info';
        const row = document.createElement('tr');
        const displayName = values.docName || values.file || 'New_Document.pdf';
        row.innerHTML = `
          <td><strong>📄 ${displayName}</strong></td>
          <td>${values.type || 'PDF'}</td>
          <td><span class="badge ${categoryClass}">${values.category || 'Technical'}</span></td>
          <td>${values.uploadedBy || 'John Doe'}</td>
          <td>${dateText}</td>
          <td>${values.size || '1.0 MB'}</td>
          <td>
            <button class="btn btn-secondary btn-icon" style="padding: 6px;" data-action="view-document">👁️</button>
            <button class="btn btn-secondary btn-icon" style="padding: 6px;" data-action="download-document">⬇️</button>
          </td>
        `;
        docsTable.prepend(row);
        initButtons();
        showToast('Document uploaded successfully.');
      }
    });
  };

  const openAddItemModal = (prefill = {}) => {
    openModal({
      title: prefill.isEdit ? 'Edit Item' : 'Add Item',
      submitLabel: prefill.isEdit ? 'Update Item' : 'Add Item',
      fields: [
        { name: 'itemCode', label: 'Item Code', value: prefill.itemCode || '', placeholder: 'ITM-001' },
        { name: 'itemName', label: 'Item Name', value: prefill.itemName || '', placeholder: 'Item name' },
        { name: 'category', label: 'Category', type: 'select', options: ['Raw Materials', 'Finished Goods', 'Tools & Equipment', 'Safety Items'], value: prefill.category || '' },
        { name: 'warehouse', label: 'Warehouse', value: prefill.warehouse || '', placeholder: 'Main Warehouse' },
        { name: 'currentStock', label: 'Current Stock', value: prefill.currentStock || '', placeholder: '0' },
        { name: 'unit', label: 'Unit', value: prefill.unit || '', placeholder: 'Bags / Tons / Pieces' },
        { name: 'minLevel', label: 'Min Level', value: prefill.minLevel || '', placeholder: '0' },
        { name: 'unitPrice', label: 'Unit Price', value: prefill.unitPrice || '', placeholder: '₹0' },
        { name: 'status', label: 'Status', type: 'select', options: ['In Stock', 'Low Stock', 'Out of Stock'], value: prefill.status || '' }
      ],
      onSubmit: (values) => {
        const tableBody = document.querySelector('#inventory table tbody');
        if (!tableBody) {
          showToast('Inventory table not found.');
          return;
        }

        const normalizedStatus = normalize(values.status || prefill.status || 'In Stock');
        const statusClassMap = {
          'in stock': 'badge-success',
          'low stock': 'badge-warning',
          'out of stock': 'badge-danger'
        };
        const statusClass = statusClassMap[normalizedStatus] || 'badge-success';
        const categoryClassMap = {
          'raw materials': 'badge-info',
          'finished goods': 'badge-success',
          'tools & equipment': 'badge-warning',
          'safety items': 'badge-warning'
        };
        const categoryClass = categoryClassMap[normalize(values.category || prefill.category)] || 'badge-info';

        const stockValueNumber = Number(String(values.currentStock || prefill.currentStock || '0').replace(/[^0-9.]/g, ''))
          * Number(String(values.unitPrice || prefill.unitPrice || '0').replace(/[^0-9.]/g, ''));
        const stockValue = Number.isFinite(stockValueNumber) ? `₹${stockValueNumber.toLocaleString('en-IN')}` : '₹0';

        if (prefill.row) {
          const row = prefill.row;
          row.cells[0].innerHTML = `<strong>${values.itemCode || prefill.itemCode || 'ITM-NEW'}</strong>`;
          row.cells[1].textContent = values.itemName || prefill.itemName || 'New Item';
          row.cells[2].innerHTML = `<span class="badge ${categoryClass}">${values.category || prefill.category || 'Raw Materials'}</span>`;
          row.cells[3].textContent = values.warehouse || prefill.warehouse || 'Main Warehouse';
          row.cells[4].innerHTML = `<strong>${values.currentStock || prefill.currentStock || '0'}</strong>`;
          row.cells[5].textContent = values.unit || prefill.unit || 'Units';
          row.cells[6].textContent = values.minLevel || prefill.minLevel || '0';
          row.cells[7].textContent = values.unitPrice || prefill.unitPrice || '₹0';
          row.cells[8].innerHTML = `<strong>${stockValue}</strong>`;
          row.cells[9].innerHTML = `<span class="badge ${statusClass}">${values.status || prefill.status || 'In Stock'}</span>`;
          showToast('Item updated successfully.');
          return;
        }

        const row = document.createElement('tr');
        row.innerHTML = `
          <td><strong>${values.itemCode || 'ITM-NEW'}</strong></td>
          <td>${values.itemName || 'New Item'}</td>
          <td><span class="badge ${categoryClass}">${values.category || 'Raw Materials'}</span></td>
          <td>${values.warehouse || 'Main Warehouse'}</td>
          <td><strong>${values.currentStock || '0'}</strong></td>
          <td>${values.unit || 'Units'}</td>
          <td>${values.minLevel || '0'}</td>
          <td>${values.unitPrice || '₹0'}</td>
          <td><strong>${stockValue}</strong></td>
          <td><span class="badge ${statusClass}">${values.status || 'In Stock'}</span></td>
          <td>
            <button class="btn btn-secondary btn-icon" style="padding: 6px;" onclick="viewItemRow(this)">👁️</button>
            <button class="btn btn-secondary btn-icon" style="padding: 6px;" onclick="editItemRow(this)">📝</button>
          </td>
        `;
        tableBody.prepend(row);
        initButtons();
        showToast('Item added successfully.');
      }
    });
  };

  const openReadOnlyModal = ({ title, fields }) => {
    const backdrop = ensureModalRoot();
    const modal = backdrop.querySelector('.ui-modal');
    const titleEl = backdrop.querySelector('.ui-modal-title');
    const body = backdrop.querySelector('.ui-modal-body');
    const form = backdrop.querySelector('.ui-modal-form');
    const submitButton = backdrop.querySelector('[data-modal-submit]');
    const cancelButton = backdrop.querySelector('[data-modal-cancel]');

    titleEl.textContent = title;
    body.innerHTML = '';
    submitButton.style.display = 'none';
    cancelButton.textContent = 'Close';

    fields.forEach((field) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'form-group';
      const label = document.createElement('label');
      label.className = 'form-label';
      label.textContent = field.label;
      const value = document.createElement('div');
      value.className = 'form-readonly';
      value.textContent = field.value || '-';
      wrapper.appendChild(label);
      wrapper.appendChild(value);
      body.appendChild(wrapper);
    });

    const closeModal = () => {
      backdrop.classList.remove('active');
      form.onsubmit = null;
      submitButton.style.display = '';
      cancelButton.textContent = 'Cancel';
    };

    backdrop.querySelector('.ui-modal-close').onclick = closeModal;
    backdrop.querySelector('[data-modal-cancel]').onclick = closeModal;
    backdrop.onclick = (event) => {
      if (event.target === backdrop) {
        closeModal();
      }
    };

    form.onsubmit = (event) => {
      event.preventDefault();
      closeModal();
    };

    backdrop.classList.add('active');
  };

  const openCustomModal = ({ title, html, onMount }) => {
    const backdrop = ensureModalRoot();
    const titleEl = backdrop.querySelector('.ui-modal-title');
    const body = backdrop.querySelector('.ui-modal-body');
    const form = backdrop.querySelector('.ui-modal-form');
    const submitButton = backdrop.querySelector('[data-modal-submit]');
    const cancelButton = backdrop.querySelector('[data-modal-cancel]');

    titleEl.textContent = title;
    body.innerHTML = html;
    submitButton.style.display = 'none';
    cancelButton.textContent = 'Close';

    const closeModal = () => {
      backdrop.classList.remove('active');
      form.onsubmit = null;
      submitButton.style.display = '';
      cancelButton.textContent = 'Cancel';
    };

    backdrop.querySelector('.ui-modal-close').onclick = closeModal;
    backdrop.querySelector('[data-modal-cancel]').onclick = closeModal;
    backdrop.onclick = (event) => {
      if (event.target === backdrop) {
        closeModal();
      }
    };

    form.onsubmit = (event) => {
      event.preventDefault();
      closeModal();
    };

    backdrop.classList.add('active');
    if (onMount) {
      onMount(body, closeModal);
    }
  };

  const openTrackingModal = (details) => {
    openCustomModal({
      title: 'Live Tracking',
      html: `
        <div class="tracking-modal">
          <div class="tracking-summary">
            <div>
              <div class="tracking-label">PO Number</div>
              <div class="tracking-value">${details.po || '-'}</div>
            </div>
            <div>
              <div class="tracking-label">Destination</div>
              <div class="tracking-value">${details.destination || '-'}</div>
            </div>
            <div>
              <div class="tracking-label">Status</div>
              <div class="tracking-value">${details.status || 'In Transit'}</div>
            </div>
          </div>
          <div class="tracking-progress">
            <div class="tracking-label">Progress</div>
            <div class="progress-bar" style="height: 10px;">
              <div class="progress-fill success" style="width: ${details.progress || 45}%;"></div>
            </div>
            <div class="tracking-percent">${details.progress || 45}%</div>
            <input class="tracking-range" type="range" min="0" max="100" value="${details.progress || 45}">
          </div>
          <div class="tracking-steps">
            <div class="tracking-step active">Order Confirmed</div>
            <div class="tracking-step active">Dispatched</div>
            <div class="tracking-step">In Transit</div>
            <div class="tracking-step">Delivered</div>
          </div>
          <div class="tracking-map">
            <div class="tracking-map-icon">📍</div>
            <div>
              <div class="tracking-label">Live Location</div>
              <div class="tracking-value">${details.location || 'Highway NH-24, 12 km to site'}</div>
            </div>
          </div>
        </div>
      `,
      onMount: (body) => {
        const range = body.querySelector('.tracking-range');
        const fill = body.querySelector('.progress-fill');
        const percent = body.querySelector('.tracking-percent');
        if (range && fill && percent) {
          range.addEventListener('input', () => {
            fill.style.width = `${range.value}%`;
            percent.textContent = `${range.value}%`;
          });
        }
      }
    });
  };

  const openNotesModal = (details = {}) => {
    openCustomModal({
      title: 'Add Notes',
      html: `
        <div class="notes-modal">
          <div class="notes-header">
            <div>
              <div class="tracking-label">Reference</div>
              <div class="tracking-value">${details.reference || '-'}</div>
            </div>
            <div>
              <div class="tracking-label">Assigned To</div>
              <div class="tracking-value">${details.owner || 'SCM Manager'}</div>
            </div>
          </div>
          <div class="notes-tags">
            <button type="button" class="btn btn-secondary btn-icon notes-tag">Urgent</button>
            <button type="button" class="btn btn-secondary btn-icon notes-tag">Supplier</button>
            <button type="button" class="btn btn-secondary btn-icon notes-tag">Logistics</button>
          </div>
          <textarea class="form-textarea notes-text" placeholder="Add a note for this delivery..."></textarea>
          <div class="notes-footer">
            <span class="notes-count">0/240</span>
            <button type="button" class="btn btn-primary notes-save">Save Note</button>
          </div>
        </div>
      `,
      onMount: (body, closeModal) => {
        const textarea = body.querySelector('.notes-text');
        const count = body.querySelector('.notes-count');
        const save = body.querySelector('.notes-save');
        if (textarea && count) {
          textarea.addEventListener('input', () => {
            count.textContent = `${textarea.value.length}/240`;
          });
        }
        if (save) {
          save.addEventListener('click', () => {
            showToast('Note saved.');
            closeModal();
          });
        }
      }
    });
  };

  const openAddVendorModal = (prefill = {}) => {
    openModal({
      title: prefill.isEdit ? 'Edit Vendor' : 'Add Vendor',
      submitLabel: prefill.isEdit ? 'Update Vendor' : 'Add Vendor',
      fields: [
        { name: 'vendorId', label: 'Vendor ID', value: prefill.vendorId || '', placeholder: 'VEN-001' },
        { name: 'vendorName', label: 'Vendor Name', value: prefill.vendorName || '', placeholder: 'Vendor name' },
        { name: 'category', label: 'Category', type: 'select', options: ['Raw Materials', 'Equipment', 'Services'], value: prefill.category || '' },
        { name: 'contactPerson', label: 'Contact Person', value: prefill.contactPerson || '', placeholder: 'Contact person' },
        { name: 'phone', label: 'Phone', value: prefill.phone || '', placeholder: 'Phone number' },
        { name: 'email', label: 'Email', value: prefill.email || '', placeholder: 'email@example.com' },
        { name: 'rating', label: 'Rating', value: prefill.rating || '', placeholder: '4.5' },
        { name: 'totalOrders', label: 'Total Orders', value: prefill.totalOrders || '', placeholder: '0' },
        { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive', 'Blacklisted'], value: prefill.status || '' }
      ],
      onSubmit: (values) => {
        const tableBody = document.querySelector('#vendors table tbody');
        if (!tableBody) {
          showToast('Vendors table not found.');
          return;
        }
        const statusClassMap = {
          'active': 'badge-success',
          'inactive': 'badge-warning',
          'blacklisted': 'badge-danger'
        };
        const statusClass = statusClassMap[normalize(values.status || prefill.status)] || 'badge-success';
        const categoryClassMap = {
          'raw materials': 'badge-info',
          'equipment': 'badge-success',
          'services': 'badge-warning'
        };
        const categoryClass = categoryClassMap[normalize(values.category || prefill.category)] || 'badge-info';
        const initials = (values.vendorName || prefill.vendorName || 'VN')
          .split(' ')
          .filter(Boolean)
          .map((part) => part[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();

        if (prefill.row) {
          const row = prefill.row;
          row.cells[0].innerHTML = `<strong>${values.vendorId || prefill.vendorId || 'VEN-NEW'}</strong>`;
          row.cells[1].innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
              <div class="avatar" style="background: #3b82f6; width: 32px; height: 32px; font-size: 12px;">${initials}</div>
              <strong>${values.vendorName || prefill.vendorName || 'New Vendor'}</strong>
            </div>
          `;
          row.cells[2].innerHTML = `<span class="badge ${categoryClass}">${values.category || prefill.category || 'Raw Materials'}</span>`;
          row.cells[3].textContent = values.contactPerson || prefill.contactPerson || '';
          row.cells[4].textContent = values.phone || prefill.phone || '';
          row.cells[5].textContent = values.email || prefill.email || '';
          row.cells[6].innerHTML = `
            <div style="display: flex; align-items: center; gap: 4px;">
              <span style="color: #f59e0b;">⭐</span>
              <span style="font-weight: 600;">${values.rating || prefill.rating || '0'}</span>
            </div>
          `;
          row.cells[7].textContent = values.totalOrders || prefill.totalOrders || '0';
          row.cells[8].innerHTML = `<span class="badge ${statusClass}">${values.status || prefill.status || 'Active'}</span>`;
          showToast('Vendor updated successfully.');
          return;
        }

        const row = document.createElement('tr');
        row.innerHTML = `
          <td><strong>${values.vendorId || 'VEN-NEW'}</strong></td>
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div class="avatar" style="background: #3b82f6; width: 32px; height: 32px; font-size: 12px;">${initials}</div>
              <strong>${values.vendorName || 'New Vendor'}</strong>
            </div>
          </td>
          <td><span class="badge ${categoryClass}">${values.category || 'Raw Materials'}</span></td>
          <td>${values.contactPerson || ''}</td>
          <td>${values.phone || ''}</td>
          <td>${values.email || ''}</td>
          <td>
            <div style="display: flex; align-items: center; gap: 4px;">
              <span style="color: #f59e0b;">⭐</span>
              <span style="font-weight: 600;">${values.rating || '0'}</span>
            </div>
          </td>
          <td>${values.totalOrders || '0'}</td>
          <td><span class="badge ${statusClass}">${values.status || 'Active'}</span></td>
          <td>
            <button class="btn btn-secondary btn-icon" style="padding: 6px;" onclick="viewVendorRow(this)">👁️</button>
            <button class="btn btn-secondary btn-icon" style="padding: 6px;" onclick="editVendorRow(this)">📝</button>
          </td>
        `;
        tableBody.prepend(row);
        showToast('Vendor added successfully.');
      }
    });
  };

  const openCreateRFQModal = () => {
    openModal({
      title: 'Create RFQ',
      submitLabel: 'Create RFQ',
      fields: [
        { name: 'rfqNo', label: 'RFQ No.', placeholder: '#RFQ-XXXX' },
        { name: 'project', label: 'Project', placeholder: 'Project name' },
        { name: 'items', label: 'Items', placeholder: 'Item list' },
        { name: 'vendors', label: 'Vendors', placeholder: 'Number of vendors' },
        { name: 'deadline', label: 'Deadline', type: 'date' },
        { name: 'status', label: 'Status', type: 'select', options: ['Draft', 'Sent', 'Responses Received', 'Finalized'] }
      ],
      onSubmit: (values) => {
        const tableBody = document.querySelector('#rfqs table tbody');
        if (!tableBody) {
          showToast('RFQ table not found.');
          return;
        }
        const statusClassMap = {
          'draft': 'badge-info',
          'sent': 'badge-warning',
          'responses received': 'badge-success',
          'finalized': 'badge-success'
        };
        const statusClass = statusClassMap[normalize(values.status)] || 'badge-info';
        const row = document.createElement('tr');
        row.innerHTML = `
          <td><strong>${values.rfqNo || '#RFQ-NEW'}</strong></td>
          <td>${values.project || '-'}</td>
          <td>${values.items || '-'}</td>
          <td>${values.vendors || '0'}</td>
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-weight: 600;">0/${values.vendors || '0'}</span>
              <div class="progress-bar" style="width: 60px; height: 6px;">
                <div class="progress-fill" style="width: 0%;"></div>
              </div>
            </div>
          </td>
          <td>${new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</td>
          <td>${values.deadline || '-'}</td>
          <td><span class="badge ${statusClass}">${values.status || 'Draft'}</span></td>
          <td>
            <button class="btn btn-secondary btn-icon" style="padding: 6px;" onclick="viewRFQRow(this)">👁️</button>
            <button class="btn btn-secondary btn-icon" style="padding: 6px;" onclick="editRFQRow(this)">📝</button>
          </td>
        `;
        tableBody.prepend(row);
        showToast('RFQ created.');
      }
    });
  };

  const viewRFQRow = (button) => {
    const row = button?.closest('tr');
    if (!row) {
      showToast('RFQ not found.');
      return;
    }
    openReadOnlyModal({
      title: 'RFQ Details',
      fields: [
        { label: 'RFQ No.', value: row.cells[0]?.textContent.trim() || '' },
        { label: 'Project', value: row.cells[1]?.textContent.trim() || '' },
        { label: 'Items', value: row.cells[2]?.textContent.trim() || '' },
        { label: 'Vendors', value: row.cells[3]?.textContent.trim() || '' },
        { label: 'Responses', value: row.cells[4]?.innerText.trim() || '' },
        { label: 'Created Date', value: row.cells[5]?.textContent.trim() || '' },
        { label: 'Deadline', value: row.cells[6]?.textContent.trim() || '' },
        { label: 'Status', value: row.cells[7]?.innerText.trim() || '' }
      ]
    });
  };

  const editRFQRow = (button) => {
    const row = button?.closest('tr');
    if (!row) {
      showToast('RFQ not found.');
      return;
    }
    openModal({
      title: 'Edit RFQ',
      submitLabel: 'Update RFQ',
      fields: [
        { name: 'rfqNo', label: 'RFQ No.', value: row.cells[0]?.textContent.trim() || '' },
        { name: 'project', label: 'Project', value: row.cells[1]?.textContent.trim() || '' },
        { name: 'items', label: 'Items', value: row.cells[2]?.textContent.trim() || '' },
        { name: 'vendors', label: 'Vendors', value: row.cells[3]?.textContent.trim() || '' },
        { name: 'deadline', label: 'Deadline', value: row.cells[6]?.textContent.trim() || '' },
        { name: 'status', label: 'Status', type: 'select', options: ['Draft', 'Sent', 'Responses Received', 'Finalized'], value: row.cells[7]?.innerText.trim() || '' }
      ],
      onSubmit: (values) => {
        row.cells[0].innerHTML = `<strong>${values.rfqNo || row.cells[0]?.textContent.trim()}</strong>`;
        row.cells[1].textContent = values.project || row.cells[1]?.textContent.trim();
        row.cells[2].textContent = values.items || row.cells[2]?.textContent.trim();
        row.cells[3].textContent = values.vendors || row.cells[3]?.textContent.trim();
        row.cells[6].textContent = values.deadline || row.cells[6]?.textContent.trim();
        row.cells[7].innerHTML = `<span class="badge badge-info">${values.status || row.cells[7]?.innerText.trim()}</span>`;
        showToast('RFQ updated.');
      }
    });
  };

  const openCreatePOModal = (prefill = {}) => {
    openModal({
      title: 'Create PO',
      submitLabel: 'Create PO',
      fields: [
        { name: 'poNumber', label: 'PO Number', value: prefill.poNumber || '', placeholder: 'PO-2026-XXXX' },
        { name: 'vendor', label: 'Vendor', value: prefill.vendor || '', placeholder: 'Vendor name' },
        { name: 'project', label: 'Project', value: prefill.project || '', placeholder: 'Project name' },
        { name: 'items', label: 'Items', value: prefill.items || '', placeholder: 'Items' },
        { name: 'amount', label: 'Amount', value: prefill.amount || '', placeholder: '₹0' },
        { name: 'date', label: 'Date', type: 'date' },
        { name: 'deliveryDate', label: 'Delivery Date', type: 'date' },
        { name: 'status', label: 'Status', type: 'select', options: ['Draft', 'Pending Approval', 'Approved', 'In Transit', 'Delivered'] }
      ],
      onSubmit: (values) => {
        const tableBody = document.querySelector('#purchaseOrders table tbody');
        if (!tableBody) {
          showToast('PO table not found.');
          return;
        }
        const statusClassMap = {
          'draft': 'badge-info',
          'pending approval': 'badge-warning',
          'approved': 'badge-success',
          'in transit': 'badge-info',
          'delivered': 'badge-success'
        };
        const statusClass = statusClassMap[normalize(values.status)] || 'badge-info';
        const row = document.createElement('tr');
        row.innerHTML = `
          <td><strong>${values.poNumber || 'PO-NEW'}</strong></td>
          <td>${values.vendor || '-'}</td>
          <td>${values.project || '-'}</td>
          <td>${values.items || '-'}</td>
          <td><strong>${values.amount || '₹0'}</strong></td>
          <td>${values.date || '-'}</td>
          <td>${values.deliveryDate || '-'}</td>
          <td><span class="badge ${statusClass}">${values.status || 'Draft'}</span></td>
          <td>
            <button class="btn btn-secondary btn-icon" style="padding: 6px;" onclick="viewPORow(this)">👁️</button>
            <button class="btn btn-secondary btn-icon" style="padding: 6px;" onclick="viewPODocument(this)">📄</button>
          </td>
        `;
        tableBody.prepend(row);
        showToast('PO created.');
      }
    });
  };

  const viewPORow = (button) => {
    const row = button?.closest('tr');
    if (!row) {
      showToast('PO not found.');
      return;
    }
    openReadOnlyModal({
      title: 'Purchase Order Details',
      fields: [
        { label: 'PO Number', value: row.cells[0]?.textContent.trim() || '' },
        { label: 'Vendor', value: row.cells[1]?.textContent.trim() || '' },
        { label: 'Project', value: row.cells[2]?.textContent.trim() || '' },
        { label: 'Items', value: row.cells[3]?.textContent.trim() || '' },
        { label: 'Amount', value: row.cells[4]?.textContent.trim() || '' },
        { label: 'Date', value: row.cells[5]?.textContent.trim() || '' },
        { label: 'Delivery Date', value: row.cells[6]?.textContent.trim() || '' },
        { label: 'Status', value: row.cells[7]?.innerText.trim() || '' }
      ]
    });
  };

  const viewPODocument = () => {
    showToast('Opening PO document.');
  };

  const openNewRequisitionModal = () => {
    openModal({
      title: 'New Requisition',
      submitLabel: 'Create Requisition',
      fields: [
        { name: 'reqNo', label: 'Req. No.', placeholder: 'MR-2026-XXXX' },
        { name: 'project', label: 'Project', placeholder: 'Project name' },
        { name: 'requestedBy', label: 'Requested By', placeholder: 'Name' },
        { name: 'items', label: 'Items', placeholder: 'Item list' },
        { name: 'quantity', label: 'Quantity', placeholder: 'Quantity' },
        { name: 'priority', label: 'Priority', type: 'select', options: ['High', 'Medium', 'Low'] },
        { name: 'date', label: 'Date', type: 'date' },
        { name: 'status', label: 'Status', type: 'select', options: ['Pending', 'Approved', 'Processing', 'Fulfilled'] }
      ],
      onSubmit: (values) => {
        const tableBody = document.querySelector('#requisitions table tbody');
        if (!tableBody) {
          showToast('Requisitions table not found.');
          return;
        }
        const priorityClassMap = {
          'high': 'badge-danger',
          'medium': 'badge-warning',
          'low': 'badge-info'
        };
        const statusClassMap = {
          'pending': 'badge-warning',
          'approved': 'badge-success',
          'processing': 'badge-info',
          'fulfilled': 'badge-success'
        };
        const priorityClass = priorityClassMap[normalize(values.priority)] || 'badge-info';
        const statusClass = statusClassMap[normalize(values.status)] || 'badge-warning';
        const row = document.createElement('tr');
        row.innerHTML = `
          <td><strong>${values.reqNo || 'MR-NEW'}</strong></td>
          <td>${values.project || '-'}</td>
          <td>${values.requestedBy || '-'}</td>
          <td>${values.items || '-'}</td>
          <td>${values.quantity || '-'}</td>
          <td><span class="badge ${priorityClass}">${values.priority || 'Low'}</span></td>
          <td>${values.date || '-'}</td>
          <td><span class="badge ${statusClass}">${values.status || 'Pending'}</span></td>
          <td>
            <button class="btn btn-secondary btn-icon" style="padding: 6px;" onclick="viewRequisitionRow(this)">👁️</button>
          </td>
        `;
        tableBody.prepend(row);
        showToast('Requisition created.');
      }
    });
  };

  const viewRequisitionRow = (button) => {
    const row = button?.closest('tr');
    if (!row) {
      showToast('Requisition not found.');
      return;
    }
    openReadOnlyModal({
      title: 'Requisition Details',
      fields: [
        { label: 'Req. No.', value: row.cells[0]?.textContent.trim() || '' },
        { label: 'Project', value: row.cells[1]?.textContent.trim() || '' },
        { label: 'Requested By', value: row.cells[2]?.textContent.trim() || '' },
        { label: 'Items', value: row.cells[3]?.textContent.trim() || '' },
        { label: 'Quantity', value: row.cells[4]?.textContent.trim() || '' },
        { label: 'Priority', value: row.cells[5]?.innerText.trim() || '' },
        { label: 'Date', value: row.cells[6]?.textContent.trim() || '' },
        { label: 'Status', value: row.cells[7]?.innerText.trim() || '' }
      ]
    });
  };

  const approveRequisitionRow = (button) => {
    const row = button?.closest('tr');
    if (!row) {
      showToast('Requisition not found.');
      return;
    }
    row.cells[7].innerHTML = '<span class="badge badge-success">Approved</span>';
    showToast('Requisition approved.');
  };

  const createRFQFromRequisitionRow = (button) => {
    const row = button?.closest('tr');
    if (!row) {
      showToast('Requisition not found.');
      return;
    }
    openCreateRFQModal();
  };

  const approvePORow = (button) => {
    const row = button?.closest('tr');
    if (!row) {
      showToast('PO not found.');
      return;
    }
    row.cells[7].innerHTML = '<span class="badge badge-success">Approved</span>';
    showToast('PO approved.');
  };

  const rejectPORow = (button) => {
    const row = button?.closest('tr');
    if (!row) {
      showToast('PO not found.');
      return;
    }
    row.cells[7].innerHTML = '<span class="badge badge-danger">Rejected</span>';
    showToast('PO rejected.');
  };

  const trackPORow = (button) => {
    const row = button?.closest('tr');
    if (!row) {
      showToast('PO not found.');
      return;
    }
    openTrackingModal({
      po: row.cells[0]?.textContent.trim() || 'PO',
      destination: row.cells[2]?.textContent.trim() || '-',
      status: row.cells[7]?.innerText.trim() || 'In Transit',
      progress: 55
    });
  };

  const confirmPODelivery = (button) => {
    const row = button?.closest('tr');
    if (!row) {
      showToast('PO not found.');
      return;
    }
    row.cells[7].innerHTML = '<span class="badge badge-success">Delivered</span>';
    showToast('Delivery confirmed.');
  };

  const trackDeliveryRow = (button) => {
    const row = button?.closest('tr');
    if (!row) {
      showToast('Delivery not found.');
      return;
    }
    openTrackingModal({
      po: row.cells[0]?.textContent.trim() || 'PO',
      destination: row.cells[3]?.textContent.trim() || '-',
      status: row.cells[6]?.innerText.trim() || 'In Transit',
      progress: Number(row.cells[7]?.innerText.replace('%', '').trim()) || 45
    });
  };

  const viewDeliveryRow = (button) => {
    const row = button?.closest('tr');
    if (!row) {
      showToast('Delivery not found.');
      return;
    }
    openReadOnlyModal({
      title: 'Delivery Details',
      fields: [
        { label: 'PO Number', value: row.cells[0]?.textContent.trim() || '' },
        { label: 'Vendor', value: row.cells[1]?.textContent.trim() || '' },
        { label: 'Items', value: row.cells[2]?.textContent.trim() || '' },
        { label: 'Destination', value: row.cells[3]?.textContent.trim() || '' },
        { label: 'Shipped Date', value: row.cells[4]?.textContent.trim() || '' },
        { label: 'Expected Delivery', value: row.cells[5]?.textContent.trim() || '' },
        { label: 'Status', value: row.cells[6]?.innerText.trim() || '' },
        { label: 'Tracking', value: row.cells[7]?.innerText.trim() || '' }
      ]
    });
  };

  const openDeliveryNotesRow = (button) => {
    const row = button?.closest('tr');
    const po = row?.cells[0]?.textContent.trim() || 'PO';
    openNotesModal({
      reference: po,
      owner: 'SCM Manager'
    });
  };

  const followUpDeliveryRow = (button) => {
    openDeliveryNotesRow(button);
  };

  const openNewProjectModal = (prefill = {}) => {
    openModal({
      title: prefill.isEdit ? 'Edit Project' : 'New Project',
      submitLabel: prefill.isEdit ? 'Update Project' : 'Create Project',
      fields: [
        { name: 'projectId', label: 'Project ID', value: prefill.projectId || '', placeholder: 'PRJ-001' },
        { name: 'projectName', label: 'Project Name', value: prefill.projectName || '', placeholder: 'Project name' },
        { name: 'client', label: 'Client', value: prefill.client || '', placeholder: 'Client name' },
        { name: 'location', label: 'Location', value: prefill.location || '', placeholder: 'Location' },
        { name: 'startDate', label: 'Start Date', type: 'date' },
        { name: 'endDate', label: 'End Date', type: 'date' },
        { name: 'budget', label: 'Budget', value: prefill.budget || '', placeholder: '₹0' },
        { name: 'progress', label: 'Progress (%)', value: prefill.progress || '', placeholder: '0' },
        { name: 'status', label: 'Status', type: 'select', options: ['Planning', 'In Progress', 'On Hold', 'Completed'], value: prefill.status || '' }
      ],
      onSubmit: (values) => {
        const tableBody = document.querySelector('#projects table tbody');
        if (!tableBody) {
          showToast('Projects table not found.');
          return;
        }
        const statusClassMap = {
          'planning': 'badge-warning',
          'in progress': 'badge-success',
          'on hold': 'badge-danger',
          'completed': 'badge-success'
        };
        const statusClass = statusClassMap[normalize(values.status)] || 'badge-info';
        const progressValue = Number(values.progress || prefill.progress || 0);

        if (prefill.row) {
          const row = prefill.row;
          row.cells[0].innerHTML = `<strong>${values.projectId || prefill.projectId || 'PRJ-NEW'}</strong>`;
          row.cells[1].innerHTML = `<strong>${values.projectName || prefill.projectName || 'New Project'}</strong>`;
          row.cells[2].textContent = values.client || prefill.client || '';
          row.cells[3].textContent = values.location || prefill.location || '';
          row.cells[4].textContent = values.startDate || row.cells[4].textContent;
          row.cells[5].textContent = values.endDate || row.cells[5].textContent;
          row.cells[6].innerHTML = `<strong>${values.budget || prefill.budget || '₹0'}</strong>`;
          row.cells[7].innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
              <div class="progress-bar" style="width: 80px;">
                <div class="progress-fill success" style="width: ${progressValue}%;"></div>
              </div>
              <span style="font-weight: 600;">${progressValue}%</span>
            </div>
          `;
          row.cells[8].innerHTML = `<span class="badge ${statusClass}">${values.status || prefill.status || 'Planning'}</span>`;
          showToast('Project updated.');
          return;
        }

        const row = document.createElement('tr');
        row.innerHTML = `
          <td><strong>${values.projectId || 'PRJ-NEW'}</strong></td>
          <td><strong>${values.projectName || 'New Project'}</strong></td>
          <td>${values.client || '-'}</td>
          <td>${values.location || '-'}</td>
          <td>${values.startDate || '-'}</td>
          <td>${values.endDate || '-'}</td>
          <td><strong>${values.budget || '₹0'}</strong></td>
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div class="progress-bar" style="width: 80px;">
                <div class="progress-fill success" style="width: ${progressValue}%;"></div>
              </div>
              <span style="font-weight: 600;">${progressValue}%</span>
            </div>
          </td>
          <td><span class="badge ${statusClass}">${values.status || 'Planning'}</span></td>
          <td>
            <button class="btn btn-secondary btn-icon" style="padding: 6px;" onclick="viewProjectRow(this)">👁️</button>
            <button class="btn btn-secondary btn-icon" style="padding: 6px;" onclick="editProjectRow(this)">📝</button>
          </td>
        `;
        tableBody.prepend(row);
        showToast('Project created.');
      }
    });
  };

  const viewProjectRow = (button) => {
    const row = button?.closest('tr');
    if (!row) {
      showToast('Project not found.');
      return;
    }
    openReadOnlyModal({
      title: 'Project Details',
      fields: [
        { label: 'Project ID', value: row.cells[0]?.textContent.trim() || '' },
        { label: 'Project Name', value: row.cells[1]?.textContent.trim() || '' },
        { label: 'Client', value: row.cells[2]?.textContent.trim() || '' },
        { label: 'Location', value: row.cells[3]?.textContent.trim() || '' },
        { label: 'Start Date', value: row.cells[4]?.textContent.trim() || '' },
        { label: 'End Date', value: row.cells[5]?.textContent.trim() || '' },
        { label: 'Budget', value: row.cells[6]?.textContent.trim() || '' },
        { label: 'Progress', value: row.cells[7]?.innerText.trim() || '' },
        { label: 'Status', value: row.cells[8]?.innerText.trim() || '' }
      ]
    });
  };

  const editProjectRow = (button) => {
    const row = button?.closest('tr');
    if (!row) {
      showToast('Project not found.');
      return;
    }
    openNewProjectModal({
      isEdit: true,
      row,
      projectId: row.cells[0]?.textContent.trim() || '',
      projectName: row.cells[1]?.textContent.trim() || '',
      client: row.cells[2]?.textContent.trim() || '',
      location: row.cells[3]?.textContent.trim() || '',
      budget: row.cells[6]?.textContent.trim() || '',
      progress: row.cells[7]?.innerText.replace('%', '').trim() || '',
      status: row.cells[8]?.innerText.trim() || ''
    });
  };

  const openAddClientModal = (prefill = {}) => {
    openModal({
      title: prefill.isEdit ? 'Edit Client' : 'Add Client',
      submitLabel: prefill.isEdit ? 'Update Client' : 'Add Client',
      fields: [
        { name: 'clientId', label: 'Client ID', value: prefill.clientId || '', placeholder: 'CLI-001' },
        { name: 'clientName', label: 'Client Name', value: prefill.clientName || '', placeholder: 'Client name' },
        { name: 'type', label: 'Type', type: 'select', options: ['Corporate', 'Individual', 'Government'], value: prefill.type || '' },
        { name: 'contactPerson', label: 'Contact Person', value: prefill.contactPerson || '', placeholder: 'Contact person' },
        { name: 'phone', label: 'Phone', value: prefill.phone || '', placeholder: 'Phone number' },
        { name: 'email', label: 'Email', value: prefill.email || '', placeholder: 'email@example.com' },
        { name: 'activeProjects', label: 'Active Projects', value: prefill.activeProjects || '', placeholder: '0' },
        { name: 'totalValue', label: 'Total Value', value: prefill.totalValue || '', placeholder: '₹0' },
        { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], value: prefill.status || '' }
      ],
      onSubmit: (values) => {
        const tableBody = document.querySelector('#clients table tbody');
        if (!tableBody) {
          showToast('Clients table not found.');
          return;
        }
        const statusClass = normalize(values.status) === 'inactive' ? 'badge-warning' : 'badge-success';
        const typeClassMap = {
          'corporate': 'badge-info',
          'individual': 'badge-success',
          'government': 'badge-warning'
        };
        const typeClass = typeClassMap[normalize(values.type)] || 'badge-info';
        const initials = (values.clientName || prefill.clientName || 'CL')
          .split(' ')
          .filter(Boolean)
          .map((part) => part[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();

        if (prefill.row) {
          const row = prefill.row;
          row.cells[0].innerHTML = `<strong>${values.clientId || prefill.clientId || 'CLI-NEW'}</strong>`;
          row.cells[1].innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
              <div class="avatar" style="background: #3b82f6; width: 32px; height: 32px; font-size: 12px;">${initials}</div>
              <strong>${values.clientName || prefill.clientName || 'New Client'}</strong>
            </div>
          `;
          row.cells[2].innerHTML = `<span class="badge ${typeClass}">${values.type || prefill.type || 'Corporate'}</span>`;
          row.cells[3].textContent = values.contactPerson || prefill.contactPerson || '';
          row.cells[4].textContent = values.phone || prefill.phone || '';
          row.cells[5].textContent = values.email || prefill.email || '';
          row.cells[6].textContent = values.activeProjects || prefill.activeProjects || '0';
          row.cells[7].innerHTML = `<strong>${values.totalValue || prefill.totalValue || '₹0'}</strong>`;
          row.cells[8].innerHTML = `<span class="badge ${statusClass}">${values.status || prefill.status || 'Active'}</span>`;
          showToast('Client updated.');
          return;
        }

        const row = document.createElement('tr');
        row.innerHTML = `
          <td><strong>${values.clientId || 'CLI-NEW'}</strong></td>
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div class="avatar" style="background: #3b82f6; width: 32px; height: 32px; font-size: 12px;">${initials}</div>
              <strong>${values.clientName || 'New Client'}</strong>
            </div>
          </td>
          <td><span class="badge ${typeClass}">${values.type || 'Corporate'}</span></td>
          <td>${values.contactPerson || ''}</td>
          <td>${values.phone || ''}</td>
          <td>${values.email || ''}</td>
          <td>${values.activeProjects || '0'}</td>
          <td><strong>${values.totalValue || '₹0'}</strong></td>
          <td><span class="badge ${statusClass}">${values.status || 'Active'}</span></td>
          <td>
            <button class="btn btn-secondary btn-icon" style="padding: 6px;" onclick="viewClientRow(this)">👁️</button>
            <button class="btn btn-secondary btn-icon" style="padding: 6px;" onclick="editClientRow(this)">📝</button>
          </td>
        `;
        tableBody.prepend(row);
        showToast('Client added.');
      }
    });
  };

  const viewClientRow = (button) => {
    const row = button?.closest('tr');
    if (!row) {
      showToast('Client not found.');
      return;
    }
    openReadOnlyModal({
      title: 'Client Details',
      fields: [
        { label: 'Client ID', value: row.cells[0]?.textContent.trim() || '' },
        { label: 'Client Name', value: row.cells[1]?.innerText.trim() || '' },
        { label: 'Type', value: row.cells[2]?.innerText.trim() || '' },
        { label: 'Contact Person', value: row.cells[3]?.textContent.trim() || '' },
        { label: 'Phone', value: row.cells[4]?.textContent.trim() || '' },
        { label: 'Email', value: row.cells[5]?.textContent.trim() || '' },
        { label: 'Active Projects', value: row.cells[6]?.textContent.trim() || '' },
        { label: 'Total Value', value: row.cells[7]?.textContent.trim() || '' },
        { label: 'Status', value: row.cells[8]?.innerText.trim() || '' }
      ]
    });
  };

  const editClientRow = (button) => {
    const row = button?.closest('tr');
    if (!row) {
      showToast('Client not found.');
      return;
    }
    openAddClientModal({
      isEdit: true,
      row,
      clientId: row.cells[0]?.textContent.trim() || '',
      clientName: row.cells[1]?.innerText.trim() || '',
      type: row.cells[2]?.innerText.trim() || '',
      contactPerson: row.cells[3]?.textContent.trim() || '',
      phone: row.cells[4]?.textContent.trim() || '',
      email: row.cells[5]?.textContent.trim() || '',
      activeProjects: row.cells[6]?.textContent.trim() || '',
      totalValue: row.cells[7]?.textContent.trim() || '',
      status: row.cells[8]?.innerText.trim() || ''
    });
  };

  const viewSiteDetails = (button) => {
    const card = button?.closest('.card');
    if (!card) {
      showToast('Site not found.');
      return;
    }
    const name = card.querySelector('h3')?.textContent || 'Site';
    const location = card.querySelector('div[style*="color: var(--text-secondary)"]')?.textContent || '';
    openReadOnlyModal({
      title: `${name} Details`,
      fields: [
        { label: 'Location', value: location },
        { label: 'Site Manager', value: card.querySelectorAll('div[style*="font-weight: 500"]')[0]?.textContent || '' },
        { label: 'Workers Today', value: card.querySelectorAll('div[style*="font-weight: 500"]')[1]?.textContent || '' },
        { label: 'Progress', value: card.querySelectorAll('div[style*="font-weight: 500"]')[2]?.textContent || '' },
        { label: 'Last Updated', value: card.querySelectorAll('div[style*="font-weight: 500"]')[3]?.textContent || '' }
      ]
    });
  };

  const openSiteDailyReport = (button) => {
    const card = button?.closest('.card');
    const name = card?.querySelector('h3')?.textContent || 'Site';
    openNotesModal({
      reference: `${name} Daily Report`,
      owner: 'Project Manager'
    });
  };

  const openAddWorkerModal = (prefill = {}) => {
    openModal({
      title: prefill.isEdit ? 'Edit Worker' : 'Add Worker',
      submitLabel: prefill.isEdit ? 'Update Worker' : 'Add Worker',
      fields: [
        { name: 'workerId', label: 'Worker ID', value: prefill.workerId || '', placeholder: 'WKR-001' },
        { name: 'name', label: 'Name', value: prefill.name || '', placeholder: 'Worker name' },
        { name: 'category', label: 'Category', type: 'select', options: ['Mason', 'Carpenter', 'Electrician', 'Plumber'], value: prefill.category || '' },
        { name: 'site', label: 'Site', value: prefill.site || '', placeholder: 'Site name' },
        { name: 'phone', label: 'Phone', value: prefill.phone || '', placeholder: 'Phone number' },
        { name: 'dailyRate', label: 'Daily Rate', value: prefill.dailyRate || '', placeholder: '₹0' },
        { name: 'attendance', label: 'Attendance %', value: prefill.attendance || '', placeholder: '0' },
        { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], value: prefill.status || '' }
      ],
      onSubmit: (values) => {
        const tableBody = document.querySelector('#labour table tbody');
        if (!tableBody) {
          showToast('Labour table not found.');
          return;
        }
        const statusClass = normalize(values.status) === 'inactive' ? 'badge-warning' : 'badge-success';
        const categoryClassMap = {
          'mason': 'badge-info',
          'carpenter': 'badge-info',
          'electrician': 'badge-warning',
          'plumber': 'badge-warning'
        };
        const categoryClass = categoryClassMap[normalize(values.category)] || 'badge-info';

        if (prefill.row) {
          const row = prefill.row;
          row.cells[0].innerHTML = `<strong>${values.workerId || prefill.workerId || 'WKR-NEW'}</strong>`;
          row.cells[1].textContent = values.name || prefill.name || '';
          row.cells[2].innerHTML = `<span class="badge ${categoryClass}">${values.category || prefill.category || 'Mason'}</span>`;
          row.cells[3].textContent = values.site || prefill.site || '';
          row.cells[4].textContent = values.phone || prefill.phone || '';
          row.cells[5].textContent = values.dailyRate || prefill.dailyRate || '';
          row.cells[6].textContent = values.attendance || prefill.attendance || '';
          row.cells[7].innerHTML = `<span class="badge ${statusClass}">${values.status || prefill.status || 'Active'}</span>`;
          showToast('Worker updated.');
          return;
        }

        const row = document.createElement('tr');
        row.innerHTML = `
          <td><strong>${values.workerId || 'WKR-NEW'}</strong></td>
          <td>${values.name || 'New Worker'}</td>
          <td><span class="badge ${categoryClass}">${values.category || 'Mason'}</span></td>
          <td>${values.site || '-'}</td>
          <td>${values.phone || '-'}</td>
          <td>${values.dailyRate || '₹0'}</td>
          <td>${values.attendance || '0'}%</td>
          <td><span class="badge ${statusClass}">${values.status || 'Active'}</span></td>
          <td>
            <button class="btn btn-secondary btn-icon" style="padding: 6px;" onclick="viewWorkerRow(this)">👁️</button>
            <button class="btn btn-secondary btn-icon" style="padding: 6px;" onclick="editWorkerRow(this)">📝</button>
          </td>
        `;
        tableBody.prepend(row);
        showToast('Worker added.');
      }
    });
  };

  const viewWorkerRow = (button) => {
    const row = button?.closest('tr');
    if (!row) {
      showToast('Worker not found.');
      return;
    }
    openReadOnlyModal({
      title: 'Worker Details',
      fields: [
        { label: 'Worker ID', value: row.cells[0]?.textContent.trim() || '' },
        { label: 'Name', value: row.cells[1]?.textContent.trim() || '' },
        { label: 'Category', value: row.cells[2]?.innerText.trim() || '' },
        { label: 'Site', value: row.cells[3]?.textContent.trim() || '' },
        { label: 'Phone', value: row.cells[4]?.textContent.trim() || '' },
        { label: 'Daily Rate', value: row.cells[5]?.textContent.trim() || '' },
        { label: 'Attendance', value: row.cells[6]?.textContent.trim() || '' },
        { label: 'Status', value: row.cells[7]?.innerText.trim() || '' }
      ]
    });
  };

  const editWorkerRow = (button) => {
    const row = button?.closest('tr');
    if (!row) {
      showToast('Worker not found.');
      return;
    }
    openAddWorkerModal({
      isEdit: true,
      row,
      workerId: row.cells[0]?.textContent.trim() || '',
      name: row.cells[1]?.textContent.trim() || '',
      category: row.cells[2]?.innerText.trim() || '',
      site: row.cells[3]?.textContent.trim() || '',
      phone: row.cells[4]?.textContent.trim() || '',
      dailyRate: row.cells[5]?.textContent.trim() || '',
      attendance: row.cells[6]?.textContent.trim() || '',
      status: row.cells[7]?.innerText.trim() || ''
    });
  };

  const openAddEquipmentModal = (prefill = {}) => {
    openModal({
      title: prefill.isEdit ? 'Edit Equipment' : 'Add Equipment',
      submitLabel: prefill.isEdit ? 'Update Equipment' : 'Add Equipment',
      fields: [
        { name: 'equipmentId', label: 'Equipment ID', value: prefill.equipmentId || '', placeholder: 'EQP-001' },
        { name: 'name', label: 'Name', value: prefill.name || '', placeholder: 'Equipment name' },
        { name: 'type', label: 'Type', value: prefill.type || '', placeholder: 'Type' },
        { name: 'model', label: 'Model', value: prefill.model || '', placeholder: 'Model' },
        { name: 'location', label: 'Location', value: prefill.location || '', placeholder: 'Location' },
        { name: 'status', label: 'Status', type: 'select', options: ['In Use', 'Maintenance', 'Idle'], value: prefill.status || '' },
        { name: 'lastMaintenance', label: 'Last Maintenance', type: 'date' }
      ],
      onSubmit: (values) => {
        const tableBody = document.querySelector('#equipment table tbody');
        if (!tableBody) {
          showToast('Equipment table not found.');
          return;
        }
        const statusClassMap = {
          'in use': 'badge-success',
          'maintenance': 'badge-warning',
          'idle': 'badge-secondary'
        };
        const statusClass = statusClassMap[normalize(values.status)] || 'badge-info';
        const typeClassMap = {
          'heavy machinery': 'badge-info',
          'power equipment': 'badge-secondary'
        };
        const typeClass = typeClassMap[normalize(values.type)] || 'badge-info';

        if (prefill.row) {
          const row = prefill.row;
          row.cells[0].innerHTML = `<strong>${values.equipmentId || prefill.equipmentId || 'EQP-NEW'}</strong>`;
          row.cells[1].textContent = values.name || prefill.name || '';
          row.cells[2].innerHTML = `<span class="badge ${typeClass}">${values.type || prefill.type || 'Equipment'}</span>`;
          row.cells[3].textContent = values.model || prefill.model || '';
          row.cells[4].textContent = values.location || prefill.location || '';
          row.cells[5].innerHTML = `<span class="badge ${statusClass}">${values.status || prefill.status || 'In Use'}</span>`;
          row.cells[6].textContent = values.lastMaintenance || row.cells[6].textContent;
          showToast('Equipment updated.');
          return;
        }

        const row = document.createElement('tr');
        row.innerHTML = `
          <td><strong>${values.equipmentId || 'EQP-NEW'}</strong></td>
          <td>${values.name || 'New Equipment'}</td>
          <td><span class="badge ${typeClass}">${values.type || 'Equipment'}</span></td>
          <td>${values.model || '-'}</td>
          <td>${values.location || '-'}</td>
          <td><span class="badge ${statusClass}">${values.status || 'In Use'}</span></td>
          <td>${values.lastMaintenance || '-'}</td>
          <td>
            <button class="btn btn-secondary btn-icon" style="padding: 6px;" onclick="viewEquipmentRow(this)">👁️</button>
            <button class="btn btn-secondary btn-icon" style="padding: 6px;" onclick="editEquipmentRow(this)">📝</button>
          </td>
        `;
        tableBody.prepend(row);
        showToast('Equipment added.');
      }
    });
  };

  const viewEquipmentRow = (button) => {
    const row = button?.closest('tr');
    if (!row) {
      showToast('Equipment not found.');
      return;
    }
    openReadOnlyModal({
      title: 'Equipment Details',
      fields: [
        { label: 'Equipment ID', value: row.cells[0]?.textContent.trim() || '' },
        { label: 'Name', value: row.cells[1]?.textContent.trim() || '' },
        { label: 'Type', value: row.cells[2]?.innerText.trim() || '' },
        { label: 'Model', value: row.cells[3]?.textContent.trim() || '' },
        { label: 'Location', value: row.cells[4]?.textContent.trim() || '' },
        { label: 'Status', value: row.cells[5]?.innerText.trim() || '' },
        { label: 'Last Maintenance', value: row.cells[6]?.textContent.trim() || '' }
      ]
    });
  };

  const editEquipmentRow = (button) => {
    const row = button?.closest('tr');
    if (!row) {
      showToast('Equipment not found.');
      return;
    }
    openAddEquipmentModal({
      isEdit: true,
      row,
      equipmentId: row.cells[0]?.textContent.trim() || '',
      name: row.cells[1]?.textContent.trim() || '',
      type: row.cells[2]?.innerText.trim() || '',
      model: row.cells[3]?.textContent.trim() || '',
      location: row.cells[4]?.textContent.trim() || '',
      status: row.cells[5]?.innerText.trim() || ''
    });
  };

  const scheduleEquipmentMaintenance = (button) => {
    const row = button?.closest('tr');
    const equipment = row?.cells[1]?.textContent.trim() || 'Equipment';
    openModal({
      title: 'Schedule Maintenance',
      submitLabel: 'Schedule',
      fields: [
        { name: 'equipment', label: 'Equipment', value: equipment },
        { name: 'date', label: 'Maintenance Date', type: 'date' },
        { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Maintenance notes' }
      ],
      onSubmit: () => {
        showToast('Maintenance scheduled.');
      }
    });
  };

  const openNewInspectionModal = () => {
    openModal({
      title: 'New Inspection',
      submitLabel: 'Create Inspection',
      fields: [
        { name: 'inspectionId', label: 'Inspection ID', placeholder: 'INS-2026-XXXX' },
        { name: 'type', label: 'Type', placeholder: 'Inspection type' },
        { name: 'project', label: 'Project', placeholder: 'Project name' },
        { name: 'date', label: 'Date', type: 'date' },
        { name: 'inspector', label: 'Inspector', placeholder: 'Inspector name' },
        { name: 'status', label: 'Status', type: 'select', options: ['In Progress', 'Completed'] }
      ],
      onSubmit: (values) => {
        const tableBody = document.querySelector('#qualityControl table tbody');
        if (!tableBody) {
          showToast('Inspection table not found.');
          return;
        }
        const statusClass = normalize(values.status) === 'completed' ? 'badge-success' : 'badge-warning';
        const row = document.createElement('tr');
        row.innerHTML = `
          <td><strong>${values.inspectionId || 'INS-NEW'}</strong></td>
          <td>${values.type || '-'}</td>
          <td>${values.project || '-'}</td>
          <td>${values.date || '-'}</td>
          <td>${values.inspector || '-'}</td>
          <td>-</td>
          <td>-</td>
          <td><span class="badge ${statusClass}">${values.status || 'In Progress'}</span></td>
          <td>
            <button class="btn btn-secondary btn-icon" style="padding: 6px;" onclick="viewInspectionRow(this)">👁️</button>
          </td>
        `;
        tableBody.prepend(row);
        showToast('Inspection created.');
      }
    });
  };

  const viewInspectionRow = (button) => {
    const row = button?.closest('tr');
    if (!row) {
      showToast('Inspection not found.');
      return;
    }
    openReadOnlyModal({
      title: 'Inspection Details',
      fields: [
        { label: 'Inspection ID', value: row.cells[0]?.textContent.trim() || '' },
        { label: 'Type', value: row.cells[1]?.textContent.trim() || '' },
        { label: 'Project', value: row.cells[2]?.textContent.trim() || '' },
        { label: 'Date', value: row.cells[3]?.textContent.trim() || '' },
        { label: 'Inspector', value: row.cells[4]?.textContent.trim() || '' },
        { label: 'Result', value: row.cells[5]?.innerText.trim() || '' },
        { label: 'Score', value: row.cells[6]?.textContent.trim() || '' },
        { label: 'Status', value: row.cells[7]?.innerText.trim() || '' }
      ]
    });
  };

  const continueInspection = (button) => {
    const row = button?.closest('tr');
    const inspection = row?.cells[0]?.textContent.trim() || 'Inspection';
    openNotesModal({
      reference: `${inspection} Checklist`,
      owner: 'Quality Team'
    });
  };

  const openInspectionReport = (button) => {
    const row = button?.closest('tr');
    const inspection = row?.cells[0]?.textContent.trim() || 'Inspection';
    openReadOnlyModal({
      title: 'Inspection Report',
      fields: [
        { label: 'Inspection', value: inspection },
        { label: 'Summary', value: 'Report generated successfully.' }
      ]
    });
  };

  const actionRequiredInspection = (button) => {
    const row = button?.closest('tr');
    const inspection = row?.cells[0]?.textContent.trim() || 'Inspection';
    openNotesModal({
      reference: `${inspection} Action Required`,
      owner: 'Quality Lead'
    });
  };

  const openCreateInvoiceModal = () => {
    openModal({
      title: 'Create Invoice',
      submitLabel: 'Create Invoice',
      fields: [
        { name: 'invoiceNo', label: 'Invoice No.', placeholder: 'INV-2026-XXXX' },
        { name: 'client', label: 'Client', placeholder: 'Client name' },
        { name: 'project', label: 'Project', placeholder: 'Project name' },
        { name: 'issueDate', label: 'Issue Date', type: 'date' },
        { name: 'dueDate', label: 'Due Date', type: 'date' },
        { name: 'amount', label: 'Amount', placeholder: '₹0' },
        { name: 'tax', label: 'Tax', placeholder: '₹0 (5%)' },
        { name: 'total', label: 'Total', placeholder: '₹0' },
        { name: 'status', label: 'Status', type: 'select', options: ['Draft', 'Sent', 'Paid', 'Overdue', 'Pending'] }
      ],
      onSubmit: (values) => {
        const tableBody = document.querySelector('#invoices table tbody');
        if (!tableBody) {
          showToast('Invoices table not found.');
          return;
        }
        const statusClassMap = {
          'draft': 'badge-info',
          'sent': 'badge-info',
          'paid': 'badge-success',
          'overdue': 'badge-danger',
          'pending': 'badge-warning'
        };
        const statusClass = statusClassMap[normalize(values.status)] || 'badge-info';
        const row = document.createElement('tr');
        row.innerHTML = `
          <td><strong>${values.invoiceNo || 'INV-NEW'}</strong></td>
          <td>${values.client || '-'}</td>
          <td>${values.project || '-'}</td>
          <td>${values.issueDate || '-'}</td>
          <td>${values.dueDate || '-'}</td>
          <td>${values.amount || '₹0'}</td>
          <td>${values.tax || '-'}</td>
          <td><strong>${values.total || '₹0'}</strong></td>
          <td><span class="badge ${statusClass}">${values.status || 'Draft'}</span></td>
          <td>
            <button class="btn btn-secondary btn-icon" style="padding: 6px;" onclick="viewInvoiceRow(this)">👁️</button>
            <button class="btn btn-secondary btn-icon" style="padding: 6px;" onclick="emailInvoiceRow(this)">📧</button>
            <button class="btn btn-secondary btn-icon" style="padding: 6px;" onclick="downloadInvoiceRow(this)">📄</button>
          </td>
        `;
        tableBody.prepend(row);
        showToast('Invoice created.');
      }
    });
  };

  const viewInvoiceRow = (button) => {
    const row = button?.closest('tr');
    if (!row) {
      showToast('Invoice not found.');
      return;
    }
    openReadOnlyModal({
      title: 'Invoice Details',
      fields: [
        { label: 'Invoice No.', value: row.cells[0]?.textContent.trim() || '' },
        { label: 'Client', value: row.cells[1]?.textContent.trim() || '' },
        { label: 'Project', value: row.cells[2]?.textContent.trim() || '' },
        { label: 'Issue Date', value: row.cells[3]?.textContent.trim() || '' },
        { label: 'Due Date', value: row.cells[4]?.textContent.trim() || '' },
        { label: 'Amount', value: row.cells[5]?.textContent.trim() || '' },
        { label: 'Tax', value: row.cells[6]?.textContent.trim() || '' },
        { label: 'Total', value: row.cells[7]?.textContent.trim() || '' },
        { label: 'Status', value: row.cells[8]?.innerText.trim() || '' }
      ]
    });
  };

  const emailInvoiceRow = () => {
    showToast('Invoice emailed.');
  };

  const downloadInvoiceRow = () => {
    showToast('Invoice downloaded.');
  };

  const remindInvoiceRow = (button) => {
    const row = button?.closest('tr');
    const invoice = row?.cells[0]?.textContent.trim() || 'Invoice';
    openNotesModal({
      reference: `${invoice} Reminder`,
      owner: 'Finance Team'
    });
  };

  const openNewReceivableInvoice = () => {
    openCreateInvoiceModal();
  };

  const viewReceivableRow = (button) => {
    viewInvoiceRow(button);
  };

  const downloadReceivableRow = (button) => {
    downloadInvoiceRow(button);
  };

  const followUpReceivableRow = (button) => {
    const row = button?.closest('tr');
    const invoice = row?.cells[0]?.textContent.trim() || 'Invoice';
    openNotesModal({
      reference: `${invoice} Follow Up`,
      owner: 'Finance Team'
    });
  };

  const openRecordPayableModal = () => {
    openModal({
      title: 'Record Payable',
      submitLabel: 'Record',
      fields: [
        { name: 'billNo', label: 'Bill No.', placeholder: 'BILL-2026-XXXX' },
        { name: 'vendor', label: 'Vendor', placeholder: 'Vendor name' },
        { name: 'description', label: 'Description', placeholder: 'Description' },
        { name: 'billDate', label: 'Bill Date', type: 'date' },
        { name: 'dueDate', label: 'Due Date', type: 'date' },
        { name: 'amount', label: 'Amount', placeholder: '₹0' },
        { name: 'status', label: 'Status', type: 'select', options: ['Overdue', 'Pending', 'Paid', 'Received'] },
        { name: 'terms', label: 'Payment Terms', placeholder: '30 days' }
      ],
      onSubmit: (values) => {
        const tableBody = document.querySelector('#payables table tbody');
        if (!tableBody) {
          showToast('Payables table not found.');
          return;
        }
        const statusClassMap = {
          'overdue': 'badge-danger',
          'pending': 'badge-warning',
          'paid': 'badge-success',
          'received': 'badge-info'
        };
        const statusClass = statusClassMap[normalize(values.status)] || 'badge-info';
        const row = document.createElement('tr');
        row.innerHTML = `
          <td><strong>${values.billNo || 'BILL-NEW'}</strong></td>
          <td>${values.vendor || '-'}</td>
          <td>${values.description || '-'}</td>
          <td>${values.billDate || '-'}</td>
          <td>${values.dueDate || '-'}</td>
          <td><strong>${values.amount || '₹0'}</strong></td>
          <td><span class="badge ${statusClass}">${values.status || 'Pending'}</span></td>
          <td>${values.terms || '-'}</td>
          <td>
            <button class="btn btn-secondary btn-icon" style="padding: 6px;" onclick="viewPayableRow(this)">👁️</button>
            <button class="btn btn-primary" style="padding: 6px 12px; font-size: 12px;" onclick="schedulePayableRow(this)">Schedule</button>
          </td>
        `;
        tableBody.prepend(row);
        showToast('Payable recorded.');
      }
    });
  };

  const viewPayableRow = (button) => {
    const row = button?.closest('tr');
    if (!row) {
      showToast('Payable not found.');
      return;
    }
    openReadOnlyModal({
      title: 'Payable Details',
      fields: [
        { label: 'Bill No.', value: row.cells[0]?.textContent.trim() || '' },
        { label: 'Vendor', value: row.cells[1]?.textContent.trim() || '' },
        { label: 'Description', value: row.cells[2]?.textContent.trim() || '' },
        { label: 'Bill Date', value: row.cells[3]?.textContent.trim() || '' },
        { label: 'Due Date', value: row.cells[4]?.textContent.trim() || '' },
        { label: 'Amount', value: row.cells[5]?.textContent.trim() || '' },
        { label: 'Status', value: row.cells[6]?.innerText.trim() || '' },
        { label: 'Terms', value: row.cells[7]?.textContent.trim() || '' }
      ]
    });
  };

  const downloadPayableRow = () => {
    showToast('Bill document downloaded.');
  };

  const schedulePayableRow = (button) => {
    const row = button?.closest('tr');
    const bill = row?.cells[0]?.textContent.trim() || 'Bill';
    openModal({
      title: 'Schedule Payment',
      submitLabel: 'Schedule',
      fields: [
        { name: 'bill', label: 'Bill', value: bill },
        { name: 'date', label: 'Payment Date', type: 'date' },
        { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Optional notes' }
      ],
      onSubmit: () => {
        showToast('Payment scheduled.');
      }
    });
  };

  const payNowPayableRow = (button) => {
    const row = button?.closest('tr');
    if (!row) {
      showToast('Payable not found.');
      return;
    }
    row.cells[6].innerHTML = '<span class="badge badge-success">Paid</span>';
    showToast('Payment completed.');
  };

  const openRecordPaymentModal = () => {
    openModal({
      title: 'Record Payment',
      submitLabel: 'Record Payment',
      fields: [
        { name: 'date', label: 'Date', type: 'date' },
        { name: 'paymentId', label: 'Payment ID', placeholder: 'PAY-XXXX' },
        { name: 'type', label: 'Type', type: 'select', options: ['Received', 'Made'] },
        { name: 'party', label: 'Party', placeholder: 'Client/Vendor' },
        { name: 'reference', label: 'Reference', placeholder: 'INV/BILL' },
        { name: 'method', label: 'Method', type: 'select', options: ['Bank Transfer', 'Check', 'Cash', 'Online'] },
        { name: 'amount', label: 'Amount', placeholder: '₹0' },
        { name: 'status', label: 'Status', type: 'select', options: ['Cleared', 'Pending'] }
      ],
      onSubmit: (values) => {
        const tableBody = document.querySelector('#payments table tbody');
        if (!tableBody) {
          showToast('Payments table not found.');
          return;
        }
        const typeClass = normalize(values.type) === 'made' ? 'badge-danger' : 'badge-success';
        const statusClass = normalize(values.status) === 'pending' ? 'badge-warning' : 'badge-success';
        const amountPrefix = normalize(values.type) === 'made' ? '-' : '+';
        const amountColor = normalize(values.type) === 'made' ? 'var(--danger-color)' : 'var(--success-color)';
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${values.date || '-'}</td>
          <td><strong>${values.paymentId || 'PAY-NEW'}</strong></td>
          <td><span class="badge ${typeClass}">${values.type || 'Received'}</span></td>
          <td>${values.party || '-'}</td>
          <td>${values.reference || '-'}</td>
          <td>${values.method || '-'}</td>
          <td style="color: ${amountColor}; font-weight: 600;">${amountPrefix} ${values.amount || '₹0'}</td>
          <td><span class="badge ${statusClass}">${values.status || 'Cleared'}</span></td>
          <td>
            <button class="btn btn-secondary btn-icon" style="padding: 6px;" onclick="viewPaymentRow(this)">👁️</button>
            <button class="btn btn-secondary btn-icon" style="padding: 6px;" onclick="downloadPaymentRow(this)">📄</button>
          </td>
        `;
        tableBody.prepend(row);
        showToast('Payment recorded.');
      }
    });
  };

  const viewPaymentRow = (button) => {
    const row = button?.closest('tr');
    if (!row) {
      showToast('Payment not found.');
      return;
    }
    openReadOnlyModal({
      title: 'Payment Details',
      fields: [
        { label: 'Date', value: row.cells[0]?.textContent.trim() || '' },
        { label: 'Payment ID', value: row.cells[1]?.textContent.trim() || '' },
        { label: 'Type', value: row.cells[2]?.innerText.trim() || '' },
        { label: 'Party', value: row.cells[3]?.textContent.trim() || '' },
        { label: 'Reference', value: row.cells[4]?.textContent.trim() || '' },
        { label: 'Method', value: row.cells[5]?.textContent.trim() || '' },
        { label: 'Amount', value: row.cells[6]?.textContent.trim() || '' },
        { label: 'Status', value: row.cells[7]?.innerText.trim() || '' }
      ]
    });
  };

  const downloadPaymentRow = () => {
    showToast('Payment receipt downloaded.');
  };

  const viewBudgetRow = (row) => {
    if (!row) {
      showToast('Budget row not found.');
      return;
    }
    openReadOnlyModal({
      title: 'Budget Details',
      fields: [
        { label: 'Project', value: row.cells[0]?.textContent.trim() || '' },
        { label: 'Category', value: row.cells[1]?.textContent.trim() || '' },
        { label: 'Budgeted Amount', value: row.cells[2]?.textContent.trim() || '' },
        { label: 'Spent to Date', value: row.cells[3]?.textContent.trim() || '' },
        { label: 'Remaining', value: row.cells[4]?.textContent.trim() || '' },
        { label: '% Used', value: row.cells[5]?.innerText.trim() || '' },
        { label: 'Variance', value: row.cells[6]?.innerText.trim() || '' },
        { label: 'Status', value: row.cells[7]?.innerText.trim() || '' }
      ]
    });
  };

  const openAddBankAccountModal = () => {
    openModal({
      title: 'Add Bank Account',
      submitLabel: 'Add Account',
      fields: [
        { name: 'bankName', label: 'Bank Name', placeholder: 'Bank name' },
        { name: 'accountType', label: 'Account Type', placeholder: 'Current/Savings' },
        { name: 'accountNumber', label: 'Account Number', placeholder: 'XXXX XXXX 1234' },
        { name: 'branch', label: 'Branch', placeholder: 'Branch' },
        { name: 'balance', label: 'Current Balance', placeholder: '₹0' },
        { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
      ],
      onSubmit: (values) => {
        const grid = document.querySelector('#bankAccounts .grid.grid-3');
        if (!grid) {
          showToast('Bank accounts grid not found.');
          return;
        }
        const card = document.createElement('div');
        card.className = 'card';
        card.style.margin = '0';
        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
            <h4>${values.bankName || 'Bank'} - ${values.accountType || 'Account'}</h4>
            <span class="badge badge-success">${values.status || 'Active'}</span>
          </div>
          <div style="margin-bottom: 12px;">
            <div style="font-size: 13px; color: var(--text-secondary);">Account Number</div>
            <div style="font-weight: 500;">${values.accountNumber || 'XXXX XXXX'}</div>
          </div>
          <div style="margin-bottom: 12px;">
            <div style="font-size: 13px; color: var(--text-secondary);">Branch</div>
            <div style="font-weight: 500;">${values.branch || '-'}</div>
          </div>
          <div style="margin-bottom: 16px;">
            <div style="font-size: 13px; color: var(--text-secondary);">Current Balance</div>
            <div style="font-size: 24px; font-weight: 700; color: var(--success-color);">${values.balance || '₹0'}</div>
          </div>
          <button class="btn btn-secondary" style="width: 100%;" onclick="viewBankTransactions(this)">View Transactions</button>
        `;
        grid.appendChild(card);
        showToast('Bank account added.');
      }
    });
  };

  const viewBankTransactions = (button) => {
    const card = button?.closest('.card');
    const name = card?.querySelector('h4')?.textContent || 'Bank Account';
    openReadOnlyModal({
      title: 'Bank Account Transactions',
      fields: [
        { label: 'Account', value: name },
        { label: 'Status', value: 'Latest transactions loaded.' }
      ]
    });
  };

  const viewVendorRow = (button) => {
    const row = button?.closest('tr');
    if (!row) {
      showToast('Vendor not found.');
      return;
    }
    openReadOnlyModal({
      title: 'Vendor Details',
      fields: [
        { label: 'Vendor ID', value: row.cells[0]?.textContent.trim() || '' },
        { label: 'Vendor Name', value: row.cells[1]?.innerText.trim() || '' },
        { label: 'Category', value: row.cells[2]?.innerText.trim() || '' },
        { label: 'Contact Person', value: row.cells[3]?.textContent.trim() || '' },
        { label: 'Phone', value: row.cells[4]?.textContent.trim() || '' },
        { label: 'Email', value: row.cells[5]?.textContent.trim() || '' },
        { label: 'Rating', value: row.cells[6]?.innerText.trim() || '' },
        { label: 'Total Orders', value: row.cells[7]?.textContent.trim() || '' },
        { label: 'Status', value: row.cells[8]?.innerText.trim() || '' }
      ]
    });
  };

  const editVendorRow = (button) => {
    const row = button?.closest('tr');
    if (!row) {
      showToast('Vendor not found.');
      return;
    }
    openAddVendorModal({
      isEdit: true,
      row,
      vendorId: row.cells[0]?.textContent.trim() || '',
      vendorName: row.cells[1]?.innerText.trim() || '',
      category: row.cells[2]?.innerText.trim() || '',
      contactPerson: row.cells[3]?.textContent.trim() || '',
      phone: row.cells[4]?.textContent.trim() || '',
      email: row.cells[5]?.textContent.trim() || '',
      rating: row.cells[6]?.innerText.trim() || '',
      totalOrders: row.cells[7]?.textContent.trim() || '',
      status: row.cells[8]?.innerText.trim() || ''
    });
  };

  const viewItemRow = (button) => {
    const row = button?.closest('tr');
    if (!row) {
      showToast('Item not found.');
      return;
    }
    openReadOnlyModal({
      title: 'Item Details',
      fields: [
        { label: 'Item Code', value: row.cells[0]?.textContent.trim() || '' },
        { label: 'Item Name', value: row.cells[1]?.textContent.trim() || '' },
        { label: 'Category', value: row.cells[2]?.innerText.trim() || '' },
        { label: 'Warehouse', value: row.cells[3]?.textContent.trim() || '' },
        { label: 'Current Stock', value: row.cells[4]?.textContent.trim() || '' },
        { label: 'Unit', value: row.cells[5]?.textContent.trim() || '' },
        { label: 'Min Level', value: row.cells[6]?.textContent.trim() || '' },
        { label: 'Unit Price', value: row.cells[7]?.textContent.trim() || '' },
        { label: 'Stock Value', value: row.cells[8]?.textContent.trim() || '' },
        { label: 'Status', value: row.cells[9]?.innerText.trim() || '' }
      ]
    });
  };

  const editItemRow = (button) => {
    const row = button?.closest('tr');
    if (!row) {
      showToast('Item not found.');
      return;
    }
    openAddItemModal({
      isEdit: true,
      row,
      itemCode: row.cells[0]?.textContent.trim() || '',
      itemName: row.cells[1]?.textContent.trim() || '',
      category: row.cells[2]?.innerText.trim() || '',
      warehouse: row.cells[3]?.textContent.trim() || '',
      currentStock: row.cells[4]?.textContent.trim() || '',
      unit: row.cells[5]?.textContent.trim() || '',
      minLevel: row.cells[6]?.textContent.trim() || '',
      unitPrice: row.cells[7]?.textContent.trim() || '',
      status: row.cells[9]?.innerText.trim() || ''
    });
  };

  const openReorderModal = (button, actionLabel) => {
    const row = button?.closest('tr');
    const itemName = row?.cells[1]?.textContent || row?.cells[0]?.textContent || 'Item';
    openModal({
      title: actionLabel,
      submitLabel: 'Submit',
      fields: [
        { name: 'item', label: 'Item', value: itemName },
        { name: 'quantity', label: 'Quantity', placeholder: 'Enter quantity' },
        { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Optional notes' }
      ],
      onSubmit: () => {
        showToast(`${actionLabel} submitted.`);
      }
    });
  };

  const openAddWarehouseModal = () => {
    openModal({
      title: 'Add Warehouse',
      submitLabel: 'Add Warehouse',
      fields: [
        { name: 'name', label: 'Warehouse Name', placeholder: 'Warehouse name' },
        { name: 'location', label: 'Location', placeholder: 'City / Site' },
        { name: 'totalItems', label: 'Total Items', placeholder: '0' },
        { name: 'stockValue', label: 'Stock Value', placeholder: '₹0' },
        { name: 'capacity', label: 'Capacity Utilization', placeholder: 'e.g., 70%' }
      ],
      onSubmit: (values) => {
        const grid = document.querySelector('#warehouses .grid.grid-3');
        if (!grid) {
          showToast('Warehouse list not found.');
          return;
        }
        const card = document.createElement('div');
        card.className = 'card';
        card.style.margin = '0';
        card.innerHTML = `
          <h4 style="margin-bottom: 16px;">${values.name || 'New Warehouse'}</h4>
          <div style="margin-bottom: 12px;">
            <div style="font-size: 13px; color: var(--text-secondary);">Location</div>
            <div style="font-weight: 500;">${values.location || 'Location'}</div>
          </div>
          <div style="margin-bottom: 12px;">
            <div style="font-size: 13px; color: var(--text-secondary);">Total Items</div>
            <div style="font-weight: 500; font-size: 20px;">${values.totalItems || '0'}</div>
          </div>
          <div style="margin-bottom: 12px;">
            <div style="font-size: 13px; color: var(--text-secondary);">Stock Value</div>
            <div style="font-weight: 500; font-size: 20px; color: var(--success-color);">${values.stockValue || '₹0'}</div>
          </div>
          <div style="margin-bottom: 16px;">
            <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 4px;">Capacity Utilization</div>
            <div class="progress-bar">
              <div class="progress-fill success" style="width: ${values.capacity || '0%'};"></div>
            </div>
            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">${values.capacity || '0%'} Used</div>
          </div>
          <button class="btn btn-secondary" style="width: 100%;" onclick="viewWarehouseDetails(this)">View Details</button>
        `;
        grid.appendChild(card);
        showToast('Warehouse added successfully.');
      }
    });
  };

  const viewWarehouseDetails = (button) => {
    const card = button?.closest('.card');
    const name = card?.querySelector('h4')?.textContent || 'Warehouse';
    const location = card?.querySelector('div > div:nth-child(2)')?.textContent || '';
    const totalItems = card?.querySelector('div:nth-of-type(2) div:last-child')?.textContent || '';
    const stockValue = card?.querySelector('div:nth-of-type(3) div:last-child')?.textContent || '';
    const capacity = card?.querySelector('div:nth-of-type(4) div:last-child')?.textContent || '';
    openReadOnlyModal({
      title: `${name} Details`,
      fields: [
        { label: 'Location', value: location },
        { label: 'Total Items', value: totalItems },
        { label: 'Stock Value', value: stockValue },
        { label: 'Capacity Utilization', value: capacity }
      ]
    });
  };

  const openRecordMovementModal = () => {
    openModal({
      title: 'Record Movement',
      submitLabel: 'Record',
      fields: [
        { name: 'date', label: 'Date', type: 'date' },
        { name: 'transactionId', label: 'Transaction ID', placeholder: 'TXN-2026-XXXX' },
        { name: 'type', label: 'Type', type: 'select', options: ['Stock In', 'Stock Out', 'Transfer'] },
        { name: 'item', label: 'Item', placeholder: 'Item name' },
        { name: 'quantity', label: 'Quantity', placeholder: 'e.g., 100 Bags' },
        { name: 'fromTo', label: 'From/To', placeholder: 'From: Supplier / To: Site' },
        { name: 'reference', label: 'Reference', placeholder: 'PO / REQ / TRANS' },
        { name: 'recordedBy', label: 'Recorded By', placeholder: 'Name' }
      ],
      onSubmit: (values) => {
        const tableBody = document.querySelector('#stockMovement table tbody');
        if (!tableBody) {
          showToast('Movement table not found.');
          return;
        }
        const typeClassMap = {
          'stock in': 'badge-success',
          'stock out': 'badge-danger',
          'transfer': 'badge-info'
        };
        const typeClass = typeClassMap[normalize(values.type)] || 'badge-info';
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${values.date || 'Today'}</td>
          <td><strong>${values.transactionId || 'TXN-NEW'}</strong></td>
          <td><span class="badge ${typeClass}">${values.type || 'Stock In'}</span></td>
          <td>${values.item || 'Item'}</td>
          <td>${values.quantity || '0'}</td>
          <td>${values.fromTo || '-'}</td>
          <td>${values.reference || '-'}</td>
          <td>${values.recordedBy || 'User'}</td>
          <td><button class="btn btn-secondary btn-icon" style="padding: 6px;" onclick="viewMovementRow(this)">👁️</button></td>
        `;
        tableBody.prepend(row);
        showToast('Movement recorded.');
      }
    });
  };

  const viewMovementRow = (button) => {
    const row = button?.closest('tr');
    if (!row) {
      showToast('Transaction not found.');
      return;
    }
    openReadOnlyModal({
      title: 'Stock Movement Details',
      fields: [
        { label: 'Date', value: row.cells[0]?.textContent.trim() || '' },
        { label: 'Transaction ID', value: row.cells[1]?.textContent.trim() || '' },
        { label: 'Type', value: row.cells[2]?.innerText.trim() || '' },
        { label: 'Item', value: row.cells[3]?.textContent.trim() || '' },
        { label: 'Quantity', value: row.cells[4]?.textContent.trim() || '' },
        { label: 'From/To', value: row.cells[5]?.textContent.trim() || '' },
        { label: 'Reference', value: row.cells[6]?.textContent.trim() || '' },
        { label: 'Recorded By', value: row.cells[7]?.textContent.trim() || '' }
      ]
    });
  };

  const openNewAdjustmentModal = () => {
    openModal({
      title: 'New Adjustment',
      submitLabel: 'Save Adjustment',
      fields: [
        { name: 'date', label: 'Date', type: 'date' },
        { name: 'adjustmentId', label: 'Adjustment ID', placeholder: 'ADJ-2026-XXX' },
        { name: 'item', label: 'Item', placeholder: 'Item name' },
        { name: 'warehouse', label: 'Warehouse', placeholder: 'Warehouse' },
        { name: 'previousQty', label: 'Previous Qty', placeholder: '0' },
        { name: 'adjustedQty', label: 'Adjusted Qty', placeholder: '0' },
        { name: 'reason', label: 'Reason', placeholder: 'Adjustment reason' },
        { name: 'approvedBy', label: 'Approved By', placeholder: 'Name' }
      ],
      onSubmit: (values) => {
        const tableBody = document.querySelector('#stockAdjustment table tbody');
        if (!tableBody) {
          showToast('Adjustments table not found.');
          return;
        }
        const prev = Number(values.previousQty || 0);
        const adj = Number(values.adjustedQty || 0);
        const diff = adj - prev;
        const diffColor = diff < 0 ? 'var(--danger-color)' : 'var(--success-color)';
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${values.date || 'Today'}</td>
          <td><strong>${values.adjustmentId || 'ADJ-NEW'}</strong></td>
          <td>${values.item || 'Item'}</td>
          <td>${values.warehouse || 'Warehouse'}</td>
          <td>${values.previousQty || '0'}</td>
          <td>${values.adjustedQty || '0'}</td>
          <td style="color: ${diffColor};"><strong>${diff >= 0 ? '+' : ''}${diff}</strong></td>
          <td>${values.reason || '-'}</td>
          <td>${values.approvedBy || 'User'}</td>
          <td><button class="btn btn-secondary btn-icon" style="padding: 6px;" onclick="viewAdjustmentRow(this)">👁️</button></td>
        `;
        tableBody.prepend(row);
        showToast('Adjustment saved.');
      }
    });
  };

  const viewAdjustmentRow = (button) => {
    const row = button?.closest('tr');
    if (!row) {
      showToast('Adjustment not found.');
      return;
    }
    openReadOnlyModal({
      title: 'Stock Adjustment Details',
      fields: [
        { label: 'Date', value: row.cells[0]?.textContent.trim() || '' },
        { label: 'Adjustment ID', value: row.cells[1]?.textContent.trim() || '' },
        { label: 'Item', value: row.cells[2]?.textContent.trim() || '' },
        { label: 'Warehouse', value: row.cells[3]?.textContent.trim() || '' },
        { label: 'Previous Qty', value: row.cells[4]?.textContent.trim() || '' },
        { label: 'Adjusted Qty', value: row.cells[5]?.textContent.trim() || '' },
        { label: 'Difference', value: row.cells[6]?.textContent.trim() || '' },
        { label: 'Reason', value: row.cells[7]?.textContent.trim() || '' },
        { label: 'Approved By', value: row.cells[8]?.textContent.trim() || '' }
      ]
    });
  };

  const exportReorderReport = () => {
    showToast('Reorder report exported.');
  };

  const editReorderLevelRow = (button) => {
    const row = button?.closest('tr');
    if (!row) {
      showToast('Row not found.');
      return;
    }
    openModal({
      title: 'Edit Reorder Level',
      submitLabel: 'Save',
      fields: [
        { name: 'minLevel', label: 'Min Level', value: row.cells[3]?.textContent || '' },
        { name: 'maxLevel', label: 'Max Level', value: row.cells[4]?.textContent || '' },
        { name: 'reorderQty', label: 'Reorder Qty', value: row.cells[5]?.textContent || '' },
        { name: 'leadTime', label: 'Lead Time', value: row.cells[6]?.textContent || '' }
      ],
      onSubmit: (values) => {
        row.cells[3].textContent = values.minLevel || row.cells[3].textContent;
        row.cells[4].textContent = values.maxLevel || row.cells[4].textContent;
        row.cells[5].textContent = values.reorderQty || row.cells[5].textContent;
        row.cells[6].textContent = values.leadTime || row.cells[6].textContent;
        showToast('Reorder level updated.');
      }
    });
  };

  const getActiveContainer = (root) => {
    const activeTab = root.querySelector('.tab-content.active');
    return activeTab || root;
  };

  const getTables = (container) => Array.from(container.querySelectorAll('table'));

  const parseDate = (text) => {
    const cleaned = (text || '').replace(/\s+/g, ' ').replace(/,/g, '').trim();
    if (!cleaned) {
      return null;
    }

    const parsed = Date.parse(cleaned);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed);
    }

    const parts = cleaned.split(' ');
    if (parts.length === 3) {
      const [monthText, dayText, yearText] = parts;
      const monthIndex = monthNames.indexOf(monthText.toLowerCase().slice(0, 3));
      const day = Number(dayText);
      const year = Number(yearText);
      if (monthIndex >= 0 && Number.isFinite(day) && Number.isFinite(year)) {
        return new Date(year, monthIndex, day);
      }
    }

    return null;
  };

  const getRowDate = (row) => {
    const cells = Array.from(row.cells || []);
    for (const cell of cells) {
      const parsed = parseDate(cell.textContent);
      if (parsed) {
        return parsed;
      }
    }
    return null;
  };

  const getFilterControls = (container) => {
    return {
      selects: Array.from(container.querySelectorAll('select.form-select')),
      monthInputs: Array.from(container.querySelectorAll('input[type="month"]')),
      dateInputs: Array.from(container.querySelectorAll('input[type="date"]'))
    };
  };

  const matchesSelectFilters = (rowText, selects) => {
    return selects.every((select) => {
      const selectedOption = select.options[select.selectedIndex];
      const value = normalize(selectedOption ? selectedOption.text : select.value);
      if (!value || value === 'all' || value.startsWith('all ')) {
        return true;
      }
      return rowText.includes(value);
    });
  };

  const matchesMonthFilter = (rowDate, monthInputs) => {
    if (!monthInputs.length) {
      return true;
    }
    const value = monthInputs[0].value;
    if (!value) {
      return true;
    }
    if (!rowDate) {
      return false;
    }
    const [year, month] = value.split('-').map(Number);
    return rowDate.getFullYear() === year && rowDate.getMonth() === month - 1;
  };

  const matchesDateRange = (rowDate, dateInputs) => {
    if (!dateInputs.length) {
      return true;
    }
    if (!rowDate) {
      return false;
    }

    const [startInput, endInput] = dateInputs;
    const startValue = startInput?.value;
    const endValue = endInput?.value;

    if (startValue) {
      const startDate = new Date(startValue);
      if (rowDate < startDate) {
        return false;
      }
    }

    if (endValue) {
      const endDate = new Date(endValue);
      endDate.setHours(23, 59, 59, 999);
      if (rowDate > endDate) {
        return false;
      }
    }

    return true;
  };

  const applyFiltersForContainer = (container, searchText) => {
    const { selects, monthInputs, dateInputs } = getFilterControls(container);
    const search = normalize(searchText);

    getTables(container).forEach((table) => {
      const rows = Array.from(table.tBodies).flatMap((tbody) => Array.from(tbody.rows));
      rows.forEach((row) => {
        const rowText = normalize(row.textContent);
        const rowDate = getRowDate(row);

        const matchesSearch = !search || rowText.includes(search);
        const matchesSelect = matchesSelectFilters(rowText, selects);
        const matchesMonth = matchesMonthFilter(rowDate, monthInputs);
        const matchesRange = matchesDateRange(rowDate, dateInputs);

        row.style.display = matchesSearch && matchesSelect && matchesMonth && matchesRange ? '' : 'none';
      });
    });
  };

  const applyAllTableFilters = () => {
    document.querySelectorAll('.main-content').forEach((main) => {
      const container = getActiveContainer(main);
      const searchInput = main.querySelector('.search-box input');
      applyFiltersForContainer(container, searchInput ? searchInput.value : '');
    });
  };

  const actionLabelFromButton = (button) => {
    const text = button.textContent.replace(/\s+/g, ' ').trim();
    const iconMap = {
      '📝': 'Edit',
      '👁️': 'View',
      '✓': 'Approve',
      '✔️': 'Approve',
      '✖️': 'Reject',
      '❌': 'Reject',
      '🗑️': 'Delete'
    };

    if (iconMap[text]) {
      return iconMap[text];
    }

    return text || 'Action';
  };

  const getRowIdentifier = (button) => {
    const row = button.closest('tr');
    if (!row) {
      return '';
    }
    const firstCell = row.querySelector('td');
    return firstCell ? firstCell.textContent.trim() : '';
  };

  const editUserRow = (button) => {
    const row = button?.closest('tr');
    if (!row) {
      showToast('User not found.');
      return;
    }
    const name = row.querySelector('strong')?.textContent || '';
    const email = row.cells[1]?.textContent || '';
    const role = row.cells[2]?.innerText || '';
    const department = row.cells[3]?.textContent || '';
    const status = row.cells[4]?.innerText || '';

    openModal({
      title: 'Edit User',
      submitLabel: 'Update User',
      fields: [
        { name: 'name', label: 'Full Name', value: name, placeholder: 'Enter full name' },
        { name: 'email', label: 'Email Address', value: email, placeholder: 'name@company.com' },
        { name: 'role', label: 'Role', type: 'select', options: ['Administrator', 'Project Manager', 'Procurement Manager', 'Finance Manager'], value: role },
        { name: 'department', label: 'Department', value: department, placeholder: 'IT / Projects / SCM' },
        { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], value: status }
      ],
      onSubmit: (values) => {
        row.querySelector('strong').textContent = values.name || name;
        row.cells[1].textContent = values.email || email;
        const roleCell = row.cells[2];
        const roleClassMap = {
          'administrator': 'badge-danger',
          'project manager': 'badge-info',
          'procurement manager': 'badge-warning',
          'finance manager': 'badge-success'
        };
        const roleClass = roleClassMap[normalize(values.role)] || 'badge-info';
        roleCell.innerHTML = `<span class="badge ${roleClass}">${values.role || role}</span>`;
        row.cells[3].textContent = values.department || department;
        const statusClass = normalize(values.status) === 'active' ? 'badge-success' : 'badge-warning';
        row.cells[4].innerHTML = `<span class="badge ${statusClass}">${values.status || status}</span>`;
        showToast('User updated successfully.');
      }
    });
  };

  const toggleUserRow = (button) => {
    const row = button?.closest('tr');
    if (!row) {
      showToast('User not found.');
      return;
    }
    const statusCell = row.cells[4];
    if (!statusCell) {
      showToast('Status not found.');
      return;
    }
    const isActive = normalize(statusCell.textContent) === 'active';
    const newStatus = isActive ? 'Inactive' : 'Active';
    const badgeClass = isActive ? 'badge-warning' : 'badge-success';
    statusCell.innerHTML = `<span class="badge ${badgeClass}">${newStatus}</span>`;
    button.textContent = isActive ? '🔓' : '🔒';
    showToast(`User ${newStatus.toLowerCase()}.`);
  };

  const initButtons = () => {
    document.querySelectorAll('button.btn, button.btn-icon').forEach((button) => {
      if (button.classList.contains('tab')) {
        return;
      }

      if (button.type === 'submit' || button.closest('form')) {
        return;
      }

      if (button.dataset.actionBound) {
        return;
      }

      if (button.getAttribute('onclick')) {
        return;
      }

      button.dataset.actionBound = 'true';

      button.addEventListener('click', () => {
        const label = actionLabelFromButton(button);
        const rowId = getRowIdentifier(button);
        const suffix = rowId ? ` (${rowId})` : '';
        const text = normalize(button.textContent);
        const action = button.dataset.action;

        if (action === 'logout') {
          if (typeof window.handleLogout === 'function') {
            window.handleLogout();
            return;
          }
          window.location.href = 'login.html';
          return;
        }

        if (action === 'add-user') {
          openAddUserModal();
          return;
        }

        if (action === 'create-role') {
          openCreateRoleModal();
          return;
        }

        if (action === 'upload-document') {
          openUploadDocumentModal();
          return;
        }

        if (action === 'view-document') {
          showToast('Opening document preview.');
          return;
        }

        if (action === 'download-document') {
          showToast('Download started.');
          return;
        }

        if (action === 'save-settings' || action === 'save-permissions') {
          showToast('Changes saved successfully.');
          return;
        }

        if (action === 'generate-report') {
          showToast('Report generated successfully.');
          return;
        }

        if (action === 'backup-database') {
          showToast('Database backup started.');
          return;
        }

        if (action === 'view-warehouse') {
          viewWarehouseDetails(button);
          return;
        }

        if (text.includes('view details')) {
          viewWarehouseDetails(button);
          return;
        }

        if (action === 'open-settings') {
          const settingsTab = document.querySelector('.tab[onclick*="settings"]');
          if (settingsTab) {
            settingsTab.click();
          }
          showToast('Opening system settings.');
          return;
        }

        if (action === 'edit-user') {
          editUserRow(button);
          return;
        }

        if (action === 'toggle-user') {
          toggleUserRow(button);
          return;
        }

        if (text.includes('add user') || text.includes('add new user')) {
          openAddUserModal();
          return;
        }

        if (text.includes('create role')) {
          openModal({
            title: 'Create Role',
            submitLabel: 'Create Role',
            fields: [
              { name: 'roleName', label: 'Role Name', placeholder: 'e.g., Site Manager' },
              { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Short description of the role.' }
            ],
            onSubmit: (values) => {
              const rolesTab = document.querySelector('#roles');
              const saveButton = rolesTab?.querySelector('[data-action="save-permissions"]') || rolesTab?.querySelector('button.btn.btn-primary');
              if (!rolesTab || !saveButton) {
                showToast('Roles section not found.');
                return;
              }
              const block = document.createElement('div');
              block.style.marginBottom = '24px';
              block.innerHTML = `
                <h4 style="margin-bottom: 12px;">${values.roleName || 'New Role'}</h4>
                <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;">${values.description || 'Custom permissions set.'}</div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
                  <label style="display: flex; align-items: center; gap: 8px;"><input type="checkbox" checked><span>View Dashboard</span></label>
                  <label style="display: flex; align-items: center; gap: 8px;"><input type="checkbox"><span>Manage Users</span></label>
                  <label style="display: flex; align-items: center; gap: 8px;"><input type="checkbox"><span>View Reports</span></label>
                </div>
              `;
              saveButton.parentElement.insertBefore(block, saveButton);
              showToast('Role created successfully.');
            }
          });
          return;
        }

        if (text.includes('upload document')) {
          openModal({
            title: 'Upload Document',
            submitLabel: 'Upload',
            fields: [
              { name: 'docName', label: 'Document Name', placeholder: 'Document name' },
              { name: 'type', label: 'Type', type: 'select', options: ['PDF', 'XLSX', 'DOCX'] },
              { name: 'category', label: 'Category', type: 'select', options: ['Technical', 'Financial', 'Legal', 'Operations'] },
              { name: 'uploadedBy', label: 'Uploaded By', placeholder: 'User name' },
              { name: 'size', label: 'Size', placeholder: 'e.g., 1.8 MB' }
            ],
            onSubmit: (values) => {
              const docsTable = document.querySelector('#documents table tbody');
              if (!docsTable) {
                showToast('Documents table not found.');
                return;
              }
              const now = new Date();
              const dateText = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
              const categoryClassMap = {
                'technical': 'badge-info',
                'financial': 'badge-success',
                'legal': 'badge-warning',
                'operations': 'badge-primary'
              };
              const categoryClass = categoryClassMap[normalize(values.category)] || 'badge-info';
              const row = document.createElement('tr');
              row.innerHTML = `
                <td><strong>📄 ${values.docName || 'New_Document.pdf'}</strong></td>
                <td>${values.type || 'PDF'}</td>
                <td><span class="badge ${categoryClass}">${values.category || 'Technical'}</span></td>
                <td>${values.uploadedBy || 'John Doe'}</td>
                <td>${dateText}</td>
                <td>${values.size || '1.0 MB'}</td>
                <td>
                  <button class="btn btn-secondary btn-icon" style="padding: 6px;">👁️</button>
                  <button class="btn btn-secondary btn-icon" style="padding: 6px;">⬇️</button>
                </td>
              `;
              docsTable.prepend(row);
              initButtons();
              showToast('Document uploaded successfully.');
            }
          });
          return;
        }

        if (text.includes('save settings') || text.includes('save permissions')) {
          showToast('Changes saved successfully.');
          return;
        }

        if (text.includes('generate report')) {
          showToast('Report generated successfully.');
          return;
        }

        if (text.includes('backup database')) {
          showToast('Database backup started.');
          return;
        }

        if (text.includes('system settings')) {
          const settingsTab = document.querySelector('.tab[onclick*="settings"]');
          if (settingsTab) {
            settingsTab.click();
          }
          showToast('Opening system settings.');
          return;
        }

        if (text.startsWith('+') || text.includes('create') || text.includes('new') || text.includes('record') || text.includes('request')) {
          const main = button.closest('.main-content') || document;
          const container = getActiveContainer(main);
          const table = container.querySelector('table');
          const headers = table ? Array.from(table.querySelectorAll('thead th')).map((th) => th.textContent.trim()).filter(Boolean) : [];
          const fields = headers.filter((header) => normalize(header) !== 'actions').slice(0, 5).map((header) => ({
            name: normalize(header).replace(/\s+/g, '_'),
            label: header,
            placeholder: `Enter ${header.toLowerCase()}`
          }));

          openModal({
            title: label,
            submitLabel: 'Add',
            fields: fields.length ? fields : [
              { name: 'title', label: 'Title', placeholder: 'Enter title' },
              { name: 'description', label: 'Description', placeholder: 'Short description' }
            ],
            onSubmit: (values) => {
              if (!table) {
                showToast(`${label} completed.`);
                return;
              }
              const body = table.querySelector('tbody');
              const row = document.createElement('tr');
              const cells = headers.map((header) => {
                if (normalize(header) === 'actions') {
                  return '<td><button class="btn btn-secondary btn-icon" style="padding: 6px;">📝</button></td>';
                }
                const key = normalize(header).replace(/\s+/g, '_');
                const value = values[key] || values.title || 'New Item';
                if (normalize(header) === 'status') {
                  return `<td><span class="badge badge-info">${value}</span></td>`;
                }
                return `<td>${value}</td>`;
              }).join('');
              row.innerHTML = cells;
              body.prepend(row);
              initButtons();
              showToast(`${label} created successfully.`);
            }
          });
          return;
        }

        showToast(`${label}${suffix} triggered.`);
      });
    });
  };

  const initFilters = () => {
    document.querySelectorAll('.search-box input').forEach((input) => {
      input.addEventListener('input', () => applyAllTableFilters());
    });

    document.querySelectorAll('select.form-select').forEach((select) => {
      select.addEventListener('change', () => applyAllTableFilters());
    });

    document.querySelectorAll('input[type="month"], input[type="date"]').forEach((input) => {
      input.addEventListener('change', () => applyAllTableFilters());
    });

    applyAllTableFilters();
  };

  window.applyAllTableFilters = applyAllTableFilters;
  window.openAddUserModal = openAddUserModal;
  window.openCreateRoleModal = openCreateRoleModal;
  window.openUploadDocumentModal = openUploadDocumentModal;
  window.openAddItemModal = openAddItemModal;
  window.openReadOnlyModal = openReadOnlyModal;
  window.openAddVendorModal = openAddVendorModal;
  window.viewVendorRow = viewVendorRow;
  window.editVendorRow = editVendorRow;
  window.openTrackingModal = openTrackingModal;
  window.openNotesModal = openNotesModal;
  window.openDeliveryNotesRow = openDeliveryNotesRow;
  window.openCreateRFQModal = openCreateRFQModal;
  window.viewRFQRow = viewRFQRow;
  window.editRFQRow = editRFQRow;
  window.openCreatePOModal = openCreatePOModal;
  window.viewPORow = viewPORow;
  window.viewPODocument = viewPODocument;
  window.openNewRequisitionModal = openNewRequisitionModal;
  window.viewRequisitionRow = viewRequisitionRow;
  window.approveRequisitionRow = approveRequisitionRow;
  window.createRFQFromRequisitionRow = createRFQFromRequisitionRow;
  window.openNewProjectModal = openNewProjectModal;
  window.viewProjectRow = viewProjectRow;
  window.editProjectRow = editProjectRow;
  window.openAddClientModal = openAddClientModal;
  window.viewClientRow = viewClientRow;
  window.editClientRow = editClientRow;
  window.viewSiteDetails = viewSiteDetails;
  window.openSiteDailyReport = openSiteDailyReport;
  window.openAddWorkerModal = openAddWorkerModal;
  window.viewWorkerRow = viewWorkerRow;
  window.editWorkerRow = editWorkerRow;
  window.openAddEquipmentModal = openAddEquipmentModal;
  window.viewEquipmentRow = viewEquipmentRow;
  window.editEquipmentRow = editEquipmentRow;
  window.scheduleEquipmentMaintenance = scheduleEquipmentMaintenance;
  window.openNewInspectionModal = openNewInspectionModal;
  window.viewInspectionRow = viewInspectionRow;
  window.continueInspection = continueInspection;
  window.openInspectionReport = openInspectionReport;
  window.actionRequiredInspection = actionRequiredInspection;
  window.openCreateInvoiceModal = openCreateInvoiceModal;
  window.viewInvoiceRow = viewInvoiceRow;
  window.emailInvoiceRow = emailInvoiceRow;
  window.downloadInvoiceRow = downloadInvoiceRow;
  window.remindInvoiceRow = remindInvoiceRow;
  window.openNewReceivableInvoice = openNewReceivableInvoice;
  window.viewReceivableRow = viewReceivableRow;
  window.downloadReceivableRow = downloadReceivableRow;
  window.followUpReceivableRow = followUpReceivableRow;
  window.openRecordPayableModal = openRecordPayableModal;
  window.viewPayableRow = viewPayableRow;
  window.downloadPayableRow = downloadPayableRow;
  window.schedulePayableRow = schedulePayableRow;
  window.payNowPayableRow = payNowPayableRow;
  window.openRecordPaymentModal = openRecordPaymentModal;
  window.viewPaymentRow = viewPaymentRow;
  window.downloadPaymentRow = downloadPaymentRow;
  window.viewBudgetRow = viewBudgetRow;
  window.openAddBankAccountModal = openAddBankAccountModal;
  window.viewBankTransactions = viewBankTransactions;
  window.approvePORow = approvePORow;
  window.rejectPORow = rejectPORow;
  window.trackPORow = trackPORow;
  window.confirmPODelivery = confirmPODelivery;
  window.trackDeliveryRow = trackDeliveryRow;
  window.viewDeliveryRow = viewDeliveryRow;
  window.followUpDeliveryRow = followUpDeliveryRow;
  window.viewItemRow = viewItemRow;
  window.editItemRow = editItemRow;
  window.openReorderModal = openReorderModal;
  window.openAddWarehouseModal = openAddWarehouseModal;
  window.viewWarehouseDetails = viewWarehouseDetails;
  window.openRecordMovementModal = openRecordMovementModal;
  window.viewMovementRow = viewMovementRow;
  window.openNewAdjustmentModal = openNewAdjustmentModal;
  window.viewAdjustmentRow = viewAdjustmentRow;
  window.exportReorderReport = exportReorderReport;
  window.editReorderLevelRow = editReorderLevelRow;
  window.editUserRow = editUserRow;
  window.toggleUserRow = toggleUserRow;

  document.addEventListener('DOMContentLoaded', () => {
    applyRoleAccess();
    initFilters();
    initButtons();

    document.querySelectorAll('.notification-btn').forEach((button) => {
      setupNotificationDropdown(button);
    });

    document.addEventListener('click', () => {
      closeAllNotificationMenus();
    });
  });
})();
