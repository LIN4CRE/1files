/**
 * WCAG 2.1 AA Accessibility Validator for 1files Software Vault.
 * Verifies semantic landmarks, skip links, heading hierarchies, modal dialog semantics, and focus management.
 */

const { parseHTML, extractStyles, extractScripts } = require('./dom-parser');

function auditAccessibility(html) {
  const dom = parseHTML(html);
  const styles = extractStyles(html).join('\n');
  const scripts = extractScripts(html).join('\n');

  const report = {
    landmarks: {
      hasMain: false,
      hasNav: false,
      hasSection: false,
      score: 0
    },
    headings: {
      h1Count: 0,
      h2Count: 0,
      h3Count: 0,
      hasProperHierarchy: false
    },
    skipLink: {
      present: false,
      targetId: '',
      hasTargetInDom: false,
      accessibleText: ''
    },
    modal: {
      hasDialogRole: false,
      hasAriaModal: false,
      hasAriaLabelledBy: false,
      hasCloseButtonAriaLabel: false,
      hasBackdropClickHandler: false,
      hasEscapeListener: false,
      hasTrapFocusScript: false,
      hasRestoreFocusScript: false
    },
    focusStyles: {
      hasFocusVisible: false,
      hasFocusRing: false
    },
    violations: []
  };

  // 1. Landmarks
  const mains = dom.getElementsByTagName('main');
  const navs = dom.getElementsByTagName('nav');
  const sections = dom.getElementsByTagName('section');

  report.landmarks.hasMain = mains.length > 0 || dom.querySelectorAll('[role="main"]').length > 0;
  report.landmarks.hasNav = navs.length > 0 || dom.querySelectorAll('[role="navigation"]').length > 0;
  report.landmarks.hasSection = sections.length > 0 || dom.querySelectorAll('[role="region"]').length > 0;

  if (!report.landmarks.hasMain) report.violations.push('Missing <main> semantic landmark');
  if (!report.landmarks.hasNav) report.violations.push('Missing <nav> semantic landmark');

  // 2. Headings
  const h1s = dom.getElementsByTagName('h1');
  const h2s = dom.getElementsByTagName('h2');
  const h3s = dom.getElementsByTagName('h3');

  report.headings.h1Count = h1s.length;
  report.headings.h2Count = h2s.length;
  report.headings.h3Count = h3s.length;

  // Single primary H1, followed by H2s
  report.headings.hasProperHierarchy = h1s.length === 1 && h2s.length >= 1;
  if (h1s.length === 0) report.violations.push('Missing top-level <h1> heading');
  if (h1s.length > 1) report.violations.push(`Multiple <h1> headings found (${h1s.length})`);

  // 3. Skip Link
  const skipLinks = dom.querySelectorAll('a.skip-link, a[href^="#"]');
  const primarySkip = skipLinks.find(a => {
    const text = a.textContent.toLowerCase();
    return text.includes('skip') || a.classList.has('skip-link');
  });

  if (primarySkip) {
    report.skipLink.present = true;
    report.skipLink.accessibleText = primarySkip.textContent;
    const target = primarySkip.getAttribute('href') || '';
    report.skipLink.targetId = target.replace('#', '');
    if (report.skipLink.targetId) {
      report.skipLink.hasTargetInDom = !!dom.getElementById(report.skipLink.targetId);
    }
  } else {
    report.violations.push('Missing skip-to-content navigation link');
  }

  // 4. Modal Dialog semantics
  const modal = dom.getElementById('previewModal') || dom.querySelector('[role="dialog"]');
  if (modal) {
    report.modal.hasDialogRole = modal.getAttribute('role') === 'dialog';
    report.modal.hasAriaModal = modal.getAttribute('aria-modal') === 'true';
    report.modal.hasAriaLabelledBy = modal.hasAttribute('aria-labelledby') || modal.hasAttribute('aria-label');

    // Close button
    const closeBtn = modal.querySelector('.modal-close, [aria-label*="close" i], button[onclick*="closePreview"]');
    if (closeBtn) {
      report.modal.hasCloseButtonAriaLabel = closeBtn.hasAttribute('aria-label');
    }
  }

  // Check script logic for Escape and Focus management
  if (scripts) {
    report.modal.hasEscapeListener = /Escape|key\s*===?\s*['"]Escape['"]|keyCode\s*===?\s*27/.test(scripts);
    report.modal.hasBackdropClickHandler = /addEventListener\s*\(\s*['"]click['"]|e\.target\s*===?\s*(?:modal|backdrop)/.test(scripts);
    report.modal.hasTrapFocusScript = /Tab|activeElement|focus\(\)|inert|aria-hidden/.test(scripts);
    report.modal.hasRestoreFocusScript = /focus\(\)|lastActiveElement|triggerBtn/.test(scripts);
  }

  // 5. Focus Visible styles
  if (styles) {
    report.focusStyles.hasFocusVisible = /:focus-visible/.test(styles);
    report.focusStyles.hasFocusRing = /outline\s*:|box-shadow\s*:/.test(styles);
  }

  return report;
}

module.exports = {
  auditAccessibility
};
