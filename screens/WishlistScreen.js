import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getImageUrl } from "../constants/api";

export default function WishlistScreen({ navigation }) {
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      const _s = await AsyncStorage.getItem("user");
const _u = _s ? JSON.parse(_s) : null;
const _key = `wishlist_${_u ? (_u.id || _u.userId || _u.phone || "guest") : "guest"}`;
const stored = await AsyncStorage.getItem(_key);
      if (stored) {
        setWishlist(JSON.parse(stored));
      }
    } catch (e) {
      console.log("Wishlist load error:", e);
    }
  };

  const removeFromWishlist = async (productId) => {
    const updated = wishlist.filter((item) => item.id !== productId);
    setWishlist(updated);
    const _s = await AsyncStorage.getItem("user");
const _u = _s ? JSON.parse(_s) : null;
const _key = `wishlist_${_u ? (_u.id || _u.userId || _u.phone || "guest") : "guest"}`;
    await AsyncStorage.setItem(_key, JSON.stringify(updated));
  };

  if (wishlist.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={{ fontSize: 50 }}>❤️</Text>
        <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
        <Text style={styles.emptySub}>
          Tap the heart on any product to save it here
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>
        {wishlist.length} item(s) saved
      </Text>

      {wishlist.map((item) => {
        const imgUri = getImageUrl(item.image1);
        return (
          <TouchableOpacity
            key={item.id}
            style={styles.itemCard}
            onPress={() =>
              navigation.navigate("ProductDetail", {
                productId: item.id,
                product: item,
              })
            }
          >
            <View style={styles.imageBox}>
              {imgUri ? (
                <Image
                  source={{ uri: imgUri }}
                  style={styles.image}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.noImage}>
                  <Text style={{ fontSize: 26 }}>📱</Text>
                </View>
              )}
            </View>

            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.itemPrice}>
                MRP: ₹{item.mrp ?? item.price}
              </Text>
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => removeFromWishlist(item.id)}
              >
                <Text style={styles.removeText}>🗑️ Remove</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        );
      })}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 6,
    textAlign: "center",
  },
  header: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4B5563",
    padding: 14,
  },
  itemCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 10,
    padding: 12,
    gap: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  imageBox: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },
  noImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: "bold", color: "#111827" },
  itemPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#111827",
    marginTop: 4,
  },
  removeBtn: { marginTop: 6, alignSelf: "flex-start" },
  removeText: { fontSize: 12, color: "#DC2626", fontWeight: "600" },
});