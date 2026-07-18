// ===== Navigation Handler =====
document.addEventListener('DOMContentLoaded', () => {
  // Get all navigation elements
  const navLinks = document.querySelectorAll('[data-page]');
  const pages = document.querySelectorAll('.page');
  const editorTabs = document.querySelectorAll('.editor-tab');
  const fileItems = document.querySelectorAll('.file-item');
  
  // Navigate to page
  function navigateTo(pageId) {
    // Update URL hash
    window.location.hash = pageId === 'home' ? '' : pageId;
    
    // Hide all pages
    pages.forEach(page => page.classList.remove('active'));
    
    // Show target page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
      targetPage.classList.add('active');
    }
    
    // Update editor tabs
    editorTabs.forEach(tab => {
      tab.classList.remove('active');
      if (tab.dataset.page === pageId) {
        tab.classList.add('active');
      }
    });
    
    // Update sidebar file items
    fileItems.forEach(item => {
      item.classList.remove('active');
      if (item.dataset.page === pageId) {
        item.classList.add('active');
      }
    });
    
    // Scroll to top of content
    const editorContent = document.querySelector('.editor-content');
    if (editorContent) {
      editorContent.scrollTop = 0;
    }
  }
  
  // Add click handlers to all nav elements
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const pageId = link.dataset.page;
      navigateTo(pageId);
    });
  });
  
  // Handle initial page load from hash
  function handleHashChange() {
    const hash = window.location.hash.slice(1);
    const pageId = hash || 'home';
    navigateTo(pageId);
  }
  
  // Listen for hash changes
  window.addEventListener('hashchange', handleHashChange);
  
  // Initial load
  handleHashChange();
});

// ===== Copy to Clipboard =====
function copyToClipboard(text, label) {
  navigator.clipboard.writeText(text).then(() => {
    showToast(`${label} copied to clipboard`);
  }).catch(err => {
    console.error('Failed to copy:', err);
  });
}

// ===== Toast Notification =====
function showToast(message) {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');
  
  if (toast && toastMessage) {
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
}

// ===== Contact Form Handler =====
document.addEventListener('DOMContentLoaded', () => {
  const contactForm = document.getElementById('contact-form');
  
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const name = document.getElementById('contact-name').value;
      const message = document.getElementById('contact-message').value;
      
      // Create mailto link
      const subject = encodeURIComponent(`Portfolio Contact from ${name}`);
      const body = encodeURIComponent(message);
      const mailtoLink = `mailto:ghazalabaraki@gmail.com?subject=${subject}&body=${body}`;
      
      // Open email client
      window.location.href = mailtoLink;
      
      // Show confirmation
      showToast('Opening your email client...');
    });
  }
});

// ===== Smooth scroll for internal links =====
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    if (!anchor.dataset.page) {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href.length > 1) {
          e.preventDefault();
          const target = document.querySelector(href);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    }
  });
});

// ===== Animation on scroll (simple fade-in) =====
document.addEventListener('DOMContentLoaded', () => {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);
  
  // Add animation styles to animatable elements
  document.querySelectorAll('.card, .work-item, .jira-card, .diary-card, .polaroid').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });
});

