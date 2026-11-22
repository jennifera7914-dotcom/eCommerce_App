import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function AdminDashboardScreen({ navigation }) {
  const [adminEmail, setAdminEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      const admin = await AsyncStorage.getItem("admin");
      if (!admin) { navigation.replace("AdminLoginScreen"); return; }
      try { setAdminEmail(JSON.parse(admin).email || ""); } catch (e) {}
      setLoading(false);
    };
    check();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem("admin");
    navigation.replace("ChooseRoleScreen");
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#6200EE" /><Text style={{ marginTop: 10, color: "#666" }}>Loading dashboard...</Text></View>;
  }

  const buttons = [
    { icon: "👥", title: "Customer Management", sub: "Add, Edit, Delete customers", screen: "CustomerManagementScreen", color: "#6200EE" },
    { icon: "📦", title: "Product Management", sub: "Add, Edit, Delete products & categories", screen: "AdminProducts", color: "#2563EB" },
    { icon: "🛍️", title: "Order Management", sub: "View all customer orders", screen: "OwnerOrdersScreen", color: "#16A34A" },
    { icon: "💬", title: "Chat Management", sub: "Reply to customer questions", screen: "OwnerChatScreen" , color: "#D97706" },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F3F4F6" }} contentContainerStyle={{ padding: 20, paddingTop: 50 }}>
      <View style={styles.headerCard}>
        <Text style={{ fontSize: 28 }}>🏪</Text>
        <Text style={styles.title}>Owner Dashboard</Text>
        <Text style={styles.email}>{adminEmail}</Text>
        <Text style={styles.subtitle}>Mobile Accessory Hub</Text>
      </View>

      <View style={styles.grid}>
        {buttons.map((b) => (
          <TouchableOpacity key={b.title} style={styles.menuCard} onPress={() => navigation.navigate(b.screen)}>
            <View style={[styles.iconBox, { backgroundColor: b.color }]}>
              <Text style={{ fontSize: 26 }}>{b.icon}</Text>
            </View>
            <Text style={styles.menuTitle}>{b.title}</Text>
            <Text style={styles.menuSub}>{b.sub}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity onPress={() => navigation.navigate("HomeScreen")} style={styles.previewBtn}>
        <Text style={styles.previewText}>👁️ Customer Preview</Text>
        <Text style={{ color: "#666", fontSize: 12, marginTop: 4 }}>View app as customer</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
        <Text style={styles.logoutText}>🚪 Logout</Text>
      </TouchableOpacity>
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  headerCard: { backgroundColor: "#6200EE", borderRadius: 16, padding: 20, alignItems: "center" },
  title: { fontSize: 22, fontWeight: "bold", color: "#fff", marginTop: 8 },
  email: { color: "#E9D5FF", fontSize: 13, marginTop: 4 },
  subtitle: { color: "#DDD6FE", fontSize: 12, marginTop: 2 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 16 },
  menuCard: { width: "48%", backgroundColor: "#fff", borderRadius: 14, padding: 16, alignItems: "center", marginBottom: 12, borderWidth: 1, borderColor: "#E5E7EB", minHeight: 140, justifyContent: "center" },
  iconBox: { width: 52, height: 52, borderRadius: 26, justifyContent: "center", alignItems: "center", marginBottom: 10 },
  menuTitle: { fontSize: 14, fontWeight: "bold", color: "#111", textAlign: "center" },
  menuSub: { fontSize: 11, color: "#666", textAlign: "center", marginTop: 4, lineHeight: 15 },
  previewBtn: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#ddd", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 6 },
  previewText: { fontWeight: "bold", fontSize: 15, color: "#6200EE" },
  logoutBtn: { backgroundColor: "#DC2626", padding: 15, borderRadius: 12, alignItems: "center", marginTop: 12 },
  logoutText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
});