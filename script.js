function createStorageAdapter() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch (error) {
    console.warn('localStorage unavailable, using fallback storage', error);
  }

  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return window.sessionStorage;
    }
  } catch (error) {
    console.warn('sessionStorage unavailable, using window.name fallback', error);
  }

  return {
    data: {},
    getItem(key) {
      return this.data[key] ?? null;
    },
    setItem(key, value) {
      this.data[key] = value;
      if (typeof window !== 'undefined') {
        window.name = JSON.stringify(this.data);
      }
    },
    removeItem(key) {
      delete this.data[key];
      if (typeof window !== 'undefined') {
        window.name = JSON.stringify(this.data);
      }
    },
    clear() {
      this.data = {};
      if (typeof window !== 'undefined') {
        window.name = '{}';
      }
    }
  };
}

const storage = createStorageAdapter();

function readStoredValue(key, fallback = null) {
  const value = storage.getItem(key);
  return value === null ? fallback : value;
}

function writeStoredValue(key, value) {
  storage.setItem(key, String(value));
}

function readStoredJson(key, fallback = null) {
  const value = readStoredValue(key);
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn('Could not parse storage value for', key, error);
    return fallback;
  }
}

function writeStoredJson(key, value) {
  storage.setItem(key, JSON.stringify(value));
}

// Check if DOM is already loaded or add event listener
function initializeScripts() {
  const year = document.getElementById('year');
  if (year) {
    year.textContent = new Date().getFullYear();
  }

  const heroTitle = document.querySelector('.hero h1');
  if (heroTitle) {
    heroTitle.textContent = 'ברוכים הבאים לאתר של כיתה ב2';
  }

  const heroImage = document.getElementById('heroImage');

  if (heroImage) {
    const savedImage = readStoredValue('class-b2-hero-image');
    console.log('Checking for saved image:', savedImage ? 'Found (' + savedImage.length + ' bytes)' : 'Not found');
    if (savedImage) {
      heroImage.src = savedImage + '#' + Date.now();
      heroImage.onload = () => console.log('Image loaded successfully');
      heroImage.onerror = () => console.log('Error loading image');
    }
  }

  const adminMenuLink = document.getElementById('adminMenuLink');
  if (adminMenuLink) {
    adminMenuLink.addEventListener('click', (event) => {
      event.preventDefault();
      const password = prompt('הכנס סיסמה למנהלת');
      if (password === '2026') {
        window.location.href = 'admin.html';
      } else {
        alert('סיסמה שגויה');
      }
    });
  }

  const adminHeroImageInput = document.getElementById('adminHeroImageInput');
  const adminSaveButton = document.getElementById('adminSaveButton');
  const adminMessage = document.getElementById('adminMessage');
  const adminClassImagesInput = document.getElementById('adminClassImagesInput');
  const adminClassImagesButton = document.getElementById('adminClassImagesButton');
  const adminClassImagesMessage = document.getElementById('adminClassImagesMessage');

  if (adminHeroImageInput && adminSaveButton && adminMessage) {
    const handleHeroImageSave = () => {
      const file = adminHeroImageInput.files?.[0];
      if (!file) {
        adminMessage.textContent = 'בחרו תמונה תחילה';
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          writeStoredValue('class-b2-hero-image', result);
          adminMessage.textContent = 'התמונה נשמרה בהצלחה! מעדכן את העמוד...';
          adminSaveButton.disabled = true;
          console.log('Image saved to localStorage, size:', result.length);

          const heroImage = document.getElementById('heroImage');
          if (heroImage) {
            heroImage.src = result + '#' + Date.now();
          }

          setTimeout(() => {
            window.location.href = 'index.html?t=' + Date.now();
          }, 400);
        }
      };
      reader.readAsDataURL(file);
    };

    adminSaveButton.addEventListener('click', handleHeroImageSave);
    adminSaveButton.onclick = handleHeroImageSave;
  }

  if (adminClassImagesInput && adminClassImagesButton && adminClassImagesMessage) {
    adminClassImagesButton.addEventListener('click', () => {
      const files = adminClassImagesInput.files;
      if (!files || files.length === 0) {
        adminClassImagesMessage.textContent = 'בחרו לפחות קובץ אחד';
        return;
      }

      const existing = readStoredJson('class-b2-images', []);
      const promises = [];

      for (const file of files) {
        promises.push(new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              resolve(reader.result);
            }
          };
          reader.readAsDataURL(file);
        }));
      }

      Promise.all(promises).then((images) => {
        const allImages = existing.concat(images);
        writeStoredJson('class-b2-images', allImages);
        adminClassImagesMessage.textContent = 'התמונות הועלו בהצלחה';
      });
    });
  }

  const classImageGallery = document.getElementById('classImageGallery');
  if (classImageGallery) {
    const savedImages = readStoredJson('class-b2-images', []);
    classImageGallery.innerHTML = '';
    if (savedImages.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'muted-text';
      empty.textContent = 'אין תמונות כרגע.';
      classImageGallery.appendChild(empty);
    } else {
      savedImages.forEach((src) => {
        const img = document.createElement('img');
        img.src = src;
        classImageGallery.appendChild(img);
      });
    }
  }

  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const chatMessages = document.getElementById('chatMessages');

  if (chatForm && chatInput && chatMessages) {
    const storageKey = 'class-b2-chat-messages';
    const messages = readStoredJson(storageKey, []);

    const renderMessages = () => {
      chatMessages.innerHTML = '';
      messages.forEach((message) => {
        const item = document.createElement('div');
        item.className = `chat-message ${message.mine ? 'mine' : ''}`;
        item.textContent = message.text;
        chatMessages.appendChild(item);
      });
      chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    renderMessages();

    chatForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const text = chatInput.value.trim();
      if (!text) return;

      messages.push({ text, mine: true });
      writeStoredJson(storageKey, messages);
      chatInput.value = '';
      renderMessages();
    });
  }

  // Activity Links Management
  const adminActivityLinksButton = document.getElementById('adminActivityLinksButton');
  const adminScreencastLink = document.getElementById('adminScreencastLink');
  const adminZoomLink = document.getElementById('adminZoomLink');
  const adminGamesLink = document.getElementById('adminGamesLink');
  const adminActivityLinksMessage = document.getElementById('adminActivityLinksMessage');

  if (adminActivityLinksButton && adminScreencastLink && adminZoomLink && adminGamesLink && adminActivityLinksMessage) {
    const savedLinks = readStoredJson('class-b2-activity-links', {});
    if (savedLinks.screencast) adminScreencastLink.value = savedLinks.screencast;
    if (savedLinks.zoom) adminZoomLink.value = savedLinks.zoom;
    if (savedLinks.games) adminGamesLink.value = savedLinks.games;

    adminActivityLinksButton.addEventListener('click', () => {
      const screencast = adminScreencastLink.value.trim();
      const zoom = adminZoomLink.value.trim();
      const games = adminGamesLink.value.trim();

      if (!screencast && !zoom && !games) {
        adminActivityLinksMessage.textContent = 'הוסף לפחות קישור אחד';
        return;
      }

      const links = { screencast, zoom, games };
      writeStoredJson('class-b2-activity-links', links);
      adminActivityLinksMessage.textContent = 'הקישורים נשמרו';
    });
  }

  // Display Activity Links
  const screencastLinkDisplay = document.getElementById('screencastLinkDisplay');
  const zoomLinkDisplay = document.getElementById('zoomLinkDisplay');
  const gamesLinkDisplay = document.getElementById('gamesLinkDisplay');
  const zoomLinkSection = document.getElementById('zoomLinkSection');

  if (screencastLinkDisplay || zoomLinkDisplay || gamesLinkDisplay) {
    const savedLinks = readStoredJson('class-b2-activity-links', {});
    
    if (screencastLinkDisplay && savedLinks.screencast) {
      screencastLinkDisplay.href = savedLinks.screencast;
      screencastLinkDisplay.style.display = 'inline-block';
    }
    
    if (zoomLinkDisplay && zoomLinkSection && savedLinks.zoom) {
      zoomLinkDisplay.href = savedLinks.zoom;
      zoomLinkSection.style.display = 'block';
    }
    
    if (gamesLinkDisplay && savedLinks.games) {
      gamesLinkDisplay.href = savedLinks.games;
      gamesLinkDisplay.style.display = 'inline-block';
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeScripts);
} else {
  initializeScripts();
}

