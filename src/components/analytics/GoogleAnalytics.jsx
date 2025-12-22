
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import ReactGA from "react-ga4";

const GoogleAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    // Initialize GA4 once
    // It's safe to call initialize multiple times, react-ga4 handles it,
    // but usually we do it on mount.
    const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    
    if (measurementId) {
      ReactGA.initialize(measurementId);
      // console.log("GA Initialized with", measurementId);
    } else {
        console.warn("VITE_GA_MEASUREMENT_ID is not defined");
    }
  }, []);

  useEffect(() => {
    // Send pageview with a custom path
    ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });
    // console.log("GA Pageview sent", location.pathname + location.search);
  }, [location]);

  return null;
};

export default GoogleAnalytics;
