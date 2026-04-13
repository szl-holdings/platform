import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ONBOARDING_KEY = "carlota_jo_onboarding_complete";

export function useOnboarding() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then((val) => {
        setHasCompletedOnboarding(val === "true");
      })
      .catch(() => {
        setHasCompletedOnboarding(true);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const completeOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    setHasCompletedOnboarding(true);
  };

  return { isLoading, hasCompletedOnboarding, completeOnboarding };
}
