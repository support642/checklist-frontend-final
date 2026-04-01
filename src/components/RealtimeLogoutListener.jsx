import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const RealtimeLogoutListener = () => {
  const navigate = useNavigate();

  // ✅ Ask notification permission
  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  // ✅ User auto-logout listener using Native Server-Sent Events (SSE)
  useEffect(() => {
    const username = localStorage.getItem("user-name");
    if (!username) return;

    const sseUrl = `${import.meta.env.VITE_API_BASE_URL}/login/stream?username=${encodeURIComponent(username)}`;
    const eventSource = new EventSource(sseUrl);

    // Listen for the 'logout' custom event from the backend
    eventSource.addEventListener("logout", () => {
      // Show Chrome notification to user
      if (Notification.permission === "granted") {
        new Notification("Session Expired", {
          body: "Your account details or permissions have been updated. Please log in again.",
          icon: "/Rama_TMT_logo.png",
        });
      }

      localStorage.clear();
      
      // Add a slight delay before redirect to ensure notification can render
      setTimeout(() => {
        navigate("/login");
        window.location.reload();
      }, 500);
    });

    // Listen for the 'force_logout' custom event from the backend (session invalidation)
    eventSource.addEventListener("force_logout", () => {
      if (Notification.permission === "granted") {
        new Notification("Session Expired", {
          body: "Your session has expired or your permissions were updated. Please log in again.",
          icon: "/Rama_TMT_logo.png",
        });
      }

      localStorage.clear();
      
      setTimeout(() => {
        navigate("/login");
        window.location.reload();
      }, 500);
    });

    eventSource.onerror = (err) => {
      console.error("SSE connection error", err);
      // The browser natively reconnects automatically if the stream drops!
    };

    return () => {
      eventSource.close();
    };
  }, [navigate]);

  // ✅ Check user status on refresh (Sync check)
  useEffect(() => {
    const checkUserStatusOnLoad = async () => {
      const username = localStorage.getItem("user-name");
      if (!username) return;
      
      try {
        // Here we ideally would hit a small auth endpoint.
        // For now, the backend will auto-stream the `logout` event if they are inactive 
        // the next time their settings are touched, or we can leave this block for future auth checks.
      } catch (err) {
        console.error(err);
      }
    };

    checkUserStatusOnLoad();
  }, [navigate]);

  return null;
};

export default RealtimeLogoutListener;
