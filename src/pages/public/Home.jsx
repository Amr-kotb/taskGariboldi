import React from 'react';
import { Link } from 'react-router-dom';
import logoImage from '../../assets/images/logo.png';

const Home = () => {
  return (
    <div style={styles.container}>
      {/* Background animation */}
      <div style={styles.backgroundOrbs}>
        <div style={styles.orbBlue}></div>
        <div style={styles.orbYellow}></div>
        <div style={styles.orbOrange}></div>
        <div style={styles.orbRed}></div>
      </div>

      <div style={styles.content}>
        {/* Header with logo */}
        <div style={styles.header}>
          <div style={styles.logoContainer}>
            <img 
              src={logoImage} 
              alt="Logo TaskG - Istituto Gariboldi" 
              style={styles.logo}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML = `
                  <div style="
                    width: 120px;
                    height: 120px;
                    background: linear-gradient(135deg, #3b82f6, #f59e0b);
                    border-radius: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 48px;
                    color: white;
                    font-weight: bold;
                    box-shadow: 0 10px 30px rgba(59, 130, 246, 0.3);
                  ">
                    TG
                  </div>
                `;
              }}
            />
          </div>
          <h1 style={styles.title}>
            Task<span style={styles.titleAccent}>G</span>
          </h1>
          <p style={styles.subtitle}>Sistema di Gestione Task - Istituto Gariboldi</p>
        </div>

        {/* Hero section */}
        <div style={styles.hero}>
          <div style={styles.heroContent}>
            <h2 style={styles.heroTitle}>
              Organizza, Assegna e Monitora
              <span style={styles.heroHighlight}> le attività del tuo team</span>
            </h2>
            <p style={styles.heroText}>
              Una piattaforma completa per la gestione delle task scolastiche e lavorative.
              Semplice, efficiente e progettata per ottimizzare la produttività del tuo team.
            </p>  
          </div>
        </div>
        {/* CTA Section */}
        <div style={styles.ctaSection}>
          <div style={styles.ctaCard}>
            <div style={styles.ctaContent}>
              <h3 style={styles.ctaTitle}>Pronto a trasformare la gestione delle task?</h3>
              <p style={styles.ctaText}>
                Unisciti a centinaia di utenti che già utilizzano TaskG per ottimizzare 
                la produttività del loro team.
              </p>
              
              <Link
                to="/login"
                style={styles.ctaButton}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-3px) scale(1.05)';
                  e.target.style.boxShadow = '0 15px 30px rgba(59, 130, 246, 0.4), 0 5px 15px rgba(245, 158, 11, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0) scale(1)';
                  e.target.style.boxShadow = '0 10px 25px rgba(59, 130, 246, 0.3), 0 3px 10px rgba(245, 158, 11, 0.2)';
                }}
                onMouseDown={(e) => {
                  e.target.style.transform = 'translateY(0) scale(0.98)';
                }}
                onMouseUp={(e) => {
                  e.target.style.transform = 'translateY(-3px) scale(1.05)';
                }}
              >
                <span style={styles.buttonIcon}>🚀</span>
                <span style={styles.buttonText}>Accedi al Sistema</span>
                <span style={styles.buttonArrow}>→</span>
              </Link>
            </div>
            
            <div style={styles.ctaIllustration}>
              <div style={styles.illustrationCircle}></div>
              <div style={styles.illustrationIcon}>📊</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <div style={styles.footerContent}>
            <div style={styles.footerLogo}>
              <div style={styles.footerLogoIcon}>TG</div>
              <div style={styles.footerLogoText}>
                <div style={styles.footerLogoTitle}>TaskG</div>
                <div style={styles.footerLogoSubtitle}>Istituto Gariboldi</div>
              </div>
            </div>
            
            <div style={styles.footerInfo}>
              <p style={styles.footerText}>
                © {new Date().getFullYear()} Task Management System - Istituto Gariboldi
              </p>
              <p style={styles.footerSubtext}>
                Versione 2.0 • Sistema ottimizzato per la gestione delle task
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #eff6ff 0%, #fffbeb 50%, #fff7ed 100%)',
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },
  backgroundOrbs: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    pointerEvents: 'none'
  },
  orbBlue: {
    position: 'absolute',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    background: 'radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.15), transparent 70%)',
    top: '-100px',
    right: '-100px',
    animation: 'floatBlue 20s ease-in-out infinite'
  },
  orbYellow: {
    position: 'absolute',
    width: '250px',
    height: '250px',
    borderRadius: '50%',
    background: 'radial-gradient(circle at 70% 70%, rgba(245, 158, 11, 0.12), transparent 70%)',
    bottom: '-80px',
    left: '-80px',
    animation: 'floatYellow 25s ease-in-out infinite'
  },
  orbOrange: {
    position: 'absolute',
    width: '200px',
    height: '200px',
    borderRadius: '50%',
    background: 'radial-gradient(circle at 50% 50%, rgba(249, 115, 22, 0.1), transparent 70%)',
    top: '50%',
    left: '10%',
    animation: 'floatOrange 30s ease-in-out infinite'
  },
  orbRed: {
    position: 'absolute',
    width: '180px',
    height: '180px',
    borderRadius: '50%',
    background: 'radial-gradient(circle at 20% 80%, rgba(239, 68, 68, 0.08), transparent 70%)',
    bottom: '20%',
    right: '15%',
    animation: 'floatRed 35s ease-in-out infinite'
  },
  content: {
    width: '100%',
    maxWidth: '1200px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '32px',
    boxShadow: `
      0 30px 60px -12px rgba(0, 0, 0, 0.15),
      0 18px 36px -18px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.8),
      0 0 0 1px rgba(255, 255, 255, 0.2)
    `,
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    position: 'relative',
    zIndex: 10,
    overflow: 'hidden'
  },
  header: {
    textAlign: 'center',
    padding: '60px 40px 40px',
    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(245, 158, 11, 0.05) 100%)',
    borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
  },
  logoContainer: {
    width: '120px',
    height: '120px',
    margin: '0 auto 20px',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '24px',
    boxShadow: '0 10px 30px rgba(59, 130, 246, 0.2)',
    border: '2px solid rgba(59, 130, 246, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease'
  },
  logo: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))'
  },
  title: {
    fontSize: '64px',
    fontWeight: '800',
    color: '#1e293b',
    margin: '0 0 8px 0',
    letterSpacing: '-0.025em',
    background: 'linear-gradient(135deg, #3b82f6 30%, #f59e0b 70%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  titleAccent: {
    color: '#ef4444',
    WebkitTextFillColor: '#ef4444'
  },
  subtitle: {
    fontSize: '18px',
    color: '#475569',
    fontWeight: '600',
    margin: '0',
    letterSpacing: '0.025em'
  },
  hero: {
    padding: '60px 40px',
    textAlign: 'center'
  },
  heroContent: {
    maxWidth: '800px',
    margin: '0 auto'
  },
  heroTitle: {
    fontSize: '48px',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '24px',
    lineHeight: '1.2'
  },
  heroHighlight: {
    background: 'linear-gradient(135deg, #3b82f6 30%, #ef4444 70%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    display: 'block'
  },
  heroText: {
    fontSize: '18px',
    color: '#64748b',
    lineHeight: '1.6',
    marginBottom: '40px',
    maxWidth: '600px',
    margin: '0 auto 40px'
  },
  heroStats: {
    display: 'flex',
    justifyContent: 'center',
    gap: '40px',
    marginTop: '40px'
  },
  statItem: {
    textAlign: 'center',
    padding: '20px'
  },
  statNumber: {
    fontSize: '36px',
    marginBottom: '12px',
    opacity: '0.8'
  },
  statText: {
    fontSize: '14px',
    color: '#64748b',
    fontWeight: '600',
    letterSpacing: '0.05em'
  },
  features: {
    padding: '60px 40px',
    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.02) 0%, rgba(245, 158, 11, 0.02) 100%)'
  },
  featuresTitle: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: '48px',
    background: 'linear-gradient(135deg, #3b82f6 30%, #f59e0b 70%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
    maxWidth: '1000px',
    margin: '0 auto'
  },
  featureCard: {
    padding: '32px 24px',
    backgroundColor: 'white',
    borderRadius: '20px',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
    border: '1px solid rgba(0, 0, 0, 0.05)',
    transition: 'all 0.3s ease',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  featureIcon: {
    fontSize: '40px',
    marginBottom: '24px',
    padding: '20px',
    borderRadius: '16px',
    width: '80px',
    height: '80px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease'
  },
  featureTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 12px 0'
  },
  featureDescription: {
    fontSize: '15px',
    color: '#64748b',
    lineHeight: '1.5',
    margin: '0'
  },
  ctaSection: {
    padding: '60px 40px'
  },
  ctaCard: {
    backgroundColor: 'white',
    borderRadius: '24px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(0, 0, 0, 0.05)',
    padding: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '48px',
    maxWidth: '1000px',
    margin: '0 auto'
  },
  ctaContent: {
    flex: '1',
    minWidth: '0'
  },
  ctaTitle: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '20px',
    lineHeight: '1.2'
  },
  ctaText: {
    fontSize: '18px',
    color: '#64748b',
    lineHeight: '1.6',
    marginBottom: '32px'
  },
  ctaButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    padding: '22px 48px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #f59e0b 100%)',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '16px',
    fontWeight: '700',
    fontSize: '18px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3), 0 3px 10px rgba(245, 158, 11, 0.2)',
    position: 'relative',
    overflow: 'hidden',
    letterSpacing: '0.025em',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
  },
  buttonIcon: {
    fontSize: '24px',
    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))'
  },
  buttonText: {
    flex: '1'
  },
  buttonArrow: {
    fontSize: '24px',
    opacity: '0.8',
    transition: 'transform 0.3s ease'
  },
  ctaIllustration: {
    flexShrink: '0',
    position: 'relative'
  },
  illustrationCircle: {
    width: '200px',
    height: '200px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #3b82f6 0%, #f59e0b 100%)',
    opacity: '0.1',
    position: 'relative'
  },
  illustrationIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '60px',
    color: '#3b82f6'
  },
  footer: {
    padding: '40px',
    borderTop: '1px solid rgba(0, 0, 0, 0.05)',
    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.02) 0%, rgba(245, 158, 11, 0.02) 100%)'
  },
  footerContent: {
    maxWidth: '1000px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px'
  },
  footerLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  footerLogoIcon: {
    width: '48px',
    height: '48px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #f59e0b 100%)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: '700',
    fontSize: '20px'
  },
  footerLogoText: {
    textAlign: 'left'
  },
  footerLogoTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1e293b'
  },
  footerLogoSubtitle: {
    fontSize: '14px',
    color: '#64748b'
  },
  footerInfo: {
    textAlign: 'center'
  },
  footerText: {
    color: '#64748b',
    fontSize: '14px',
    fontWeight: '600',
    margin: '0 0 8px 0'
  },
  footerSubtext: {
    color: '#94a3b8',
    fontSize: '13px',
    fontWeight: '500',
    margin: '0'
  }
};

// Add CSS animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes floatBlue {
    0%, 100% { transform: translate(0, 0) rotate(0deg); }
    25% { transform: translate(20px, 20px) rotate(90deg); }
    50% { transform: translate(-10px, 30px) rotate(180deg); }
    75% { transform: translate(30px, -10px) rotate(270deg); }
  }
  
  @keyframes floatYellow {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(-15px, 15px) scale(1.1); }
    66% { transform: translate(15px, -15px) scale(0.9); }
  }
  
  @keyframes floatOrange {
    0%, 100% { transform: translate(0, 0); }
    25% { transform: translate(30px, 10px); }
    50% { transform: translate(-10px, 20px); }
    75% { transform: translate(20px, -15px); }
  }
  
  @keyframes floatRed {
    0%, 100% { transform: translate(0, 0) rotate(0deg); }
    50% { transform: translate(15px, 25px) rotate(180deg); }
  }
  
  .feature-card:hover {
    transform: translateY(-10px) scale(1.03);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    border-color: rgba(59, 130, 246, 0.2);
  }
  
  .feature-card:hover .feature-icon {
    transform: scale(1.1) rotate(5deg);
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(245, 158, 11, 0.2));
  }
  
  .cta-button:hover .button-arrow {
    transform: translateX(5px);
  }
  
  .logo-container:hover {
    transform: translateY(-5px) rotate(5deg);
    box-shadow: 0 20px 60px rgba(59, 130, 246, 0.3);
  }
`;
document.head.appendChild(styleSheet);

export default Home;