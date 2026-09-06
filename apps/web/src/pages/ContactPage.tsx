import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { usePageAnimations } from '../hooks/usePageAnimations';

export function ContactPage() {
  const scope = useRef<HTMLElement>(null);
  usePageAnimations(scope);
  return <main ref={scope}><section className="contact-hero"><div className="section-container terminal-page-container">
    <div className="section-header"><span className="section-subtitle">CONTACT & ENQUIRIES</span><h1 className="hero-title page-hero-title with-margin">Get In Touch</h1></div>
    <div className="terminal-container">
      <div className="terminal-header"><div className="terminal-dots"><span className="terminal-dot red"/><span className="terminal-dot"/><span className="terminal-dot"/></div><div className="terminal-title">SECRET SERVICE // CONTACT</div><div className="terminal-status">ENQUIRIES</div></div>
      <div className="terminal-screen">
        <div className="terminal-log">GENERAL QUESTIONS · BUSINESS ENQUIRIES · PARTNERSHIPS</div>
        <h2>How can we help?</h2>
        <p>For general questions, package enquiries or business opportunities, use the published email contact below. For an existing operation, include its reference only if needed; do not send passwords, payment details or sensitive recipient information.</p>
        <p className="auth-notice">This page does not submit messages, reserve packages or create operations. Email opens your own mail application. There is no contact form or support-ticket backend connected to this website.</p>
        <a className="btn btn-secondary" href="mailto:comms@secret-service.agency">[ Email An Enquiry ]</a>
        <div className="section-header"><h2 className="small-section-title">Ready to create an operation?</h2><p>Choose a package, then log in or sign up in the Customer Portal. All operation requests are submitted there.</p></div>
        <Link className="btn btn-glowing" to="/dossiers">[ Explore Packages ]</Link>
      </div>
    </div>
    <div className="hq-details"><div><h3 className="hq-detail-title">PHYSICAL STATION HQ</h3><p className="hq-detail-text">Secret Service HQ Cape Town</p><p className="hq-detail-muted">Buitengracht Security Sector, Cape Town, South Africa</p></div><div><h3 className="hq-detail-title">EMAIL ENQUIRIES</h3><p className="hq-detail-text"><a className="hq-accent" href="mailto:comms@secret-service.agency">comms@secret-service.agency</a></p><p className="hq-detail-muted">Contact enquiries are separate from Customer Portal operation requests.</p></div></div>
  </div></section></main>;
}
