/* assets/js/script.js
   Full shared script for Artify:
   - seed starter posts
   - get/save helpers
   - renderGallery + preview modal
   - upload handling (FileReader -> localStorage)
   - contact form handler
   - small UI helpers: auto-active nav, page fades and fade-out navigation
*/

/* ====== Keys ====== */
const POSTS_KEY = 'artify_posts_v2';
const MSGS_KEY = 'artify_msgs_v2';

/* ====== Seed starter posts (demo content) ====== */
function seed(){
  if(localStorage.getItem(POSTS_KEY)) return;
  const svg = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675">' +
    '<rect width="100%" height="100%" fill="#f3f4f6"/>' +
    '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9aa0a6" font-size="42">Starter Image</text>' +
    '</svg>'
  );
  const now = Date.now();
  const arr = [
    {id: now+1, type:'image', title:'Starter Poster', author:'Student', dataURL:svg, createdAt: now-12000, description:'Demo poster'},
    {id: now+2, type:'image', title:'Abstract Edit', author:'Student', dataURL:svg, createdAt: now-8000, description:'Practice edit'},
    {id: now+3, type:'image', title:'Cover Art', author:'Student', dataURL:svg, createdAt: now-4000, description:'Cover art sample'}
  ];
  localStorage.setItem(POSTS_KEY, JSON.stringify(arr));
}

/* ====== Helpers ====== */
function getPosts(){ try { return JSON.parse(localStorage.getItem(POSTS_KEY)) || []; } catch(e){ return []; } }
function savePosts(posts){ localStorage.setItem(POSTS_KEY, JSON.stringify(posts)); }
function escapeHtml(str=''){ return String(str).replace(/[&<>"'`=\/]/g, function(s){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#x2F;','`':'&#x60;'})[s]; }); }

/* ====== Render gallery grid ====== */
function renderGallery(filter=''){
  const grid = document.getElementById('galleryGrid');
  if(!grid) return;
  grid.innerHTML = '';

  const posts = getPosts();
  const filtered = posts.filter(p => {
    if(!filter) return true;
    const t = filter.toLowerCase();
    return ((p.title||'') + ' ' + (p.author||'') + ' ' + (p.description||'')).toLowerCase().includes(t);
  });

  if(filtered.length === 0){
    grid.innerHTML = '<div class="card-styled">No posts yet. Upload something below.</div>';
    return;
  }

  filtered.forEach(p => {
    const item = document.createElement('div');
    item.className = 'gallery-item';

    // media area
    const mediaHtml = p.type === 'image'
      ? `<img src="${p.dataURL}" class="gallery-thumb" alt="${escapeHtml(p.title)}">`
      : `<div style="height:160px;display:flex;align-items:center;justify-content:center;background:#fafafa;">
           <audio controls style="width:90%"><source src="${p.dataURL}" type="${p.mime||'audio/mpeg'}">Your browser doesn't support audio.</audio>
         </div>`;

    item.innerHTML = `
      ${mediaHtml}
      <div class="gallery-body">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <strong>${escapeHtml(p.title)}</strong>
            <div class="meta">by ${escapeHtml(p.author)} • ${new Date(p.createdAt).toLocaleString()}</div>
          </div>
          <div><button class="btn btn-sm btn-outline-secondary" data-id="${p.id}">Preview</button></div>
        </div>
        <p class="meta" style="margin-top:8px">${escapeHtml(p.description||'')}</p>
      </div>
    `;

    // attach preview handler
    const previewBtn = item.querySelector('button');
    if(previewBtn) previewBtn.addEventListener('click', ()=> openPreview(p.id));

    grid.appendChild(item);
  });
}

/* ====== Preview modal ====== */
function openPreview(id){
  const posts = getPosts();
  const p = posts.find(x => x.id === id);
  if(!p) return alert('Post not found');
  const body = document.getElementById('previewBody');
  if(!body) return;

  body.innerHTML = '';

  if(p.type === 'image'){
    body.innerHTML = `<img src="${p.dataURL}" style="width:100%;border-radius:8px">`;
  } else {
    body.innerHTML = `<audio controls style="width:100%"><source src="${p.dataURL}" type="${p.mime||'audio/mpeg'}"></audio>`;
  }

  const meta = document.createElement('div');
  meta.style.marginTop = '12px';
  meta.innerHTML = `<strong>${escapeHtml(p.title)}</strong><div class="muted">by ${escapeHtml(p.author)}</div><p class="muted" style="margin-top:8px">${escapeHtml(p.description||'')}</p>`;
  body.appendChild(meta);

  const modal = new bootstrap.Modal(document.getElementById('previewModal'));
  modal.show();
}

/* ====== Upload handling ====== */
function handleUploadForm(e){
  if(e) e.preventDefault();
  const fileInput = document.getElementById('uploadFile');
  if(!fileInput || !fileInput.files || fileInput.files.length === 0){
    alert('Please choose a file (image or audio).'); return;
  }
  const file = fileInput.files[0];

  if(!file.type.startsWith('image') && !file.type.startsWith('audio')){
    alert('Only image or audio files are allowed.'); return;
  }

  // size warning
  if(file.size > 2 * 1024 * 1024){
    if(!confirm('File is larger than 2MB — continue? (localStorage may fill up)')) return;
  }

  const title = (document.getElementById('uploadTitle')?.value || '').trim();
  const author = (document.getElementById('uploadAuthor')?.value || '').trim();
  const description = (document.getElementById('uploadDescription')?.value || '').trim();

  const reader = new FileReader();
  reader.onload = function(ev){
    const posts = getPosts();
    const post = {
      id: Date.now(),
      type: file.type.startsWith('audio') ? 'audio' : 'image',
      title: title || file.name,
      author: author || 'Anonymous',
      dataURL: ev.target.result,
      mime: file.type,
      description: description || '',
      createdAt: Date.now()
    };
    posts.unshift(post);
    savePosts(posts);

    // reset form and re-render
    const form = document.getElementById('uploadForm');
    if(form) form.reset();
    renderGallery(document.getElementById('searchInput')?.value || '');
    alert('Uploaded successfully — saved in browser storage.');
  };
  reader.onerror = function(){
    alert('Failed to read file.');
  };
  reader.readAsDataURL(file);
}

/* ====== Contact handler (basic) ====== */
function initContact(){
  const form = document.getElementById('contactForm');
  if(!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = (document.getElementById('contactName')?.value || '').trim();
    const email = (document.getElementById('contactEmail')?.value || '').trim();
    const message = (document.getElementById('contactMessage')?.value || '').trim();
    if(name.length < 2 || !/\S+@\S+\.\S+/.test(email) || message.length < 10){
      alert('Please enter valid details.'); return;
    }
    const msgs = JSON.parse(localStorage.getItem(MSGS_KEY) || '[]');
    msgs.unshift({id: Date.now(), name, email, message});
    localStorage.setItem(MSGS_KEY, JSON.stringify(msgs));
    form.reset();
    alert('Message saved locally (demo).');
  });
}

/* ====== Small helpers ====== */

// ensure seed runs
document.addEventListener('DOMContentLoaded', () => {
  seed();

  // If gallery grid exists on page, render
  if(document.getElementById('galleryGrid')) renderGallery('');

  // If upload form exists, attach handler (idempotent)
  const uploadForm = document.getElementById('uploadForm');
  if(uploadForm) {
    // remove any previous to avoid double-binding
    uploadForm.removeEventListener('submit', handleUploadForm);
    uploadForm.addEventListener('submit', handleUploadForm);
  }

  // Init contact if present
  initContact();
});

/* ---------- small UI helpers: nav active + page fade transitions ---------- */

/* add 'active' class to nav-link that matches current page filename */
(function autoSetActiveNav(){
  try {
    const path = location.pathname.split("/").pop() || 'index.html';
    const links = document.querySelectorAll('a.nav-link');
    links.forEach(a => {
      const href = (a.getAttribute('href') || '').split('/').pop();
      if(!href) return;
      if(href === path) a.classList.add('active');
      else a.classList.remove('active');
    });
  } catch(e){ /* silent */ }
})();

/* page fade in */
document.addEventListener('DOMContentLoaded', function(){
  const root = document.querySelector('main') || document.body;
  if(root){
    root.classList.add('page-fade');
    requestAnimationFrame(()=> setTimeout(()=> root.classList.add('page-visible'), 20));
  }

  // make internal navigations fade-out (preserve external links, hash links)
  document.querySelectorAll('a.nav-link, a.brand, a.btn').forEach(a=>{
    a.addEventListener('click', function(e){
      const href = a.getAttribute('href') || '';
      // skip external, mailto, hash or javascript links
      if(!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('#') || href.startsWith('javascript:')) return;
      e.preventDefault();
      const root = document.querySelector('main') || document.body;
      if(root) root.classList.remove('page-visible');
      setTimeout(()=> { location.href = href; }, 240);
    });
  });
});
