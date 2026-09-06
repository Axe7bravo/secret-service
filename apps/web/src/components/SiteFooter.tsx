import { Link } from 'react-router-dom';
import './SiteFooter.css';

export function SiteFooter() {
  return <footer className="site-footer">
    <div className="site-footer-inner">
      <div className="site-footer-grid">
        <div className="site-footer-brand">
          <Link to="/" className="site-footer-wordmark" aria-label="Secret Service home">
            <span aria-hidden="true">S</span> Secret Service
          </Link>
          <p>Delivered in Confidence.</p>
        </div>
        <nav aria-labelledby="footer-explore-heading">
          <h2 id="footer-explore-heading">Explore</h2>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/dossiers">Dossiers / Packages</Link></li>
            <li><Link to="/faq">FAQ</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </nav>
        <nav aria-labelledby="footer-customer-heading">
          <h2 id="footer-customer-heading">Customer Portal</h2>
          <ul>
            <li><Link to="/login">Log In</Link></li>
            <li><Link to="/signup">Sign Up</Link></li>
          </ul>
        </nav>
        <nav aria-labelledby="footer-legal-heading">
          <h2 id="footer-legal-heading">Legal</h2>
          <ul>
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/terms">Terms &amp; Conditions</Link></li>
          </ul>
        </nav>
      </div>
      <div className="site-footer-bottom">
        <p>&copy; {new Date().getFullYear()} Secret Service. All rights reserved.</p>
      </div>
    </div>
  </footer>;
}
