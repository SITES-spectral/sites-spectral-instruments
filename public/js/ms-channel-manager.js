/**
 * MS Channel Manager Module
 *
 * Manages spectral channel CRUD operations including creation, editing,
 * deletion, and display. Provides UI components for channel management
 * within MS instrument modals.
 *
 * @module ms-channel-manager
 * @version 6.1.0
 */

const MSChannelManager = (() => {
    'use strict';

    // Channel storage for current editing session
    let currentChannels = [];

    // Track which channel is being edited (-1 = not editing, adding new)
    let editingIndex = -1;

    /**
     * Initialize channel manager with existing channels
     * @param {array} channels - Array of channel objects
     */
    function init(channels = []) {
        currentChannels = channels || [];
        console.log(`📡 Channel Manager initialized with ${currentChannels.length} channels`);
    }

    /**
     * Get current channels
     * @returns {array} - Array of channel objects
     */
    function getChannels() {
        return currentChannels;
    }

    /**
     * Add new channel
     * @param {object} channel - Channel object
     * @returns {boolean} - Success status
     */
    function addChannel(channel) {
        // Auto-assign channel number if not provided
        if (!channel.channel_number) {
            channel.channel_number = currentChannels.length + 1;
        }

        // Validate channel data
        const validation = MSValidation.validateWavelength(channel.center_wavelength_nm);
        if (!validation.valid) {
            alert(`Invalid wavelength: ${validation.message}`);
            return false;
        }

        const bwValidation = MSValidation.validateBandwidth(channel.bandwidth_nm);
        if (!bwValidation.valid) {
            alert(`Invalid bandwidth: ${bwValidation.message}`);
            return false;
        }

        currentChannels.push(channel);
        console.log(`✅ Added channel ${channel.channel_number}: ${channel.channel_name}`);
        return true;
    }

    /**
     * Update existing channel
     * @param {number} index - Channel index in array
     * @param {object} updatedChannel - Updated channel object
     * @returns {boolean} - Success status
     */
    function updateChannel(index, updatedChannel) {
        if (index < 0 || index >= currentChannels.length) {
            console.error('Invalid channel index');
            return false;
        }

        // Validate updated data
        const validation = MSValidation.validateWavelength(updatedChannel.center_wavelength_nm);
        if (!validation.valid) {
            alert(`Invalid wavelength: ${validation.message}`);
            return false;
        }

        currentChannels[index] = { ...currentChannels[index], ...updatedChannel };
        console.log(`✅ Updated channel ${index + 1}: ${updatedChannel.channel_name}`);
        return true;
    }

    /**
     * Remove channel
     * @param {number} index - Channel index in array
     * @returns {boolean} - Success status
     */
    function removeChannel(index) {
        if (index < 0 || index >= currentChannels.length) {
            console.error('Invalid channel index');
            return false;
        }

        const removed = currentChannels.splice(index, 1);
        console.log(`🗑️ Removed channel: ${removed[0].channel_name}`);

        // Re-number remaining channels
        currentChannels.forEach((ch, i) => {
            ch.channel_number = i + 1;
        });

        return true;
    }

    /**
     * Clear all channels
     */
    function clearChannels() {
        currentChannels = [];
        console.log('🗑️ Cleared all channels');
    }

    /**
     * Render channels table
     * @param {string} containerId - ID of container element
     * @param {boolean} editable - Whether channels are editable
     * @returns {void}
     */
    function renderChannelsTable(containerId, editable = true) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        if (currentChannels.length === 0) {
            container.innerHTML = '<p class="text-muted">No channels added yet. Add channels using the form above.</p>';
            return;
        }

        let html = `
            <table class="table table-sm table-bordered">
                <thead>
                    <tr>
                        <th style="width: 50px;">#</th>
                        <th>Channel Name</th>
                        <th>Band Type</th>
                        <th style="width: 100px;">Wavelength (nm)</th>
                        <th style="width: 100px;">Bandwidth (nm)</th>
                        ${editable ? '<th style="width: 80px;">Actions</th>' : ''}
                    </tr>
                </thead>
                <tbody>
        `;

        currentChannels.forEach((channel, index) => {
            html += `
                <tr id="channel-row-${index}">
                    <td>${channel.channel_number}</td>
                    <td>${channel.channel_name}</td>
                    <td><span class="badge badge-primary">${channel.band_type || 'N/A'}</span></td>
                    <td>${channel.center_wavelength_nm}</td>
                    <td>${channel.bandwidth_nm}</td>
                    ${editable ? `
                        <td>
                            <button class="btn btn-sm btn-warning" onclick="MSChannelManager.editChannelUI('${index}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="MSChannelManager.deleteChannelUI('${index}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    ` : ''}
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
            <div class="mt-2">
                <strong>Total Channels:</strong> ${currentChannels.length}
            </div>
        `;

        container.innerHTML = html;
    }

    /**
     * Render channel creation form
     * @param {string} containerId - ID of container element
     * @param {object} options - Form options
     * @returns {void}
     */
    function renderChannelForm(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        const bandwidthPresets = MSValidation.getBandwidthPresets();

        const html = `
            <div class="channel-form" id="channel-creation-form">
                <div class="row">
                    <div class="col-md-3">
                        <label>Band Type *</label>
                        <select id="channel-band-type" class="form-control form-control-sm">
                            <option value="">Select...</option>
                            <option value="Blue">Blue (400-500nm)</option>
                            <option value="Green">Green (500-600nm)</option>
                            <option value="Red">Red (600-700nm)</option>
                            <option value="Far-Red">Far-Red (700-750nm)</option>
                            <option value="NIR">NIR (750-1000nm)</option>
                            <option value="Custom">Custom</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <label>Center Wavelength (nm) *</label>
                        <input type="number" id="channel-wavelength" class="form-control form-control-sm"
                               min="300" max="1200" step="1" placeholder="e.g., 645">
                    </div>
                    <div class="col-md-3">
                        <label>Bandwidth (nm) *</label>
                        <select id="channel-bandwidth" class="form-control form-control-sm">
                            <option value="">Select...</option>
                            ${bandwidthPresets.map(preset =>
                                `<option value="${preset.value}">${preset.label}</option>`
                            ).join('')}
                            <option value="custom">Custom</option>
                        </select>
                        <input type="number" id="channel-bandwidth-custom" class="form-control form-control-sm mt-1"
                               style="display: none;" min="1" max="200" step="1" placeholder="Enter bandwidth">
                    </div>
                    <div class="col-md-3">
                        <label>Channel Name *</label>
                        <input type="text" id="channel-name" class="form-control form-control-sm"
                               placeholder="Auto-generated" readonly>
                    </div>
                </div>
                <div class="row mt-2">
                    <div class="col-md-12">
                        <button type="button" class="btn btn-sm btn-success" onclick="MSChannelManager.addChannelFromForm()">
                            <i class="fas fa-plus"></i> Add Channel
                        </button>
                        <button type="button" class="btn btn-sm btn-secondary" onclick="MSChannelManager.resetChannelForm()">
                            <i class="fas fa-undo"></i> Reset
                        </button>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Attach event listeners
        attachChannelFormListeners();
    }

    /**
     * Attach event listeners to channel form
     */
    function attachChannelFormListeners() {
        // Band type change → suggest wavelength
        const bandTypeSelect = document.getElementById('channel-band-type');
        if (bandTypeSelect) {
            bandTypeSelect.addEventListener('change', function() {
                if (this.value) {
                    const preset = MSValidation.getWavelengthPreset(this.value);
                    document.getElementById('channel-wavelength').value = preset.wavelength;
                    updateChannelNamePreview();
                }
            });
        }

        // Wavelength change → update name preview
        const wavelengthInput = document.getElementById('channel-wavelength');
        if (wavelengthInput) {
            wavelengthInput.addEventListener('input', updateChannelNamePreview);
        }

        // Bandwidth change → handle custom input
        const bandwidthSelect = document.getElementById('channel-bandwidth');
        if (bandwidthSelect) {
            bandwidthSelect.addEventListener('change', function() {
                const customInput = document.getElementById('channel-bandwidth-custom');
                if (this.value === 'custom') {
                    customInput.style.display = 'block';
                    customInput.focus();
                } else {
                    customInput.style.display = 'none';
                    updateChannelNamePreview();
                }
            });
        }

        // Custom bandwidth input → update name preview
        const bandwidthCustom = document.getElementById('channel-bandwidth-custom');
        if (bandwidthCustom) {
            bandwidthCustom.addEventListener('input', updateChannelNamePreview);
        }
    }

    /**
     * Update channel name preview based on form inputs
     */
    function updateChannelNamePreview() {
        const bandType = document.getElementById('channel-band-type')?.value;
        const wavelength = document.getElementById('channel-wavelength')?.value;
        const bandwidthSelect = document.getElementById('channel-bandwidth');
        const bandwidthCustom = document.getElementById('channel-bandwidth-custom');

        let bandwidth;
        if (bandwidthSelect?.value === 'custom') {
            bandwidth = bandwidthCustom?.value;
        } else {
            bandwidth = bandwidthSelect?.value;
        }

        const nameInput = document.getElementById('channel-name');
        if (bandType && wavelength && bandwidth && nameInput) {
            const name = MSValidation.generateChannelName(bandType, parseInt(wavelength), parseInt(bandwidth));
            nameInput.value = name;
        }
    }

    /**
     * Add or update channel from form inputs
     * @returns {boolean} - Success status
     */
    function addChannelFromForm() {
        const bandType = document.getElementById('channel-band-type')?.value;
        const wavelength = parseInt(document.getElementById('channel-wavelength')?.value);
        const bandwidthSelect = document.getElementById('channel-bandwidth');
        const bandwidthCustom = document.getElementById('channel-bandwidth-custom');
        const channelName = document.getElementById('channel-name')?.value;

        let bandwidth;
        if (bandwidthSelect?.value === 'custom') {
            bandwidth = parseInt(bandwidthCustom?.value);
        } else {
            bandwidth = parseInt(bandwidthSelect?.value);
        }

        // Validation
        if (!bandType || !wavelength || !bandwidth || !channelName) {
            alert('Please fill in all required channel fields');
            return false;
        }

        const channelData = {
            channel_name: channelName,
            center_wavelength_nm: wavelength,
            bandwidth_nm: bandwidth,
            wavelength_notation: MSValidation.generateWavelengthNotation(bandwidth),
            band_type: bandType
        };

        let success;

        if (editingIndex >= 0) {
            // Update existing channel
            channelData.channel_number = currentChannels[editingIndex].channel_number;
            success = updateChannel(editingIndex, channelData);
            if (success) {
                console.log(`✅ Updated channel ${editingIndex + 1}`);
                editingIndex = -1;
                clearRowHighlights();
                updateFormButtons(false);
            }
        } else {
            // Add new channel
            channelData.channel_number = currentChannels.length + 1;
            success = addChannel(channelData);
        }

        if (success) {
            resetChannelForm();
            renderChannelsTable('ms-channels-table');
        }

        return success;
    }

    /**
     * Reset channel form
     */
    function resetChannelForm() {
        document.getElementById('channel-band-type').value = '';
        document.getElementById('channel-wavelength').value = '';
        document.getElementById('channel-bandwidth').value = '';
        document.getElementById('channel-bandwidth-custom').value = '';
        document.getElementById('channel-bandwidth-custom').style.display = 'none';
        document.getElementById('channel-name').value = '';
    }

    /**
     * Edit channel UI handler
     * @param {number} index - Channel index
     */
    function editChannelUI(index) {
        const idx = parseInt(index);
        if (idx < 0 || idx >= currentChannels.length) {
            console.error('Invalid channel index for editing');
            return;
        }

        const channel = currentChannels[idx];
        editingIndex = idx;

        // Populate form with channel data
        const bandTypeSelect = document.getElementById('channel-band-type');
        const wavelengthInput = document.getElementById('channel-wavelength');
        const bandwidthSelect = document.getElementById('channel-bandwidth');
        const bandwidthCustom = document.getElementById('channel-bandwidth-custom');
        const channelNameInput = document.getElementById('channel-name');

        if (bandTypeSelect) bandTypeSelect.value = channel.band_type || '';
        if (wavelengthInput) wavelengthInput.value = channel.center_wavelength_nm || '';
        if (channelNameInput) channelNameInput.value = channel.channel_name || '';

        // Handle bandwidth - check if it matches a preset
        const bandwidthPresets = MSValidation.getBandwidthPresets();
        const matchingPreset = bandwidthPresets.find(p => p.value === channel.bandwidth_nm);

        if (bandwidthSelect) {
            if (matchingPreset) {
                bandwidthSelect.value = channel.bandwidth_nm;
                if (bandwidthCustom) bandwidthCustom.style.display = 'none';
            } else {
                bandwidthSelect.value = 'custom';
                if (bandwidthCustom) {
                    bandwidthCustom.style.display = 'block';
                    bandwidthCustom.value = channel.bandwidth_nm;
                }
            }
        }

        // Update form button to show "Update" instead of "Add"
        updateFormButtons(true);

        // Highlight the row being edited
        highlightEditingRow(idx);

        // Scroll form into view
        const form = document.getElementById('channel-creation-form');
        if (form) {
            form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        console.log(`✏️ Editing channel ${idx + 1}: ${channel.channel_name}`);
    }

    /**
     * Cancel edit mode and reset form
     */
    function cancelEdit() {
        editingIndex = -1;
        resetChannelForm();
        updateFormButtons(false);
        clearRowHighlights();
    }

    /**
     * Update form buttons based on edit mode (safe DOM methods)
     * @param {boolean} isEditing - Whether in edit mode
     */
    function updateFormButtons(isEditing) {
        const formContainer = document.getElementById('channel-creation-form');
        if (!formContainer) return;

        const buttonsRow = formContainer.querySelector('.row.mt-2 .col-md-12');
        if (!buttonsRow) return;

        // Clear existing buttons
        while (buttonsRow.firstChild) {
            buttonsRow.removeChild(buttonsRow.firstChild);
        }

        if (isEditing) {
            // Update button
            const updateBtn = document.createElement('button');
            updateBtn.type = 'button';
            updateBtn.className = 'btn btn-sm btn-primary';
            updateBtn.onclick = function() { MSChannelManager.addChannelFromForm(); };
            const updateIcon = document.createElement('i');
            updateIcon.className = 'fas fa-save';
            updateBtn.appendChild(updateIcon);
            updateBtn.appendChild(document.createTextNode(' Update Channel'));
            buttonsRow.appendChild(updateBtn);

            // Cancel button
            const cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.className = 'btn btn-sm btn-secondary';
            cancelBtn.style.marginLeft = '5px';
            cancelBtn.onclick = function() { MSChannelManager.cancelEdit(); };
            const cancelIcon = document.createElement('i');
            cancelIcon.className = 'fas fa-times';
            cancelBtn.appendChild(cancelIcon);
            cancelBtn.appendChild(document.createTextNode(' Cancel'));
            buttonsRow.appendChild(cancelBtn);
        } else {
            // Add button
            const addBtn = document.createElement('button');
            addBtn.type = 'button';
            addBtn.className = 'btn btn-sm btn-success';
            addBtn.onclick = function() { MSChannelManager.addChannelFromForm(); };
            const addIcon = document.createElement('i');
            addIcon.className = 'fas fa-plus';
            addBtn.appendChild(addIcon);
            addBtn.appendChild(document.createTextNode(' Add Channel'));
            buttonsRow.appendChild(addBtn);

            // Reset button
            const resetBtn = document.createElement('button');
            resetBtn.type = 'button';
            resetBtn.className = 'btn btn-sm btn-secondary';
            resetBtn.style.marginLeft = '5px';
            resetBtn.onclick = function() { MSChannelManager.resetChannelForm(); };
            const resetIcon = document.createElement('i');
            resetIcon.className = 'fas fa-undo';
            resetBtn.appendChild(resetIcon);
            resetBtn.appendChild(document.createTextNode(' Reset'));
            buttonsRow.appendChild(resetBtn);
        }
    }

    /**
     * Highlight the row being edited
     * @param {number} index - Row index to highlight
     */
    function highlightEditingRow(index) {
        clearRowHighlights();
        const row = document.getElementById(`channel-row-${index}`);
        if (row) {
            row.style.backgroundColor = '#fff3cd';
            row.style.transition = 'background-color 0.3s';
        }
    }

    /**
     * Clear all row highlights
     */
    function clearRowHighlights() {
        currentChannels.forEach((_, idx) => {
            const row = document.getElementById(`channel-row-${idx}`);
            if (row) {
                row.style.backgroundColor = '';
            }
        });
    }

    /**
     * Delete channel UI handler
     * @param {number} index - Channel index
     */
    function deleteChannelUI(index) {
        if (confirm(`Remove channel ${currentChannels[index].channel_name}?`)) {
            removeChannel(index);
            renderChannelsTable('ms-channels-table');
        }
    }

    /**
     * Load channels from server for existing instrument
     * @param {number} instrumentId - Instrument ID
     * @returns {Promise<array>} - Array of channels
     */
    async function loadChannelsFromServer(instrumentId) {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`/api/channels?instrument_id=${instrumentId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Failed to load channels');
            }

            const data = await response.json();
            currentChannels = data.channels || [];
            console.log(`✅ Loaded ${currentChannels.length} channels from server`);
            return currentChannels;

        } catch (error) {
            console.error('❌ Error loading channels:', error);
            return [];
        }
    }

    /**
     * Save channels to server
     * @param {number} instrumentId - Instrument ID
     * @returns {Promise<boolean>} - Success status
     */
    async function saveChannelsToServer(instrumentId) {
        try {
            const token = localStorage.getItem('authToken');
            const promises = [];

            for (const channel of currentChannels) {
                const channelData = {
                    instrument_id: instrumentId,
                    ...channel
                };

                const promise = fetch('/api/channels', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(channelData)
                });

                promises.push(promise);
            }

            const results = await Promise.all(promises);
            const allSuccess = results.every(r => r.ok);

            if (allSuccess) {
                console.log(`✅ Saved ${currentChannels.length} channels to server`);
            } else {
                console.error('❌ Some channels failed to save');
            }

            return allSuccess;

        } catch (error) {
            console.error('❌ Error saving channels:', error);
            return false;
        }
    }

    // Public API
    return {
        init,
        getChannels,
        addChannel,
        updateChannel,
        removeChannel,
        clearChannels,
        renderChannelsTable,
        renderChannelForm,
        addChannelFromForm,
        resetChannelForm,
        editChannelUI,
        cancelEdit,
        deleteChannelUI,
        loadChannelsFromServer,
        saveChannelsToServer
    };
})();

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.MSChannelManager = MSChannelManager;
}
