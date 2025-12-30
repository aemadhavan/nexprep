"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";

declare global {
  interface Window {
    dataLayer: any[];
  }
}

export function ConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setShowBanner(true);
    } else {
      // Apply stored consent
      updateConsent(consent === "granted");
    }
  }, []);

  const updateConsent = (granted: boolean) => {
    if (typeof window !== "undefined" && window.dataLayer) {
      window.dataLayer.push({
        event: "consent_update",
      });

      // @ts-ignore
      window.gtag?.("consent", "update", {
        ad_storage: granted ? "granted" : "denied",
        ad_user_data: granted ? "granted" : "denied",
        ad_personalization: granted ? "granted" : "denied",
        analytics_storage: granted ? "granted" : "denied",
      });
    }
  };

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "granted");
    updateConsent(true);
    setShowBanner(false);
  };

  const handleReject = () => {
    localStorage.setItem("cookie-consent", "denied");
    updateConsent(false);
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t">
      <Card className="max-w-4xl mx-auto p-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">Cookie Consent</h3>
            <p className="text-sm text-muted-foreground">
              We use cookies to enhance your browsing experience, serve personalized ads or content,
              and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.{" "}
              <a
                href="/cookie-policy"
                className="underline hover:text-primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                Learn more
              </a>
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" onClick={handleReject} size="sm">
              Reject All
            </Button>
            <Button onClick={handleAccept} size="sm">
              Accept All
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
