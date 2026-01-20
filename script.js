// Supabase Configuration
const SUPABASE_URL = 'https://mzudginblcypyklwkjuh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16dWRnaW5ibGN5cHlrbHdranVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMzMxMTAsImV4cCI6MjA4MzcwOTExMH0.fDvPIwMg_cGYw9nrdrRaMCfmWtN04XbKv8DGM5Ws_es';
const STORAGE_BUCKET = 'note-images'; // Make sure to create this bucket in Supabase

// Initialize Supabase client
let supabaseClient;
try {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (error) {
    console.error('Error initializing Supabase:', error);
}

// State
let selectedImages = [];
let existingImageUrls = []; // For edit mode
let currentEditingNoteId = null;
let currentViewNote = null;

// DOM Elements - Create Modal
const modal = document.getElementById('noteModal');
const modalTitle = document.getElementById('modalTitle');
const openModalBtn = document.getElementById('openModal');
const closeBtn = document.querySelector('.close');
const noteTitle = document.getElementById('noteTitle');
const noteText = document.getElementById('noteText');
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const saveNoteBtn = document.getElementById('saveNote');
const notesList = document.getElementById('notesList');

// DOM Elements - View Modal
const viewModal = document.getElementById('viewModal');
const closeViewBtn = document.querySelector('.close-view');
const viewTitle = document.getElementById('viewTitle');
const viewDate = document.getElementById('viewDate');
const viewText = document.getElementById('viewText');
const viewImages = document.getElementById('viewImages');
const copyNoteBtn = document.getElementById('copyNote');
const editNoteBtn = document.getElementById('editNote');

// Create Modal Controls
openModalBtn.onclick = () => {
    currentEditingNoteId = null;
    modalTitle.textContent = 'Create New Note';
    saveNoteBtn.textContent = 'Save Note';
    modal.style.display = 'block';
};

closeBtn.onclick = () => {
    modal.style.display = 'none';
    clearForm();
};

// View Modal Controls
closeViewBtn.onclick = () => {
    viewModal.style.display = 'none';
    currentViewNote = null;
};

window.onclick = (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
        clearForm();
    }
    if (event.target === viewModal) {
        viewModal.style.display = 'none';
        currentViewNote = null;
    }
};

// Clear Form
function clearForm() {
    noteTitle.value = '';
    noteText.value = '';
    selectedImages = [];
    existingImageUrls = [];
    currentEditingNoteId = null;
    imagePreview.innerHTML = '';
    imageInput.value = '';
}

// Image Compression Function
async function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                let width = img.width;
                let height = img.height;
                const maxSize = 1920;
                
                if (width > height && width > maxSize) {
                    height = (height * maxSize) / width;
                    width = maxSize;
                } else if (height > maxSize) {
                    width = (width * maxSize) / height;
                    height = maxSize;
                }
                
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to compress image'));
                    }
                }, 'image/jpeg', 0.9);
            };
            
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = e.target.result;
        };
        
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

// Upload Image to Supabase Storage
async function uploadImageToStorage(blob, filename) {
    try {
        const timestamp = Date.now();
        const uniqueFilename = `${timestamp}_${filename}`;
        
        const { data, error } = await supabaseClient
            .storage
            .from(STORAGE_BUCKET)
            .upload(uniqueFilename, blob, {
                contentType: 'image/jpeg',
                cacheControl: '3600',
                upsert: false
            });
        
        if (error) throw error;
        
        // Get public URL
        const { data: urlData } = supabaseClient
            .storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(uniqueFilename);
        
        return urlData.publicUrl;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
}

// Delete Image from Supabase Storage
async function deleteImageFromStorage(imageUrl) {
    try {
        // Extract filename from URL
        const urlParts = imageUrl.split('/');
        const filename = urlParts[urlParts.length - 1];
        
        const { error } = await supabaseClient
            .storage
            .from(STORAGE_BUCKET)
            .remove([filename]);
        
        if (error) throw error;
    } catch (error) {
        console.error('Error deleting image:', error);
    }
}

// Handle Image Selection
imageInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    
    for (const file of files) {
        if (file.type.startsWith('image/')) {
            try {
                const compressedBlob = await compressImage(file);
                const previewUrl = URL.createObjectURL(compressedBlob);
                
                selectedImages.push({
                    blob: compressedBlob,
                    filename: file.name,
                    previewUrl: previewUrl
                });
                
                const previewDiv = document.createElement('div');
                previewDiv.className = 'preview-item';
                
                const img = document.createElement('img');
                img.src = previewUrl;
                
                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-image';
                removeBtn.textContent = '×';
                removeBtn.onclick = () => {
                    const index = selectedImages.findIndex(i => i.previewUrl === previewUrl);
                    if (index > -1) {
                        URL.revokeObjectURL(selectedImages[index].previewUrl);
                        selectedImages.splice(index, 1);
                    }
                    previewDiv.remove();
                };
                
                previewDiv.appendChild(img);
                previewDiv.appendChild(removeBtn);
                imagePreview.appendChild(previewDiv);
            } catch (error) {
                console.error('Error compressing image:', error);
                alert('Error processing image: ' + file.name);
            }
        }
    }
    
    imageInput.value = '';
});

// Save Note
saveNoteBtn.addEventListener('click', async () => {
    const title = noteTitle.value.trim();
    const text = noteText.value.trim();
    
    if (!title) {
        alert('Please add a title to your note');
        return;
    }
    
    if (!text && selectedImages.length === 0 && existingImageUrls.length === 0) {
        alert('Please add some text or images to your note');
        return;
    }
    
    try {
        saveNoteBtn.textContent = currentEditingNoteId ? 'Updating...' : 'Saving...';
        saveNoteBtn.disabled = true;
        
        // Upload new images to storage
        const uploadedUrls = [];
        for (const image of selectedImages) {
            const url = await uploadImageToStorage(image.blob, image.filename);
            uploadedUrls.push(url);
        }
        
        // Combine existing and new image URLs
        const allImageUrls = [...existingImageUrls, ...uploadedUrls];
        
        const noteData = {
            title: title,
            text: text,
            images: allImageUrls,
            updated_at: new Date().toISOString()
        };
        
        if (currentEditingNoteId) {
            // Update existing note
            const { data, error } = await supabaseClient
                .from('notes')
                .update(noteData)
                .eq('id', currentEditingNoteId)
                .select();
            
            if (error) throw error;
        } else {
            // Create new note
            noteData.created_at = new Date().toISOString();
            const { data, error } = await supabaseClient
                .from('notes')
                .insert([noteData])
                .select();
            
            if (error) throw error;
        }
        
        modal.style.display = 'none';
        clearForm();
        await loadNotes();
        
        saveNoteBtn.textContent = 'Save Note';
        saveNoteBtn.disabled = false;
    } catch (error) {
        console.error('Error saving note:', error);
        alert('Error saving note: ' + error.message);
        saveNoteBtn.textContent = currentEditingNoteId ? 'Update Note' : 'Save Note';
        saveNoteBtn.disabled = false;
    }
});

// Edit Note
editNoteBtn.addEventListener('click', async () => {
    if (!currentViewNote) return;
    
    // Close view modal
    viewModal.style.display = 'none';
    
    // Open edit modal
    currentEditingNoteId = currentViewNote.id;
    modalTitle.textContent = 'Edit Note';
    saveNoteBtn.textContent = 'Update Note';
    
    noteTitle.value = currentViewNote.title;
    noteText.value = currentViewNote.text || '';
    
    // Load existing images
    existingImageUrls = currentViewNote.images || [];
    imagePreview.innerHTML = '';
    
    for (const imageUrl of existingImageUrls) {
        const previewDiv = document.createElement('div');
        previewDiv.className = 'preview-item';
        
        const img = document.createElement('img');
        img.src = imageUrl;
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-image';
        removeBtn.textContent = '×';
        removeBtn.onclick = async () => {
            const index = existingImageUrls.indexOf(imageUrl);
            if (index > -1) {
                existingImageUrls.splice(index, 1);
            }
            previewDiv.remove();
        };
        
        previewDiv.appendChild(img);
        previewDiv.appendChild(removeBtn);
        imagePreview.appendChild(previewDiv);
    }
    
    modal.style.display = 'block';
});

// View Note
function viewNote(note) {
    currentViewNote = note;
    viewTitle.textContent = note.title;
    viewDate.textContent = new Date(note.created_at).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    viewText.textContent = note.text || 'No text content';
    
    if (note.images && note.images.length > 0) {
        viewImages.innerHTML = note.images.map((img, index) => `
            <div class="view-image-container">
                <img src="${img}" alt="Note image ${index + 1}" onclick="window.open('${img}', '_blank')">
                <button class="download-image-btn" onclick="downloadImage('${img}', '${note.title}_image_${index + 1}.jpg')">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M10 3v10m0 0l-3-3m3 3l3-3M4 17h12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
        `).join('');
    } else {
        viewImages.innerHTML = '';
    }
    
    viewModal.style.display = 'block';
}

// Download Image
async function downloadImage(url, filename) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
    } catch (error) {
        console.error('Error downloading image:', error);
        alert('Failed to download image');
    }
}

// Copy Note Content (text only, not title)
copyNoteBtn.addEventListener('click', () => {
    if (!currentViewNote) return;
    
    const copyText = currentViewNote.text || '';
    
    if (!copyText) {
        alert('No text content to copy');
        return;
    }
    
    navigator.clipboard.writeText(copyText).then(() => {
        const originalText = copyNoteBtn.innerHTML;
        copyNoteBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M13 4L6 11L3 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Copied!
        `;
        
        setTimeout(() => {
            copyNoteBtn.innerHTML = originalText;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Failed to copy note content');
    });
});

// Load Notes
async function loadNotes() {
    notesList.innerHTML = '<div class="loading">Loading notes...</div>';
    
    try {
        const { data, error } = await supabaseClient
            .from('notes')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        displayNotes(data);
    } catch (error) {
        console.error('Error loading notes:', error);
        notesList.innerHTML = `
            <div class="loading">
                <div class="error-message">
                    Error loading notes: ${error.message}<br><br>
                    Please check your Supabase configuration.
                </div>
            </div>
        `;
    }
}

// Display Notes
function displayNotes(notes) {
    if (!notes || notes.length === 0) {
        notesList.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style="margin-bottom: 1rem;">
                    <rect x="12" y="8" width="40" height="48" rx="4" stroke="currentColor" stroke-width="2"/>
                    <line x1="20" y1="20" x2="44" y2="20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    <line x1="20" y1="28" x2="44" y2="28" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    <line x1="20" y1="36" x2="36" y2="36" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <h3>No notes yet</h3>
                <p>Click "New Note" to create your first note</p>
            </div>
        `;
        return;
    }
    
    notesList.innerHTML = notes.map(note => `
        <div class="note-card" onclick='viewNoteById("${note.id}")'>
            <div class="note-card-header">
                <div class="note-card-title">${escapeHtml(note.title)}</div>
                <div class="note-card-date">${formatDate(note.created_at)}</div>
            </div>
            ${note.text ? `<div class="note-card-content">${escapeHtml(note.text)}</div>` : ''}
            ${note.images && note.images.length > 0 ? `
                <div class="note-card-images">
                    ${note.images.slice(0, 3).map(img => `<img src="${img}" alt="Note image">`).join('')}
                    ${note.images.length > 3 ? `<div style="color: var(--text-secondary); font-size: 0.75rem;">+${note.images.length - 3} more</div>` : ''}
                </div>
            ` : ''}
            <div class="note-card-footer">
                <button class="btn-view" onclick='event.stopPropagation(); viewNoteById("${note.id}")'>View</button>
                <button class="btn-delete" onclick='event.stopPropagation(); deleteNote("${note.id}")'>Delete</button>
            </div>
        </div>
    `).join('');
}

// View Note by ID
async function viewNoteById(id) {
    try {
        const { data, error } = await supabaseClient
            .from('notes')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        if (data) viewNote(data);
    } catch (error) {
        console.error('Error loading note:', error);
        alert('Error loading note');
    }
}

// Format Date
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Delete Note
async function deleteNote(id) {
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    try {
        // Get note to delete images from storage
        const { data: note, error: fetchError } = await supabaseClient
            .from('notes')
            .select('*')
            .eq('id', id)
            .single();
        
        if (fetchError) throw fetchError;
        
        // Delete images from storage
        if (note.images && note.images.length > 0) {
            for (const imageUrl of note.images) {
                await deleteImageFromStorage(imageUrl);
            }
        }
        
        // Delete note from database
        const { error } = await supabaseClient
            .from('notes')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        await loadNotes();
    } catch (error) {
        console.error('Error deleting note:', error);
        alert('Error deleting note: ' + error.message);
    }
}

// Make functions available globally
window.viewNoteById = viewNoteById;
window.deleteNote = deleteNote;
window.downloadImage = downloadImage;

// Initialize app
if (!SUPABASE_URL.includes('supabase') || !SUPABASE_ANON_KEY.includes('eyJ')) {
    notesList.innerHTML = `
        <div class="loading">
            <div class="error-message">
                ⚠️ Please configure your Supabase credentials in script.js<br><br>
                Replace SUPABASE_URL and SUPABASE_ANON_KEY with your actual values.
            </div>
        </div>
    `;
} else {
    loadNotes();
}