import React, { useState, useEffect } from "react";

const InstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(10);
  const [isMobile, setIsMobile] = useState(false);
  const promptTimerRef = React.useRef(null);
  const countdownRef = React.useRef(null);

  useEffect(() => {
    const matchedMobile =
      /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(
        navigator.userAgent,
      );
    console.log("📱 Mobile detected:", matchedMobile);
    setIsMobile(matchedMobile);

    if (!matchedMobile) return;

    const dismissedAt = Number(
      localStorage.getItem("installPromptDismissed") || 0,
    );
    const cooldown = 1000 * 60 * 60 * 24; // 24 jam
    if (dismissedAt && Date.now() - dismissedAt < cooldown) {
      console.log("⏸️ Install prompt dismissed recently, skipping...");
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      console.log("✅ beforeinstallprompt event fired");
      setDeferredPrompt(e);
      promptTimerRef.current = window.setTimeout(() => {
        console.log("⏰ Showing install prompt after 3s delay");
        setShowPrompt(true);
        setRemainingSeconds(10);
      }, 3000);
    };

    // Fallback: show prompt after 5 seconds on mobile even if event doesn't fire
    const fallbackTimer = window.setTimeout(() => {
      if (!deferredPrompt && matchedMobile) {
        console.log(
          "⚠️ beforeinstallprompt didn't fire, showing fallback prompt",
        );
        setShowPrompt(true);
        setRemainingSeconds(10);
      }
    }, 5000);

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      if (promptTimerRef.current) {
        clearTimeout(promptTimerRef.current);
      }
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!showPrompt) return;

    countdownRef.current = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          handleDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [showPrompt]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("✅ User accepted install");
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("installPromptDismissed", Date.now());
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    if (promptTimerRef.current) {
      clearTimeout(promptTimerRef.current);
    }
  };

  if (!showPrompt || !isMobile) return null;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.icon}>📱</div>
        <div style={styles.content}>
          <h3 style={styles.title}>Install BananaAI</h3>
          <p style={styles.text}>
            Pasang aplikasi untuk akses cepat, offline, dan pengalaman native.
          </p>
          <p style={styles.countdown}>
            Popup akan hilang otomatis dalam {remainingSeconds} detik.
          </p>
          <div style={styles.buttons}>
            <button onClick={handleInstall} style={styles.installBtn}>
              Install
            </button>
            <button onClick={handleDismiss} style={styles.dismissBtn}>
              Nanti
            </button>
          </div>
        </div>
        <button onClick={handleDismiss} style={styles.closeBtn}>
          ✕
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    position: "fixed",
    bottom: "20px",
    left: "20px",
    right: "20px",
    zIndex: 9999,
    maxWidth: "400px",
    margin: "0 auto",
  },
  card: {
    background: "white",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
    display: "flex",
    gap: "16px",
    position: "relative",
  },
  icon: {
    fontSize: "40px",
  },
  content: {
    flex: 1,
  },
  title: {
    margin: "0 0 8px 0",
    fontSize: "18px",
    fontWeight: "bold",
    color: "#1f2937",
  },
  text: {
    margin: "0 0 16px 0",
    fontSize: "14px",
    color: "#6b7280",
    lineHeight: "1.5",
  },
  buttons: {
    display: "flex",
    gap: "12px",
  },
  installBtn: {
    flex: 1,
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  dismissBtn: {
    padding: "10px 20px",
    background: "transparent",
    border: "none",
    color: "#6b7280",
    fontSize: "14px",
    cursor: "pointer",
  },
  closeBtn: {
    position: "absolute",
    top: "12px",
    right: "12px",
    background: "transparent",
    border: "none",
    fontSize: "18px",
    color: "#9ca3af",
    cursor: "pointer",
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};

export default InstallPrompt;
