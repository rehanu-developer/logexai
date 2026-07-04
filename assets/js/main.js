document.addEventListener('DOMContentLoaded', () => {
  const navbar = document.getElementById('navbar');
  const mobileBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const progress = document.getElementById('progress-bar');
  const revealEls = document.querySelectorAll('.reveal');

  // Scroll nav background
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');

    // Progress bar
    const pct = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
    progress.style.width = pct + '%';
  });

  // Initialize service card mouse tracking
  initializeServiceCards();

  // Mobile menu
  mobileBtn.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
  mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mobileMenu.classList.add('hidden')));

  // Smooth reveal animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  revealEls.forEach(el => observer.observe(el));

  // Smooth scroll anchors
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const targetId = a.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Contact form -> n8n webhook
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async e => {
      e.preventDefault();
      const form = e.target;
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn ? submitBtn.textContent : '';

      // Clear any prior inline error
      clearFieldErrors(form);

      // Per-field validation
      const nameVal = (form.elements['name']?.value || '').trim();
      const companyVal = (form.elements['company']?.value || '').trim();
      const urlVal = (form.elements['company_url']?.value || '').trim();
      const emailVal = (form.elements['email']?.value || '').trim();
      const serviceVal = (form.elements['service']?.value || '').trim();

      let hasError = false;

      if (!nameVal) {
        flagFieldError(form, 'name', 'Please enter your full name.');
        hasError = true;
      }
      if (!companyVal) {
        flagFieldError(form, 'company', 'Please enter your company name.');
        hasError = true;
      }
      const urlCheck = normalizeAndValidateUrl(urlVal);
      if (!urlVal) {
        flagFieldError(form, 'company_url', 'Please enter your company URL.');
        hasError = true;
      } else if (!urlCheck.valid) {
        flagFieldError(form, 'company_url', urlCheck.error || 'Please enter a valid URL (e.g. company.com, acme.io, linkedin.com/in/handle).');
        hasError = true;
      }
      if (!emailVal) {
        flagFieldError(form, 'email', 'Please enter your email address.');
        hasError = true;
      } else if (!isValidEmail(emailVal)) {
        flagFieldError(form, 'email', 'Please enter a valid email address.');
        hasError = true;
      }
      if (!serviceVal) {
        flagFieldError(form, 'service', 'Please choose a solution.');
        hasError = true;
      }

      if (hasError) {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
        }
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
      }

      const formData = {
        name: nameVal,
        company: companyVal,
        company_url: urlCheck.normalized,
        email: emailVal,
        service: serviceVal,
        message: (form.elements['message']?.value || '').trim()
      };

      try {
        const res = await fetch('https://n8n-job9c.ondigitalocean.app/webhook/logexai-website', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (res.ok) {
          form.reset();
        }
      } catch (err) {
        // Network error — submission didn't reach n8n, but we still acknowledge the user.
      } finally {
        showStatusPopup({ name: formData.name });
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
        }
      }
    });

    // Clear an inline error as soon as the user edits that field again
    contactForm.querySelectorAll('input, select, textarea').forEach(el => {
      el.addEventListener('input', () => clearFieldError(contactForm, el.name));
      el.addEventListener('change', () => clearFieldError(contactForm, el.name));
    });
  }

  // Wire up popup close interactions
  document.querySelectorAll('[data-popup-close]').forEach(el => {
    el.addEventListener('click', hideStatusPopup);
  });
  const popupEl = document.getElementById('status-popup');
  if (popupEl) {
    popupEl.addEventListener('click', e => {
      if (e.target === popupEl) hideStatusPopup();
    });
  }
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') hideStatusPopup();
  });

  // Initialize Particles
  initializeParticles();
});

// Service Cards Mouse Tracking
function initializeServiceCards() {
  const serviceCards = document.querySelectorAll('.service-modern');

  serviceCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      card.style.setProperty('--mouse-x', `${x}%`);
      card.style.setProperty('--mouse-y', `${y}%`);
    });

    card.addEventListener('mouseleave', () => {
      card.style.setProperty('--mouse-x', '50%');
      card.style.setProperty('--mouse-y', '50%');
    });
  });
}

// Particle System
function initializeParticles() {
  const createParticle = () => {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * window.innerWidth + 'px';
    particle.style.top = window.innerHeight + 'px';
    particle.style.width = particle.style.height = Math.random() * 6 + 3 + 'px';
    particle.style.opacity = Math.random() * 0.5 + 0.3;
    document.body.appendChild(particle);

    // Animate upward
    let pos = window.innerHeight;
    const speed = Math.random() * 2 + 1;
    const drift = (Math.random() - 0.5) * 50; // Horizontal drift

    const animate = () => {
      pos -= speed;
      particle.style.top = pos + 'px';
      particle.style.left = parseFloat(particle.style.left) + drift * 0.01 + 'px';

      if (pos < -10) {
        particle.remove();
      } else {
        requestAnimationFrame(animate);
      }
    };
    animate();
  };

  // Create particles periodically
  setInterval(createParticle, 3000);

  // Create initial particles
  for (let i = 0; i < 5; i++) {
    setTimeout(createParticle, i * 600);
  }
}

// Toggle Package Details (for the pricing section)
function togglePackageDetails(packageId) {
  const details = document.getElementById(packageId + '-details');
  const arrow = document.getElementById(packageId + '-arrow');
  
  if (details && arrow) {
    if (details.classList.contains('hidden')) {
      details.classList.remove('hidden');
      arrow.style.transform = 'rotate(180deg)';
    } else {
      details.classList.add('hidden');
      arrow.style.transform = 'rotate(0deg)';
    }
  }
}

// Helper Functions
function selectService(type) {
  const contactSection = document.getElementById('contact');
  const sel = document.querySelector('select[name="service"]');
  
  if (sel) {
    if (type === 'ragbot') {
      sel.value = 'adaptive-rag-assistant';
    } else if (type === 'social') {
      sel.value = 'ai-social-media-mentor';
    } else if (type === 'operations') {
      sel.value = 'custom-ai-systems';
    }
  }
  
  if (contactSection) {
    contactSection.scrollIntoView({ behavior: 'smooth' });
  }
}

function scrollToContact() {
  const contactSection = document.getElementById('contact');
  if (contactSection) {
    contactSection.scrollIntoView({ behavior: 'smooth' });
  }
}

function scrollToServices() {
  const servicesSection = document.getElementById('services');
  if (servicesSection) {
    servicesSection.scrollIntoView({ behavior: 'smooth' });
  }
}

// Add this function to handle the new service details toggle
function toggleServiceDetails(service) {
  const details = document.getElementById(`${service}-details`);
  const arrow = document.getElementById(`${service}-arrow`);
  
  if (details && arrow) {
    if (details.classList.contains('hidden')) {
      details.classList.remove('hidden');
      arrow.style.transform = 'rotate(180deg)';
    } else {
      details.classList.add('hidden');
      arrow.style.transform = 'rotate(0deg)';
    }
  }
}

function toggleFAQ(index) {
  const faqItems = document.querySelectorAll('.glass.rounded-2xl.overflow-hidden');
  if (faqItems[index]) {
    const item = faqItems[index];
    const content = item.querySelector('.faq-content');
    const icon = item.querySelector('.faq-icon');

    if (content && icon) {
      content.classList.toggle('hidden');
      icon.classList.toggle('rotate-180');
    }
  }
}

// Lead Form Submission Handler (for use case demo pages)
function handleLeadFormSubmit(event) {
  event.preventDefault();
  
  const form = event.target;
  const formData = new FormData(form);
  
  // In production, this would send data to your server
  console.log('Form submission data:', Object.fromEntries(formData));
  
  // Show success message
  alert('Demo submission received! In production, this would send your request to our AI system and you would receive an Excel sheet with extracted leads via email.');
  
  // Reset form
  form.reset();
  
  return false;
}

// Initialize lead forms on use case pages
document.addEventListener('DOMContentLoaded', () => {
  const leadForm = document.getElementById('leadForm');
  if (leadForm) {
    leadForm.addEventListener('submit', handleLeadFormSubmit);
  }
});

// Scroll to categories (for use-cases index page)
function scrollToCategories() {
  const categoriesSection = document.querySelector('section:nth-of-type(2)');
  if (categoriesSection) {
    categoriesSection.scrollIntoView({ behavior: 'smooth' });
  }
}

// Export functions for global use
window.togglePackageDetails = togglePackageDetails;
window.selectService = selectService;
window.scrollToContact = scrollToContact;
window.scrollToServices = scrollToServices;
window.toggleServiceDetails = toggleServiceDetails;
window.toggleFAQ = toggleFAQ;
window.handleLeadFormSubmit = handleLeadFormSubmit;
window.scrollToCategories = scrollToCategories;
window.showStatusPopup = showStatusPopup;
window.hideStatusPopup = hideStatusPopup;

// Popup helpers
function showStatusPopup({ name = '' } = {}) {
  const popup = document.getElementById('status-popup');
  if (!popup) return;

  const titleEl = popup.querySelector('#popup-title');
  const safeName = (name || '').toString().trim().split(/\s+/)[0] || 'friend';

  if (titleEl) {
    titleEl.innerHTML = 'Thank you, <span class="lime-text">' + escapeHtml(safeName) + '</span>!';
  }

  popup.classList.add('active');
  popup.setAttribute('aria-hidden', 'false');
}

function hideStatusPopup() {
  const popup = document.getElementById('status-popup');
  if (!popup) return;
  popup.classList.remove('active');
  popup.setAttribute('aria-hidden', 'true');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Field validation helpers
function isValidEmail(email) {
  // Simple, pragmatic email check
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeAndValidateUrl(input) {
  if (!input) {
    return { valid: false, normalized: '', error: 'URL is required.' };
  }

  let value = input.trim();

  // Strip scheme
  value = value.replace(/^https?:\/\//i, '');
  // Strip leading www.
  value = value.replace(/^www\./i, '');
  // Trim trailing slash + whitespace
  value = value.replace(/\/+$/, '').trim();

  if (!value) {
    return { valid: false, normalized: '', error: 'Please enter a valid URL.' };
  }

  // Disallow spaces
  if (/\s/.test(value)) {
    return { valid: false, normalized: value, error: 'URLs cannot contain spaces.' };
  }

  // Must contain a dot in the host (e.g. example.com, acme.io, site.org)
  // Allow paths/handles (linkedin.com/in/x, instagram.com/handle)
  const urlPattern = /^[A-Za-z0-9.-]+\.(com|io|org|net|co|ai|app|dev|us|uk|de|fr|ca|au|in|info|biz|tech|store|xyz|me|tv|gg|cloud|ai|so|it|es|nl|se|no|fi|dk|pl|ch|at|be|jp|cn|br|mx|ru|eu|africa|app|consulting|solutions|systems|company|biz|co\.uk|co\.in|co\.id|co\.za|com\.au|com\.br|com\.tr|org\.uk)(\/[A-Za-z0-9._~:/?#@!$&'()*+,;=%-]*)?$/i;

  const socialPattern = /^(linkedin\.com|instagram\.com|facebook\.com|x\.com|twitter\.com|github\.com|youtube\.com|tiktok\.com|medium\.com)(\/[A-Za-z0-9._~:/?#@!$&'()*+,;=%-]*)?$/i;

  if (urlPattern.test(value) || socialPattern.test(value)) {
    return { valid: true, normalized: value };
  }

  return {
    valid: false,
    normalized: value,
    error: 'Please enter a valid URL like company.com, acme.io, linkedin.com/in/handle, etc.'
  };
}

function flagFieldError(form, fieldName, message) {
  const el = form.elements[fieldName];
  if (!el) return;
  el.classList.add('field-error');

  // Remove any prior message for this field
  const prior = el.parentElement?.querySelector('.field-error-msg');
  if (prior) prior.remove();

  const msg = document.createElement('p');
  msg.className = 'field-error-msg';
  msg.textContent = message;
  // Insert after the input (or after the input wrapper if present)
  el.insertAdjacentElement('afterend', msg);
}

function clearFieldError(form, fieldName) {
  const el = form.elements[fieldName];
  if (!el) return;
  el.classList.remove('field-error');
  const msg = el.parentElement?.querySelector('.field-error-msg');
  if (msg) msg.remove();
}

function clearFieldErrors(form) {
  form.querySelectorAll('.field-error').forEach(el => el.classList.remove('field-error'));
  form.querySelectorAll('.field-error-msg').forEach(el => el.remove());
}