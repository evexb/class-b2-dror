import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, set, get, push, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBBsGt-aZ9YANbYBuPlHE0oaM7ambVbiZ4",
  authDomain: "class-b2-dror.firebaseapp.com",
  databaseURL: "https://class-b2-dror-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "class-b2-dror",
  storageBucket: "class-b2-dror.firebasestorage.app",
  messagingSenderId: "161665492053",
  appId: "1:161665492053:web:fcc68ed82703150ec520dc"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Menu toggle
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });
}

// Admin menu password
const adminMenuLink = document.getElementById('adminMenuLink');
if (adminMenuLink) {
  adminMenuLink.addEventListener('click', event => {
    event.preventDefault();
    const password = prompt('הכנס סיסמה למנהלת');
    if (password === '2026') {
      window.location.href = 'admin.html';
    } else {
      alert('סיסמה שגויה');
    }
  });
}

// Hero image – load from Firebase
const heroImage = document.getElementById('heroImage');
if (heroImage) {
  get(ref(db, 'heroImage')).then(snapshot => {
    if (snapshot.exists()) {
      heroImage.src = snapshot.val();
    }
  });
}

// Admin – save hero image to Firebase
const adminHeroImageInput = document.getElementById('adminHeroImageInput');
const adminSaveButton = document.getElementById('adminSaveButton');
const adminMessage = document.getElementById('adminMessage');

if (adminHeroImageInput && adminSaveButton && adminMessage) {
  adminSaveButton.addEventListener('click', () => {
    const file = adminHeroImageInput.files?.[0];
    if (!file) {
      adminMessage.textContent = 'בחרו תמונה תחילה';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        adminMessage.textContent = 'שומר...';
        set(ref(db, 'heroImage'), result).then(() => {
          adminMessage.textContent = 'התמונה נשמרה בהצלחה!';
          adminSaveButton.disabled = true;
          setTimeout(() => { window.location.href = 'index.html'; }, 800);
        });
      }
    };
    reader.readAsDataURL(file);
  });
}

// Admin – upload class images
const adminClassImagesInput = document.getElementById('adminClassImagesInput');
const adminClassImagesButton = document.getElementById('adminClassImagesButton');
const adminClassImagesMessage = document.getElementById('adminClassImagesMessage');

if (adminClassImagesInput && adminClassImagesButton && adminClassImagesMessage) {
  adminClassImagesButton.addEventListener('click', () => {
    const files = adminClassImagesInput.files;
    if (!files || files.length === 0) {
      adminClassImagesMessage.textContent = 'בחרו לפחות קובץ אחד';
      return;
    }
    get(ref(db, 'classImages')).then(snapshot => {
      const existing = snapshot.exists() ? snapshot.val() : [];
      const promises = Array.from(files).map(file => new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => { if (typeof reader.result === 'string') resolve(reader.result); };
        reader.readAsDataURL(file);
      }));
      Promise.all(promises).then(images => {
        set(ref(db, 'classImages'), existing.concat(images)).then(() => {
          adminClassImagesMessage.textContent = 'התמונות הועלו בהצלחה';
        });
      });
    });
  });
}

// Class images gallery – load from Firebase
const classImageGallery = document.getElementById('classImageGallery');
if (classImageGallery) {
  get(ref(db, 'classImages')).then(snapshot => {
    classImageGallery.innerHTML = '';
    const images = snapshot.exists() ? snapshot.val() : [];
    if (images.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'muted-text';
      empty.textContent = 'אין תמונות כרגע.';
      classImageGallery.appendChild(empty);
    } else {
      images.forEach(src => {
        const img = document.createElement('img');
        img.src = src;
        classImageGallery.appendChild(img);
      });
    }
  });
}

// Chat – real-time via Firebase, with name selection
const nameSection = document.getElementById('nameSection');
const nameForm = document.getElementById('nameForm');
const nameInput = document.getElementById('nameInput');
const chatSection = document.getElementById('chatSection');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatMessages = document.getElementById('chatMessages');

if (nameSection && nameForm && chatSection && chatForm && chatInput && chatMessages) {
  const savedName = localStorage.getItem('chat-username');
  if (savedName) {
    nameSection.style.display = 'none';
    chatSection.style.display = 'block';
  }

  nameForm.addEventListener('submit', event => {
    event.preventDefault();
    const name = nameInput.value.trim();
    if (!name) return;
    localStorage.setItem('chat-username', name);
    nameSection.style.display = 'none';
    chatSection.style.display = 'block';
    chatInput.focus();
  });

  onValue(ref(db, 'chat'), snapshot => {
    chatMessages.innerHTML = '';
    if (snapshot.exists()) {
      const messages = Object.values(snapshot.val()).sort((a, b) => a.timestamp - b.timestamp);
      messages.forEach(msg => {
        const div = document.createElement('div');
        div.className = 'chat-message';
        const nameEl = document.createElement('strong');
        nameEl.className = 'chat-name';
        nameEl.textContent = (msg.name || 'אנונימי') + ':';
        div.appendChild(nameEl);
        div.appendChild(document.createTextNode(' ' + msg.text));
        chatMessages.appendChild(div);
      });
    }
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });

  chatForm.addEventListener('submit', event => {
    event.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;
    const name = localStorage.getItem('chat-username') || 'אנונימי';
    push(ref(db, 'chat'), { text, name, timestamp: Date.now() });
    chatInput.value = '';
  });
}

// Activity links – admin save
const adminActivityLinksButton = document.getElementById('adminActivityLinksButton');
const adminScreencastLink = document.getElementById('adminScreencastLink');
const adminZoomLink = document.getElementById('adminZoomLink');
const adminGamesLink = document.getElementById('adminGamesLink');
const adminActivityLinksMessage = document.getElementById('adminActivityLinksMessage');

if (adminActivityLinksButton && adminScreencastLink && adminZoomLink && adminGamesLink) {
  get(ref(db, 'activityLinks')).then(snapshot => {
    if (snapshot.exists()) {
      const links = snapshot.val();
      if (links.screencast) adminScreencastLink.value = links.screencast;
      if (links.zoom) adminZoomLink.value = links.zoom;
      if (links.games) adminGamesLink.value = links.games;
    }
  });

  adminActivityLinksButton.addEventListener('click', () => {
    const screencast = adminScreencastLink.value.trim();
    const zoom = adminZoomLink.value.trim();
    const games = adminGamesLink.value.trim();
    if (!screencast && !zoom && !games) {
      adminActivityLinksMessage.textContent = 'הוסף לפחות קישור אחד';
      return;
    }
    set(ref(db, 'activityLinks'), { screencast, zoom, games }).then(() => {
      adminActivityLinksMessage.textContent = 'הקישורים נשמרו';
    });
  });
}

// Activity links – display
const screencastLinkDisplay = document.getElementById('screencastLinkDisplay');
const zoomLinkDisplay = document.getElementById('zoomLinkDisplay');
const gamesLinkDisplay = document.getElementById('gamesLinkDisplay');
const zoomLinkSection = document.getElementById('zoomLinkSection');

if (screencastLinkDisplay || zoomLinkDisplay || gamesLinkDisplay) {
  get(ref(db, 'activityLinks')).then(snapshot => {
    if (!snapshot.exists()) return;
    const links = snapshot.val();
    if (screencastLinkDisplay && links.screencast) {
      screencastLinkDisplay.href = links.screencast;
      screencastLinkDisplay.style.display = 'inline-block';
    }
    if (zoomLinkDisplay && zoomLinkSection && links.zoom) {
      zoomLinkDisplay.href = links.zoom;
      zoomLinkSection.style.display = 'block';
    }
    if (gamesLinkDisplay && links.games) {
      gamesLinkDisplay.href = links.games;
      gamesLinkDisplay.style.display = 'inline-block';
    }
  });
}
