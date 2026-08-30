// src/main.js — Application Entry Point
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {
  initCustomCursor();
  initMobileNav();
  initActiveNavLink();
  initHeroAnimations();
  initScrollAnimations();
  initDossierModals();
  initTerminalForm();
});

// =============================================
// CUSTOM CURSOR
// =============================================
function initCustomCursor() {
  const cursor = document.querySelector('.custom-cursor');
  const cursorDot = document.querySelector('.custom-cursor-dot');
  if (!cursor || !cursorDot) return;

  let mouseX = 0, mouseY = 0;
  let cursorX = 0, cursorY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursorDot.style.left = `${mouseX}px`;
    cursorDot.style.top = `${mouseY}px`;
  });

  function animateCursor() {
    cursorX += (mouseX - cursorX) * 0.15;
    cursorY += (mouseY - cursorY) * 0.15;
    cursor.style.left = `${cursorX}px`;
    cursor.style.top = `${cursorY}px`;
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  const interactives = document.querySelectorAll('a, button, select, input, textarea, .interactive-item');
  interactives.forEach((el) => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
  });
}

// =============================================
// MOBILE NAVIGATION
// =============================================
function initMobileNav() {
  const burger = document.querySelector('.burger-menu');
  const navMenu = document.querySelector('.nav-menu');
  if (!burger || !navMenu) return;

  burger.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    const lines = burger.querySelectorAll('.burger-line');
    if (navMenu.classList.contains('active')) {
      lines[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
      lines[1].style.opacity = '0';
      lines[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
    } else {
      lines[0].style.transform = 'none';
      lines[1].style.opacity = '1';
      lines[2].style.transform = 'none';
    }
  });
}

// =============================================
// ACTIVE NAV LINK
// =============================================
function initActiveNavLink() {
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach((link) => {
    const href = link.getAttribute('href');
    if (currentPath.endsWith(href) || (currentPath === '/' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

// =============================================
// GSAP HERO ANIMATIONS
// =============================================
function initHeroAnimations() {
  const heroTelemetry = document.querySelector('.hero-telemetry');
  const heroTitle = document.querySelector('.hero-title');
  const heroSubtitle = document.querySelector('.hero-subtitle');
  const heroBtn = document.querySelector('.hero .btn');

  if (!heroTitle) return;

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  if (heroTelemetry) {
    tl.to(heroTelemetry, { opacity: 1, duration: 0.6, y: 0 }, 0.2);
  }
  tl.fromTo(heroTitle, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1 }, 0.4);
  if (heroSubtitle) {
    tl.fromTo(heroSubtitle, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8 }, 0.8);
  }
  if (heroBtn) {
    tl.fromTo(heroBtn, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, 1.1);
  }
}

// =============================================
// GSAP SCROLL-TRIGGERED ANIMATIONS
// =============================================
function initScrollAnimations() {
  // Timeline nodes
  gsap.utils.toArray('.timeline-step').forEach((step, i) => {
    gsap.from(step, {
      scrollTrigger: {
        trigger: step,
        start: 'top 85%',
      },
      opacity: 0,
      y: 50,
      duration: 0.8,
      delay: i * 0.15,
    });
  });

  // Classified cards
  gsap.utils.toArray('.classified-card').forEach((card, i) => {
    gsap.from(card, {
      scrollTrigger: {
        trigger: card,
        start: 'top 85%',
      },
      opacity: 0,
      y: 60,
      duration: 0.7,
      delay: i * 0.1,
    });
  });

  // Section headers
  gsap.utils.toArray('.section-header').forEach((header) => {
    gsap.from(header, {
      scrollTrigger: {
        trigger: header,
        start: 'top 85%',
      },
      opacity: 0,
      y: 30,
      duration: 0.8,
    });
  });

  // Spec items (about page)
  gsap.utils.toArray('.spec-item').forEach((item, i) => {
    gsap.from(item, {
      scrollTrigger: {
        trigger: item,
        start: 'top 85%',
      },
      opacity: 0,
      y: 40,
      duration: 0.7,
      delay: i * 0.15,
    });
  });

  // Protocol panels
  gsap.utils.toArray('.protocol-panel-content').forEach((panel) => {
    gsap.from(panel.children, {
      scrollTrigger: {
        trigger: panel,
        start: 'top 75%',
      },
      opacity: 0,
      y: 40,
      duration: 0.8,
      stagger: 0.15,
    });
  });

  // Editorial layout elements (about page)
  const editorialText = document.querySelector('.editorial-text');
  if (editorialText) {
    gsap.from(editorialText.children, {
      scrollTrigger: {
        trigger: editorialText,
        start: 'top 80%',
      },
      opacity: 0,
      y: 30,
      duration: 0.7,
      stagger: 0.12,
    });
  }

  const editorialVisual = document.querySelector('.editorial-visual');
  if (editorialVisual) {
    gsap.from(editorialVisual, {
      scrollTrigger: {
        trigger: editorialVisual,
        start: 'top 80%',
      },
      opacity: 0,
      x: 60,
      duration: 1,
    });
  }

  // Terminal container
  const terminalContainer = document.querySelector('.terminal-container');
  if (terminalContainer) {
    gsap.from(terminalContainer, {
      scrollTrigger: {
        trigger: terminalContainer,
        start: 'top 80%',
      },
      opacity: 0,
      y: 40,
      scale: 0.98,
      duration: 0.9,
    });
  }
}

// =============================================
// DOSSIER DATA & MODAL SYSTEM
// =============================================
const DOSSIERS_DATA = {
  'secret-admirer': {
    title: 'Secret Admirer Dispatch',
    price: '$149.00',
    timeframe: '24-48 Hours Staging',
    clearance: 'Level 1 (Public)',
    desc: 'A stylized covert delivery containing tailored messages, customized cryptic letters, and a high-grade surprise box. Perfect for sending a message that stands out under absolute anonymity.',
  },
  'soft-revenge': {
    title: 'Soft Revenge Mission',
    price: '$299.00',
    timeframe: '3-5 Days Recon',
    clearance: 'Level 2 (Confidential)',
    desc: 'Minor covert inconveniences executed with theatrical flair. Includes customized minor pranks, glitter traps disguised as premium items, or an agent showing up to deliver a mildly disappointing report in person.',
  },
  'confession': {
    title: 'The Covert Confession',
    price: '$199.00',
    timeframe: '48 Hours Staging',
    clearance: 'Level 1 (Public)',
    desc: 'Unburden your secrets. An agent will deliver an elegantly handwritten confession or a security-sealed ledger containing your statement directly to the target recipient. Absolute confidentiality guaranteed.',
  },
  'roast-your-friend': {
    title: 'Roast Your Friend Op',
    price: '$249.00',
    timeframe: '3 Days Staging',
    clearance: 'Level 2 (Confidential)',
    desc: 'A custom character roast delivered by a deadpan agent in a formal suit. Includes a high-grade plaque printed with their mock crimes and a theatrical reading of their humorous indictments.',
  },
  'office-prank-kit': {
    title: 'Office Prank Deployment',
    price: '$450.00',
    timeframe: '4-6 Days Recon',
    clearance: 'Level 3 (Secret)',
    desc: 'Complete office floor dynamic pranks. Involves subtle psychological adjustments (moving desk items, deploying silent sound emitters, or staging a mock agent inspection of corporate policy).',
  },
  'midnight-mystery': {
    title: 'Midnight Mystery Dispatch',
    price: '$349.00',
    timeframe: '24 Hours Staging',
    clearance: 'Level 2 (Confidential)',
    desc: 'Under the cover of night, a package containing a custom enigma, puzzle box, or keys to a cryptic location is dropped off. Includes GPS coordinate dispatches and neon coordinates.',
  },
  'vip-decoy': {
    title: 'VIP Decoy Escort',
    price: '$899.00',
    timeframe: '7 Days Planning',
    clearance: 'Level 4 (Top Secret)',
    desc: 'Full-scale agent decoy deployment. Four agents in suits and sunglasses will shadow a target in public to create a massive buzz, complete with mock security ear-pieces and barricade containment.',
  },
  'anonymous-apology': {
    title: 'Anonymous Apology',
    price: '$180.00',
    timeframe: '48 Hours Staging',
    clearance: 'Level 1 (Public)',
    desc: 'Mend fences with absolute discretion. We deliver high-end gifts and a structured statement expressing remorse. Zero breadcrumbs linking back to you, allowing a fresh start.',
  },
  'red-envelope': {
    title: 'The Red Envelope Protocol',
    price: '$599.00',
    timeframe: '5 Days Planning',
    clearance: 'Level 3 (Secret)',
    desc: 'A premium experiential puzzle. The recipient receives sequential crimson envelopes containing custom clues, puzzles, and spy-tech coordinates leading to an exclusive dining or VIP experience.',
  },
};

function initDossierModals() {
  const modalOverlay = document.querySelector('.modal-overlay');
  if (!modalOverlay) return;

  const modalTitle = modalOverlay.querySelector('.modal-title');
  const modalPrice = modalOverlay.querySelector('.price');
  const modalTimeframe = modalOverlay.querySelector('.timeframe-val');
  const modalClearance = modalOverlay.querySelector('.clearance-val');
  const modalDesc = modalOverlay.querySelector('.modal-desc');
  const modalActionBtn = modalOverlay.querySelector('.modal-confirm-btn');
  const closeModalBtn = modalOverlay.querySelector('.modal-close');

  window.openDossierModal = function (id) {
    const data = DOSSIERS_DATA[id];
    if (!data) return;

    modalTitle.textContent = data.title;
    modalPrice.textContent = data.price;
    modalTimeframe.textContent = data.timeframe;
    modalClearance.textContent = data.clearance;
    modalDesc.textContent = data.desc;
    modalActionBtn.setAttribute('data-dossier-id', id);

    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  function closeModal() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  closeModalBtn.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  modalActionBtn.addEventListener('click', () => {
    const selectedId = modalActionBtn.getAttribute('data-dossier-id');
    sessionStorage.setItem('preselected_dossier', selectedId);
    closeModal();
    window.location.href = 'contact.html';
  });
}

// =============================================
// TERMINAL FORM & FIREBASE SUBMISSION
// =============================================
function initTerminalForm() {
  const terminalForm = document.getElementById('terminal-dispatch-form');
  const terminalCmdLog = document.querySelector('.terminal-command-log');
  if (!terminalForm) return;

  // Auto-fill dossier selector from session storage
  const preselected = sessionStorage.getItem('preselected_dossier');
  if (preselected) {
    const select = document.getElementById('target-dossier');
    if (select) {
      select.value = preselected;
      sessionStorage.removeItem('preselected_dossier');
    }
  }

  // Pre-generate agent identifier
  const agentInput = document.getElementById('agent-identifier');
  if (agentInput && !agentInput.value) {
    agentInput.value = `AGENT_GUEST_${Math.floor(1000 + Math.random() * 9000)}`;
  }

  // Live payload buffer feedback
  const payloadField = document.getElementById('message-payload');
  if (payloadField) {
    payloadField.addEventListener('input', () => {
      const charCount = payloadField.value.length;
      if (charCount > 0 && charCount % 10 === 0) {
        terminalCmdLog.innerHTML = `PAYLOAD_BUFFER: ${charCount} BYTES ENCRYPTED...<span>_</span>`;
      }
    });
  }

  // Form submit handler
  terminalForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const agentId = document.getElementById('agent-identifier').value.trim();
    const dossier = document.getElementById('target-dossier').value;
    const payload = document.getElementById('message-payload').value.trim();
    const coordinates = document.getElementById('delivery-coordinates').value.trim();

    if (!agentId || !dossier || !payload || !coordinates) {
      terminalCmdLog.innerHTML = `SYS_ERR: EMPTY VARIABLES DETECTED. ALL FIELDS REQUIRED.<span>_</span>`;
      return;
    }

    const inputs = terminalForm.querySelectorAll('input, textarea, select, button');
    inputs.forEach((input) => (input.disabled = true));

    const logLines = [
      '> INITIALIZING COVERT SUBMISSION PROTOCOL...',
      '> AUTHENTICATING AGENT CERTIFICATES...',
      `> AGENT IDENTITY: ${agentId} APPROVED.`,
      `> PACKAGING PAYLOAD FOR OPERATION: [${dossier.toUpperCase()}]`,
      '> ESTABLISHING ENCRYPTED TUNNEL TO FIRESTORE...',
      '> WRITING DISPATCH TO DATABASE (COLLECTION: dispatches)...',
    ];

    for (let i = 0; i < logLines.length; i++) {
      terminalCmdLog.innerHTML = `${logLines[i]}<span>_</span>`;
      await new Promise((resolve) => setTimeout(resolve, 550));
    }

    try {
      const { db, collection, addDoc } = await import('./firebase.js');

      const payloadData = {
        agent_id: agentId,
        operation_dossier: dossier,
        encrypted_payload: btoa(payload),
        delivery_location: coordinates,
        status: 'STAGED',
      };

      const docRef = await addDoc(collection(db, 'dispatches'), payloadData);

      terminalCmdLog.innerHTML = `> SUCCESS // DISPATCH SECURED // ID: ${docRef.id}<br>> DISCRETION GUARANTEED. STAND BY FOR DIRECTIVE EXCURSION.<span>_</span>`;
      terminalForm.reset();
    } catch (error) {
      terminalCmdLog.innerHTML = `> TRANSMISSION FAIL // ERR: ${error.message}<span>_</span>`;
      inputs.forEach((input) => (input.disabled = false));
    }
  });
}
