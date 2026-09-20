// Phase 3: Add Memory Logic — Upload photo to Supabase Storage, then save record to DB

document.addEventListener('DOMContentLoaded', () => {

    const sb = window.supabaseClient;

    // --- DOM ELEMENTS ---
    const fabAdd = document.getElementById('fabAdd');
    const modal = document.getElementById('addMemoryModal');
    const cancelBtn = document.getElementById('cancelMemoryBtn');
    const memoryForm = document.getElementById('memoryForm');
    const photoDropZone = document.getElementById('photoDropZone');
    const photoInput = document.getElementById('photoInput');
    const photoPreview = document.getElementById('photoPreview');
    const moodSelector = document.getElementById('moodSelector');
    const statusMsg = document.getElementById('memoryStatusMsg');

    // Guard: only run on timeline page
    if (!fabAdd || !modal) return;

    let selectedMood = '';
    let selectedFile = null;
    let editingMemoryId = null; 
    let selectedLat = null;
    let selectedLng = null;
    let allMemories = []; // Source of truth for filtering

    // --- OPEN / CLOSE MODAL ---
    fabAdd.addEventListener('click', () => {
        editingMemoryId = null;
        document.querySelector('.modal-content h2').textContent = 'New Memory ✨';
        document.getElementById('saveMemoryBtn').textContent = 'Save Memory';
        modal.classList.remove('hidden');
    });

    cancelBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        resetForm();
    });

    // Close modal if clicking outside the form
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
            resetForm();
        }
    });

    // --- PHOTO UPLOAD ---
    photoDropZone.addEventListener('click', () => {
        photoInput.click();
    });

    photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        selectedFile = file;

        // Show preview
        const reader = new FileReader();
        reader.onload = (ev) => {
            photoPreview.src = ev.target.result;
            photoPreview.classList.remove('hidden');
            photoDropZone.innerHTML = '<span class="upload-icon">✅</span><span>Photo selected! Click to change.</span>';
        };
        reader.readAsDataURL(file);
    });

    // --- MOOD SELECTOR ---
    moodSelector.addEventListener('click', (e) => {
        const pill = e.target.closest('.mood-pill');
        if (!pill) return;

        // Deselect all, then select clicked one
        document.querySelectorAll('.mood-pill').forEach(p => p.classList.remove('selected'));
        pill.classList.add('selected');
        selectedMood = pill.dataset.mood;
    });

    // --- LOCATION AUTOCOMPLETE (OpenStreetMap Nominatim) ---
    const locationInput = document.getElementById('memoryLocation');
    const locationSuggestions = document.getElementById('locationSuggestions');
    let debounceTimer;

    locationInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const query = e.target.value.trim();
        if (query.length < 3) {
            locationSuggestions.classList.add('hidden');
            return;
        }

        debounceTimer = setTimeout(async () => {
            try {
                // Fetch from free OpenStreetMap API
                const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`);
                const results = await response.json();
                
                locationSuggestions.innerHTML = '';
                if (results.length > 0) {
                    locationSuggestions.classList.remove('hidden');
                    results.forEach(place => {
                        const li = document.createElement('li');
                        const addr = place.address || {};
                        const mainName = place.name || addr.road || addr.city || addr.town || 'Location';
                        const subName = [addr.city || addr.town, addr.state, addr.country].filter(Boolean).join(', ');
                        
                        li.innerHTML = `<span>📍</span> <div>${mainName} <br><span>${subName}</span></div>`;
                        li.addEventListener('click', () => {
                            locationInput.value = mainName + (addr.city ? ', ' + addr.city : '');
                            selectedLat = place.lat;
                            selectedLng = place.lon;
                            locationSuggestions.classList.add('hidden');
                        });
                        locationSuggestions.appendChild(li);
                    });
                } else {
                    locationSuggestions.classList.add('hidden');
                }
            } catch(error) {
                console.error("Location search failed", error);
            }
        }, 500); // Wait 500ms after they stop typing
    });

    // Close location dropdown if clicking anywhere else
    document.addEventListener('click', (e) => {
        if (!locationInput.contains(e.target) && !locationSuggestions.contains(e.target)) {
            locationSuggestions.classList.add('hidden');
        }
    });

    // --- FORM SUBMIT: SAVE OR UPDATE MEMORY TO CLOUD ---
    memoryForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const saveBtn = document.getElementById('saveMemoryBtn');

        if (!editingMemoryId && !selectedFile) {
            showMemoryStatus('Please upload a photo of your date!', 'error');
            return;
        }
        if (!selectedMood) {
            showMemoryStatus('Please select a mood!', 'error');
            return;
        }

        // Disable button while saving
        saveBtn.disabled = true;
        saveBtn.textContent = editingMemoryId ? 'Updating...' : 'Uploading...';

        try {
            // 1. Get current user
            const { data: { user } } = await sb.auth.getUser();

            // Build the base update payload (no photo yet)
            const payload = {
                date: document.getElementById('memoryDate').value,
                caption: document.getElementById('memoryCaption').value,
                location_name: document.getElementById('memoryLocation').value,
                location_lat: selectedLat,
                location_lng: selectedLng,
                mood: selectedMood,
            };

            // 2. If a new photo was selected, upload it
            if (selectedFile) {
                const compressedFile = await compressImage(selectedFile, 1200, 0.7);
                const fileName = `${user.email}/${Date.now()}_${selectedFile.name}`;
                const { error: uploadError } = await sb.storage
                    .from('memory-photos')
                    .upload(fileName, compressedFile);

                if (uploadError) throw uploadError;

                const { data: urlData } = sb.storage
                    .from('memory-photos')
                    .getPublicUrl(fileName);

                payload.photo_url = urlData.publicUrl;
            }

            // 3. INSERT or UPDATE depending on mode
            if (editingMemoryId) {
                // EDIT MODE: update the existing row
                const { error: updateError } = await sb
                    .from('memories')
                    .update(payload)
                    .eq('id', editingMemoryId);

                if (updateError) throw updateError;
                showMemoryStatus('Memory updated! 💕', 'success');
            } else {
                // ADD MODE: insert a brand new row
                payload.user_id = user.id;
                const { error: insertError } = await sb.from('memories').insert(payload);
                if (insertError) throw insertError;
                showMemoryStatus('Memory saved to the cloud! 💕', 'success');
            }

            setTimeout(() => {
                modal.classList.add('hidden');
                resetForm();
                loadTimeline();
            }, 1200);

        } catch (err) {
            console.error('Save error:', err);
            showMemoryStatus('Error: ' + err.message, 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = editingMemoryId ? 'Update Memory' : 'Save Memory';
        }
    });

    // --- UTILITY: SHOW STATUS MESSAGE ---
    function showMemoryStatus(msg, type) {
        statusMsg.textContent = msg;
        statusMsg.className = 'status-message ' + type;
        statusMsg.classList.remove('hidden');
    }

    // --- COMPRESS IMAGE UTILITY ---
    function compressImage(file, maxWidth, quality) {
        return new Promise((resolve) => {
            const img = new Image();
            const reader = new FileReader();

            reader.onload = (e) => {
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Scale down if too wide
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        resolve(blob);
                    }, 'image/jpeg', quality);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // --- RESET FORM ---
    function resetForm() {
        memoryForm.reset();
        selectedFile = null;
        selectedMood = '';
        editingMemoryId = null;
        selectedLat = null;
        selectedLng = null;
        photoPreview.classList.add('hidden');
        photoPreview.src = '';
        photoDropZone.innerHTML = '<span class="upload-icon">📷</span><span>Click to upload a photo</span>';
        document.querySelectorAll('.mood-pill').forEach(p => p.classList.remove('selected'));
        statusMsg.classList.add('hidden');
        statusMsg.textContent = '';
        document.querySelector('.modal-content h2').textContent = 'New Memory ✨';
        document.getElementById('saveMemoryBtn').textContent = 'Save Memory';
    }

    // --- LOAD TIMELINE & DASHBOARD ---
    async function loadTimeline() {
        const timeline = document.getElementById('timeline');
        timeline.innerHTML = '<div class="empty-state">Loading timeline...</div>';

        // Fetch memories ordered chronologically
        const { data: memories, error } = await sb
            .from('memories')
            .select('*')
            .order('date', { ascending: true });

        if (error) {
            console.error('Load error:', error);
            timeline.innerHTML = '<div class="empty-state">Error loading timeline. Please refresh.</div>';
            return;
        }

        allMemories = memories || [];
        
        const dashboard = document.getElementById('dashboardHeader');
        if (allMemories.length > 0) {
            dashboard.classList.remove('hidden');
            updateDashboard(allMemories);
        } else {
            dashboard.classList.add('hidden');
        }

        renderTimelineCards(allMemories);
    }

    function updateDashboard(memArray) {
        // Update Stats counts
        document.getElementById('statMemories').textContent = memArray.length;
        const uniqueCities = new Set(memArray.map(m => m.location_name).filter(Boolean)).size;
        document.getElementById('statCities').textContent = uniqueCities;

        // Build Year Dropdown dynamically based on data
        const yearFilter = document.getElementById('yearFilter');
        const currentSelection = yearFilter.value;
        const years = [...new Set(memArray.map(m => new Date(m.date).getFullYear()))].sort().reverse();
        
        yearFilter.innerHTML = '<option value="All">All Years</option>';
        years.forEach(y => {
            yearFilter.innerHTML += `<option value="${y}">${y}</option>`;
        });
        
        // Preserve selection or default back to All
        yearFilter.value = currentSelection !== 'All' && years.includes(parseInt(currentSelection)) ? currentSelection : 'All';
    }

    function renderTimelineCards(memoriesToRender) {
        const timeline = document.getElementById('timeline');
        timeline.innerHTML = '';

        if (memoriesToRender.length === 0) {
            // Re-inject a clean empty state
            timeline.innerHTML = `
                <div class="empty-state" id="emptyState">
                    <h2>No memories found 💕</h2>
                    <p>Try changing your search or year filter!</p>
                </div>
            `;
            return;
        }

        memoriesToRender.forEach(mem => {
            const card = document.createElement('div');
            card.className = 'memory-card';
            card.innerHTML = `
                <div class="card-photo-wrapper">
                    <img src="${mem.photo_url}" alt="${mem.caption}" class="card-photo">
                </div>
                <div class="card-body">
                    <div class="card-date">${mem.mood} ${new Date(mem.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    <div class="card-caption">${mem.caption}</div>
                    <div class="card-location">📍 ${mem.location_name}</div>
                    <div class="card-actions">
                        <button class="btn-card-action btn-edit" data-id="${mem.id}" data-json='${JSON.stringify(mem).replace(/'/g, "&#39;")}'>Edit</button>
                        <button class="btn-card-action btn-delete" data-id="${mem.id}">Delete</button>
                    </div>
                </div>
            `;
            timeline.appendChild(card);
        });

        // Event Listeners for new buttons
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const memoryId = e.target.getAttribute('data-id');
                if (window.confirm("Are you sure you want to permanently delete this beautiful memory?")) {
                    e.target.textContent = 'Deleting...';
                    await sb.from('memories').delete().eq('id', memoryId);
                    loadTimeline(); // Reload everything from db
                }
            });
        });

        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mem = JSON.parse(e.target.getAttribute('data-json'));
                editingMemoryId = mem.id;
                document.getElementById('memoryDate').value = mem.date;
                document.getElementById('memoryCaption').value = mem.caption;
                document.getElementById('memoryLocation').value = mem.location_name;
                selectedLat = mem.location_lat || null;
                selectedLng = mem.location_lng || null;
                document.querySelectorAll('.mood-pill').forEach(p => {
                    p.classList.toggle('selected', p.dataset.mood === mem.mood);
                });
                selectedMood = mem.mood;
                photoPreview.src = mem.photo_url;
                photoPreview.classList.remove('hidden');
                document.getElementById('photoDropZone').innerHTML = '<span class="upload-icon">🔄</span><span>Keep current photo</span>';
                document.querySelector('.modal-content h2').textContent = 'Edit Memory ✏️';
                document.getElementById('saveMemoryBtn').textContent = 'Update Memory';
                modal.classList.remove('hidden');
            });
        });
    }

    // Filtering Logic
    const searchFilter = document.getElementById('searchFilter');
    const yearFilter = document.getElementById('yearFilter');

    function applyFilters() {
        const term = searchFilter.value.toLowerCase();
        const year = yearFilter.value;

        const filtered = allMemories.filter(mem => {
            const memYear = new Date(mem.date).getFullYear().toString();
            const textMatch = (mem.caption || '').toLowerCase().includes(term) || (mem.location_name || '').toLowerCase().includes(term);
            const yearMatch = year === 'All' || year === memYear;
            return textMatch && yearMatch;
        });
        
        renderTimelineCards(filtered);
    }

    searchFilter.addEventListener('input', applyFilters);
    yearFilter.addEventListener('change', applyFilters);

    // Initial Load
    loadTimeline();
});
