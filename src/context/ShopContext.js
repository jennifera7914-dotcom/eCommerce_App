import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BACKEND_URL } from "../api/config";

const ShopContext = createContext();

async function getStoredUser() {
  try {
    const s = await AsyncStorage.getItem("user");
    if (!s) return null;
    const parsed = JSON.parse(s);
    return parsed.user ? { ...parsed, ...parsed.user } : parsed;
  } catch { return null; }
}
function getUid(u) { return u ? (u.id || u.userId || null) : null; }

export function ShopProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [savedForLater, setSavedForLater] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [sessionReady, setSessionReady] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const cartRef = useRef([]);
  cartRef.current = cart;

  const loadCart = async () => {
    const u = await getStoredUser();
    setCustomer(u);
    const uid = getUid(u);
    if (!uid) {
      try {
        const local = await AsyncStorage.getItem("cart_guest");
        setCart(local ? JSON.parse(local) : []);
      } catch {}
      return;
    }
    try {
      const res = await fetch(`${BACKEND_URL}/api/cart/user/${uid}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const mapped = data.map(i => ({ ...i, productId: i.productId || i.id }));
          setCart(mapped);
          await AsyncStorage.setItem(`cart_${uid}`, JSON.stringify(mapped));
          return;
        }
      }
      throw new Error("fetch failed");
    } catch (e) {
      try {
        const local = await AsyncStorage.getItem(`cart_${uid}`);
        setCart(local ? JSON.parse(local) : []);
      } catch {}
    }
  };

  useEffect(() => { loadCart(); }, []);

  const saveLocal = async (next, uid) => {
    try { await AsyncStorage.setItem(`cart_${uid || "guest"}`, JSON.stringify(next)); } catch {}
  };

  const addToCart = (product, qty = 1) => {
    const pid = product.id || product.productId;
    const existing = cartRef.current.find(i => (i.productId || i.id) === pid);
    let next;
    if (existing) {
      next = cartRef.current.map(i => (i.productId || i.id) === pid ? { ...i, quantity: i.quantity + qty } : i);
    } else {
      next = [...cartRef.current, { productId: pid, id: pid, name: product.name, price: product.price, mrp: product.mrp || product.price, image1: product.image1 || product.image || null, image: product.image1 || product.image || null, brand: product.brand, category: product.category, stockQty: product.stockQty || 999, quantity: qty }];
    }
    setCart(next);
    (async () => {
      const u = await getStoredUser(); const uid = getUid(u);
      saveLocal(next, uid);
      if (uid) { try { await fetch(`${BACKEND_URL}/api/cart/add`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: uid, productId: pid, quantity: qty }) }); } catch {} }
    })();
  };

  const changeQuantity = (id, newQty) => {
    if (newQty < 1) { removeFromCart(id); return; }
    const next = cartRef.current.map(i => (i.productId || i.id) === id ? { ...i, quantity: newQty } : i);
    setCart(next);
    (async () => {
      const u = await getStoredUser(); const uid = getUid(u);
      saveLocal(next, uid);
      if (uid) { try { await fetch(`${BACKEND_URL}/api/cart/update`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: uid, productId: id, quantity: newQty }) }); } catch {} }
    })();
  };

  const addQuantity = (id) => {
    const item = cartRef.current.find(i => (i.productId || i.id) === id);
    if (item) changeQuantity(id, item.quantity + 1);
  };

  const removeFromCart = (id) => {
    console.log("REMOVE CART:", id);
    const next = cartRef.current.filter(i => (i.productId || i.id) !== id);
    setCart(next);
    (async () => {
      const u = await getStoredUser(); const uid = getUid(u);
      console.log("REMOVE UID:", uid);
      saveLocal(next, uid);
      if (uid) {
        try {
          const r = await fetch(`${BACKEND_URL}/api/cart/remove?userId=${uid}&productId=${id}`, { method: "DELETE" });
          console.log("REMOVE BACKEND STATUS:", r.status);
        } catch (e) { console.log("REMOVE FAILED:", e.message); }
      }
    })();
  };

  const clearCart = async () => {
    const items = [...cartRef.current];
    setCart([]);
    const u = await getStoredUser(); const uid = getUid(u);
    saveLocal([], uid);
    if (uid) {
      for (const it of items) {
        try { await fetch(`${BACKEND_URL}/api/cart/remove?userId=${uid}&productId=${it.productId || it.id}`, { method: "DELETE" }); } catch {}
      }
    }
  };

  const getCartTotal = () => cart.reduce((s, i) => s + (i.price || 0) * i.quantity, 0);
  const addItemsToCart = async (items) => { for (const it of items) addToCart(it, it.quantity || 1); };

  return (
    <ShopContext.Provider value={{ cart, savedForLater, customer, sessionReady, notifications, addToCart, addItemsToCart, changeQuantity, addQuantity, removeFromCart, clearCart, getCartTotal, loadCart }}>
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() { return useContext(ShopContext); }