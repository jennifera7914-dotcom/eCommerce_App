import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "mobileshop_customer_token";

// Local session - no backend needed
export async function ensureSession() {
  let token = await AsyncStorage.getItem(TOKEN_KEY);
  if (!token) {
    token = "local_session_" + Date.now();
    await AsyncStorage.setItem(TOKEN_KEY, token);
  }
  return { token, name: "Customer" };
}

export async function fetchProfile(token) {
  const stored = await AsyncStorage.getItem("user");
  if (stored) return JSON.parse(stored);
  return { token, name: "Customer" };
}

export function authHeaders(token) {
  return { "X-Customer-Token": token || "" };
}