import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Modal,
} from "react-native";
import { API_BASE_URL } from "../src/api/config";

const API = `${API_BASE_URL}/api/admin/customers`;

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli and Daman and Diu","Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry"
];

const INDIAN_CITIES = [
  "Bengaluru","Mumbai","Delhi","Chennai","Hyderabad","Kolkata","Pune","Ahmedabad","Jaipur","Lucknow","Kanpur","Nagpur","Indore","Thane","Bhopal","Visakhapatnam","Patna","Vadodara","Ghaziabad","Ludhiana","Agra","Nashik","Faridabad","Meerut","Rajkot","Varanasi","Srinagar","Aurangabad","Dhanbad","Amritsar","Ranchi","Howrah","Coimbatore","Jabalpur","Gwalior","Vijayawada","Jodhpur","Madurai","Raipur","Kota","Guwahati","Chandigarh","Solapur","Hubli-Dharwad","Mysuru","Tiruchirappalli","Bareilly","Tiruppur","Moradabad","Jalandhar","Bhubaneswar","Salem","Warangal","Guntur","Cuttack","Aligarh","Bikaner","Nellore","Davanagere","Kozhikode","Thrissur","Malappuram","Kannur","Mangalore","Belagavi","Tumakuru","Udupi","Shivamogga","Hassan","Mandya","Chikkamagaluru","Kolar","Haveri","Gadag","Bidar","Raichur","Yadgir","Kalaburagi","Vijayapura","Bagalkot","Koppal","Chitradurga","Chamarajanagar","Kodagu","Ramanagara","Bengaluru Rural","Bengaluru Urban"
];

export default function CustomerManagementScreen({ navigation }) {
  const [adminEmail, setAdminEmail] = useState("");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const [name, setName] = useState("");
  const [shopName, setShopName] = useState("");
  const [phone, setPhone] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [email, setEmail] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [stateModalVisible, setStateModalVisible] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);

  useEffect(() => { checkAdmin(); }, []);

  const checkAdmin = async () => {
    const admin = await AsyncStorage.getItem("admin");
    if (!admin) { navigation.replace("AdminLoginScreen"); return; }
    setAdminEmail(JSON.parse(admin).email || "");
    loadCustomers();
  };

  const showMsg = (text, isError = false) => {
    setMsg((isError ? "❌ " : "✅ ") + text);
    setTimeout(() => setMsg(""), 3000);
  };

  const loadCustomers = async () => {
    try {
      const res = await fetch(API);
      const data = await res.json();
      setCustomers(Array.isArray(data) ? data : []);
    } catch { showMsg("Failed to load. Is server running?", true); }
  };

  const clearForm = () => {
    setName(""); setShopName(""); setPhone(""); setAlternatePhone("");
    setEmail(""); setLine1(""); setLine2(""); setCity("");
    setState(""); setPincode(""); setEditingId(null);
  };

  const handleSave = async () => {
    if (!name || !shopName || !phone || !email || !line1 || !city || !state || !pincode) {
      showMsg("Please fill Name, Shop Name, Phone, Email, Address, City, State, Pincode", true);
      return;
    }
    if (!/^\d{10}$/.test(phone)) { showMsg("Phone must be 10 digits", true); return; }
    if (alternatePhone && !/^\d{10}$/.test(alternatePhone)) { showMsg("Alt phone must be 10 digits", true); return; }
    if (!email.toLowerCase().endsWith("@gmail.com")) { showMsg("Email must end with @gmail.com", true); return; }
    if (!/^\d{6}$/.test(pincode)) { showMsg("Pincode must be 6 digits", true); return; }

    const body = { name, shopName, phone, alternatePhone, email: email.toLowerCase(), line1, line2, city, state, pincode };
    setLoading(true);
    try {
      let res;
      if (editingId === null) {
        res = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      } else {
        res = await fetch(`${API}/${editingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      }
      const out = await res.json().catch(() => ({}));
      if (res.ok) { showMsg(out.message || "Saved successfully"); clearForm(); loadCustomers(); }
      else showMsg(out.message || "Failed", true);
    } catch { showMsg("Cannot connect to backend", true); }
    setLoading(false);
  };

  const handleEdit = async (id) => {
    try {
      const res = await fetch(`${API}/${id}`);
      const u = await res.json();
      setName(u.name || ""); setShopName(u.shopName || ""); setPhone(u.phone || "");
      setAlternatePhone(u.alternatePhone || ""); setEmail(u.email || "");
      setLine1(u.address?.line1 || ""); setLine2(u.address?.line2 || "");
      setCity(u.address?.city || ""); setState(u.address?.state || ""); setPincode(u.address?.pincode || "");
      setEditingId(id);
    } catch { showMsg("Failed to load for edit", true); }
  };

  const handleDelete = async (id) => {
    let ok = false;
    if (Platform.OS === "web") { ok = window.confirm(`Delete customer ID ${id}?`); }
    else {
      ok = await new Promise((resolve) => Alert.alert("Confirm", `Delete customer ID ${id}?`, [
        { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
        { text: "Delete", style: "destructive", onPress: () => resolve(true) },
      ]));
    }
    if (!ok) return;
    try {
      const res = await fetch(`${API}/${id}`, { method: "DELETE" });
      const out = await res.json().catch(() => ({}));
      showMsg(out.message || "Deleted");
      if (editingId === id) clearForm();
      loadCustomers();
    } catch { showMsg("Delete failed", true); }
  };

  return (
    <View style={{flex:1, backgroundColor:"#fff"}}>
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 50 }}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={{ color: "#6200EE", fontSize: 16, fontWeight: "600" }}>← Back to Dashboard</Text>
      </TouchableOpacity>

      <Text style={styles.title}>👥 Customer Management</Text>
      <Text style={{ color: "#6200EE", fontSize: 12, marginTop: 4 }}>{adminEmail}</Text>

      {msg ? <Text style={{ textAlign: "center", marginTop: 10, color: msg.includes("❌") ? "red" : "green", fontWeight: "600" }}>{msg}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>👤 Customer Details</Text>
        <TextInput style={styles.input} placeholder="Customer Name *" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Phone * (10 digits)" keyboardType="number-pad" maxLength={10} value={phone} onChangeText={(t) => setPhone(t.replace(/[^0-9]/g, "").slice(0, 10))} />
        <TextInput style={styles.input} placeholder="Alternate Phone (optional)" keyboardType="number-pad" maxLength={10} value={alternatePhone} onChangeText={(t) => setAlternatePhone(t.replace(/[^0-9]/g, "").slice(0, 10))} />
        <TextInput style={styles.input} placeholder="Email * (must end with @gmail.com)" value={email} onChangeText={setEmail} autoCapitalize="none" />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>🏪 Shop Address Details</Text>
        <TextInput style={styles.input} placeholder="Shop Name *" value={shopName} onChangeText={setShopName} />
        <TextInput style={styles.input} placeholder="Shop Address Line 1 *" value={line1} onChangeText={setLine1} />
        <TextInput style={styles.input} placeholder="Line 2 (optional)" value={line2} onChangeText={setLine2} />

        <Text style={styles.label}>State * (Tap to select)</Text>
        <TouchableOpacity style={styles.selectorBox} onPress={() => setStateModalVisible(true)}>
          <Text style={state ? styles.selectorValue : styles.selectorPlaceholder}>{state ? state : "Tap to select State"}</Text>
          <Text style={styles.selectorArrow}>▲</Text>
        </TouchableOpacity>

        <Text style={styles.label}>City * (Tap to select)</Text>
        <TouchableOpacity style={styles.selectorBox} onPress={() => setCityModalVisible(true)}>
          <Text style={city ? styles.selectorValue : styles.selectorPlaceholder}>{city ? city : "Tap to select City"}</Text>
          <Text style={styles.selectorArrow}>▲</Text>
        </TouchableOpacity>

        <TextInput style={styles.input} placeholder="Pincode * (6 digits)" keyboardType="number-pad" maxLength={6} value={pincode} onChangeText={(t) => setPincode(t.replace(/[^0-9]/g, "").slice(0, 6))} />

        <TouchableOpacity onPress={handleSave} disabled={loading} style={styles.primaryBtn}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{editingId ? "Update Customer" : "Add Customer"}</Text>}
        </TouchableOpacity>
        {editingId ? (
          <TouchableOpacity onPress={clearForm} style={styles.secondaryBtn}>
            <Text style={{ color: "#000", textAlign: "center", fontWeight: "600" }}>Cancel</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.card}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={styles.cardTitle}>Customers ({customers.length})</Text>
          <TouchableOpacity onPress={loadCustomers}><Text style={{ color: "#6200EE", fontWeight: "600" }}>Refresh</Text></TouchableOpacity>
        </View>
        {customers.length === 0 ? (
          <Text style={{ color: "#666", textAlign: "center", marginTop: 10 }}>No customers yet</Text>
        ) : (
          customers.map((u, index) => (
            <View key={u.id} style={styles.customerRow}>
              <Text style={styles.sno}>S.No {index + 1} <Text style={{ color: "#999", fontSize: 10 }}>ID:{u.id}</Text></Text>
              <Text style={styles.cName}>{u.name}</Text>
              <Text style={styles.shopName}>🏪 {u.shopName || "-"}</Text>
              <Text style={{ color: "#666", fontSize: 12, marginTop: 4 }}>{u.phone}{u.alternatePhone ? ` | Alt: ${u.alternatePhone}` : ""}</Text>
              <Text style={{ color: "#6200EE", fontSize: 11, marginTop: 2 }}>{u.email}</Text>
              {u.address ? (
                <Text style={{ color: "#444", fontSize: 12, marginTop: 4, lineHeight: 17 }}>
                  📍 {u.address.line1}{u.address.line2 ? ", " + u.address.line2 : ""}, {u.address.city}, {u.address.state} - {u.address.pincode}
                </Text>
              ) : <Text style={{ color: "#999", fontSize: 11, marginTop: 4 }}>📍 No address saved</Text>}
              <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                <TouchableOpacity onPress={() => handleEdit(u.id)} style={[styles.smallBtn, { backgroundColor: "#007AFF" }]}><Text style={styles.smallText}>Edit</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(u.id)} style={[styles.smallBtn, { backgroundColor: "#ff3b30" }]}><Text style={styles.smallText}>Delete</Text></TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
      <View style={{ height: 30 }} />
    </ScrollView>

    <Modal visible={stateModalVisible} transparent animationType="slide" onRequestClose={() => setStateModalVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select State</Text>
            <TouchableOpacity onPress={() => setStateModalVisible(false)}><Text style={styles.modalClose}>✕ Close</Text></TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 350 }}>
            {INDIAN_STATES.map((s) => {
              const selected = state === s;
              return (
                <TouchableOpacity key={s} style={[styles.modalItem, selected && styles.modalItemActive]} onPress={() => { setState(s); setStateModalVisible(false); }}>
                  <Text style={[styles.modalItemText, selected && { color: "#6200EE", fontWeight: "bold" }]}>{s}</Text>
                  {selected && <Text style={{ color: "#6200EE", fontWeight: "bold" }}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>

    <Modal visible={cityModalVisible} transparent animationType="slide" onRequestClose={() => setCityModalVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select City</Text>
            <TouchableOpacity onPress={() => setCityModalVisible(false)}><Text style={styles.modalClose}>✕ Close</Text></TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 350 }}>
            {INDIAN_CITIES.map((c) => {
              const selected = city === c;
              return (
                <TouchableOpacity key={c} style={[styles.modalItem, selected && styles.modalItemActive]} onPress={() => { setCity(c); setCityModalVisible(false); }}>
                  <Text style={[styles.modalItemText, selected && { color: "#6200EE", fontWeight: "bold" }]}>{c}</Text>
                  {selected && <Text style={{ color: "#6200EE", fontWeight: "bold" }}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "bold", color: "#000", marginTop: 14 },
  sectionTitle: { fontWeight: "bold", fontSize: 15, marginBottom: 12, color: "#111" },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6, marginTop: 6 },
  card: { padding: 15, borderRadius: 12, borderWidth: 1, borderColor: "#ddd", marginTop: 15, backgroundColor: "#f9f9f9" },
  cardTitle: { fontWeight: "bold", marginBottom: 10, color: "#000" },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 12, marginBottom: 8, backgroundColor: "#fff" },
  selectorBox: { borderWidth: 1, borderColor: "#6200EE", backgroundColor: "#F5F3FF", borderRadius: 8, padding: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  selectorValue: { fontSize: 15, fontWeight: "600", color: "#6200EE" },
  selectorPlaceholder: { fontSize: 14, color: "#6B7280" },
  selectorArrow: { fontSize: 13, color: "#6200EE", fontWeight: "bold" },
  primaryBtn: { backgroundColor: "#6200EE", padding: 14, borderRadius: 8, alignItems: "center", marginTop: 10 },
  secondaryBtn: { backgroundColor: "#e0e0e0", padding: 14, borderRadius: 8, alignItems: "center", marginTop: 8 },
  btnText: { color: "#fff", fontWeight: "bold" },
  customerRow: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, marginTop: 10, backgroundColor: "#fff" },
  sno: { fontWeight: "bold", fontSize: 12, color: "#000" },
  cName: { fontWeight: "bold", marginTop: 4, color: "#000", fontSize: 15 },
  shopName: { fontWeight: "600", marginTop: 2, color: "#6200EE", fontSize: 13 },
  smallBtn: { paddingVertical: 6, paddingHorizontal: 15, borderRadius: 6 },
  smallText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  modalTitle: { fontSize: 17, fontWeight: "bold", color: "#111" },
  modalClose: { fontSize: 14, color: "#6B7280", fontWeight: "bold" },
  modalItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 13, paddingHorizontal: 10, borderBottomWidth: 1, borderColor: "#F3F4F6", borderRadius: 6 },
  modalItemActive: { backgroundColor: "#F5F3FF" },
  modalItemText: { fontSize: 15, color: "#1F2937" },
});