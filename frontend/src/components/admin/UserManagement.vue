<script setup>
/**
 * User Management Component
 *
 * Allows administrators to view and manage users.
 * Displays user list with roles and permissions.
 */
import { ref, computed, onMounted } from 'vue';
import { useRoles, ROLE_DEFINITIONS, STATION_NAMES } from '@composables/useRoles';
import { api } from '@services/api';
import { useNotifications } from '@composables/useNotifications';

const { canManageUsers } = useRoles();
const notifications = useNotifications();

// State
const users = ref([]);
const loading = ref(false);
const error = ref(null);
const showCreateModal = ref(false);
const showEditModal = ref(false);
const selectedUser = ref(null);

// Form state
const formData = ref({
  username: '',
  password: '',
  role: 'readonly',
  station_id: null
});

// Fetch users
async function fetchUsers() {
  if (!canManageUsers.value) return;

  loading.value = true;
  error.value = null;

  try {
    const response = await api.get('/users');
    if (response.success) {
      users.value = response.users || [];
    } else {
      error.value = response.error || 'Failed to fetch users';
    }
  } catch (err) {
    error.value = err.message || 'Failed to fetch users';
  } finally {
    loading.value = false;
  }
}

// Get role display info
function getRoleInfo(roleKey) {
  return ROLE_DEFINITIONS[roleKey] || ROLE_DEFINITIONS.readonly;
}

// Open create modal
function openCreateModal() {
  formData.value = {
    username: '',
    password: '',
    role: 'readonly',
    station_id: null
  };
  showCreateModal.value = true;
}

// Open edit modal
function openEditModal(user) {
  selectedUser.value = user;
  formData.value = {
    username: user.username,
    password: '',
    role: user.role || 'readonly',
    station_id: user.station_id
  };
  showEditModal.value = true;
}

// Create user
async function createUser() {
  loading.value = true;

  try {
    const response = await api.post('/users', formData.value);
    if (response.success) {
      notifications.success('User created successfully');
      showCreateModal.value = false;
      await fetchUsers();
    } else {
      notifications.error(response.error || 'Failed to create user');
    }
  } catch (err) {
    notifications.error(err.message || 'Failed to create user');
  } finally {
    loading.value = false;
  }
}

// Update user
async function updateUser() {
  if (!selectedUser.value) return;

  loading.value = true;

  try {
    const updateData = { ...formData.value };
    // Only include password if changed
    if (!updateData.password) {
      delete updateData.password;
    }

    const response = await api.put(`/users/${selectedUser.value.id}`, updateData);
    if (response.success) {
      notifications.success('User updated successfully');
      showEditModal.value = false;
      selectedUser.value = null;
      await fetchUsers();
    } else {
      notifications.error(response.error || 'Failed to update user');
    }
  } catch (err) {
    notifications.error(err.message || 'Failed to update user');
  } finally {
    loading.value = false;
  }
}

// Delete user
async function deleteUser(user) {
  if (!confirm(`Are you sure you want to delete user "${user.username}"?`)) {
    return;
  }

  loading.value = true;

  try {
    const response = await api.delete(`/users/${user.id}`);
    if (response.success) {
      notifications.success('User deleted successfully');
      await fetchUsers();
    } else {
      notifications.error(response.error || 'Failed to delete user');
    }
  } catch (err) {
    notifications.error(err.message || 'Failed to delete user');
  } finally {
    loading.value = false;
  }
}

// Available roles for dropdown
const availableRoles = computed(() => {
  return Object.entries(ROLE_DEFINITIONS).map(([key, def]) => ({
    value: key,
    label: def.name,
    description: def.description
  }));
});

onMounted(fetchUsers);
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold">User Management</h2>
      <button class="btn btn-primary btn-sm" @click="openCreateModal">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add User
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading && users.length === 0" class="flex justify-center py-8">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert-error">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{{ error }}</span>
    </div>

    <!-- Users Table -->
    <div v-else class="overflow-x-auto">
      <table class="table table-zebra">
        <thead>
          <tr>
            <th>Username</th>
            <th>Role</th>
            <th>Station</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td class="font-medium">{{ user.username }}</td>
            <td>
              <span :class="['badge', `badge-${getRoleInfo(user.role).color}`]">
                {{ getRoleInfo(user.role).name }}
              </span>
            </td>
            <td>{{ user.station_name || '-' }}</td>
            <td>{{ user.created_at ? new Date(user.created_at).toLocaleDateString() : '-' }}</td>
            <td>
              <div class="flex gap-1">
                <button class="btn btn-ghost btn-xs" @click="openEditModal(user)">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button class="btn btn-ghost btn-xs text-error" @click="deleteUser(user)">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="users.length === 0">
            <td colspan="5" class="text-center text-base-content/60 py-8">
              No users found
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create User Modal -->
    <dialog :class="['modal', { 'modal-open': showCreateModal }]">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Create User</h3>

        <form @submit.prevent="createUser">
          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text">Username</span>
            </label>
            <input
              v-model="formData.username"
              type="text"
              class="input input-bordered"
              required
            />
          </div>

          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text">Password</span>
            </label>
            <input
              v-model="formData.password"
              type="password"
              class="input input-bordered"
              required
            />
          </div>

          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text">Role</span>
            </label>
            <select v-model="formData.role" class="select select-bordered">
              <option v-for="role in availableRoles" :key="role.value" :value="role.value">
                {{ role.label }}
              </option>
            </select>
          </div>

          <div v-if="formData.role === 'station'" class="form-control mb-4">
            <label class="label">
              <span class="label-text">Station</span>
            </label>
            <select v-model="formData.station_id" class="select select-bordered">
              <option :value="null">Select station...</option>
              <option v-for="station in STATION_NAMES" :key="station" :value="station">
                {{ station }}
              </option>
            </select>
          </div>

          <div class="modal-action">
            <button type="button" class="btn" @click="showCreateModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <span v-if="loading" class="loading loading-spinner loading-sm"></span>
              Create
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showCreateModal = false">close</button>
      </form>
    </dialog>

    <!-- Edit User Modal -->
    <dialog :class="['modal', { 'modal-open': showEditModal }]">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Edit User</h3>

        <form @submit.prevent="updateUser">
          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text">Username</span>
            </label>
            <input
              v-model="formData.username"
              type="text"
              class="input input-bordered"
              required
            />
          </div>

          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text">Password (leave blank to keep current)</span>
            </label>
            <input
              v-model="formData.password"
              type="password"
              class="input input-bordered"
            />
          </div>

          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text">Role</span>
            </label>
            <select v-model="formData.role" class="select select-bordered">
              <option v-for="role in availableRoles" :key="role.value" :value="role.value">
                {{ role.label }}
              </option>
            </select>
          </div>

          <div v-if="formData.role === 'station'" class="form-control mb-4">
            <label class="label">
              <span class="label-text">Station</span>
            </label>
            <select v-model="formData.station_id" class="select select-bordered">
              <option :value="null">Select station...</option>
              <option v-for="station in STATION_NAMES" :key="station" :value="station">
                {{ station }}
              </option>
            </select>
          </div>

          <div class="modal-action">
            <button type="button" class="btn" @click="showEditModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <span v-if="loading" class="loading loading-spinner loading-sm"></span>
              Update
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showEditModal = false">close</button>
      </form>
    </dialog>
  </div>
</template>
