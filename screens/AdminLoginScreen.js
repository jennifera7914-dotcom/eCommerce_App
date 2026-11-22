import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { API_BASE_URL } from "../src/api/config";

export default function AdminLoginScreen({ navigation }) {
  // mode: loading | setup | login | error
  const [mode, setMode] = useState("loading");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null); // { text, isError }

  // Login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  // One-time setup fields
  const [setupEmail, setSetupEmail] = useState("");
  const [setupRecoveryEmail, setSetupRecoveryEmail] = useState("");
  const [setupPassword, setSetupPassword] = useState("");
  const [setupConfirmPassword, setSetupConfirmPassword] = useState("");
  const [showSetupPass, setShowSetupPass] = useState(false);

  // Forgot password fields
  const [showForgotPass, setShowForgotPass] = useState(false);
  const [showForgotEmail, setShowForgotEmail] = useState(false);
  const [fpEmail, setFpEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPass, setNewPass] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  // Forgot email field
  const [feRecoveryEmail, setFeRecoveryEmail] = useState("");

  const showMsg = (text, isError = false) => setMsg({ text, isError });
  const isGmail = (v) => (v || "").trim().toLowerCase().endsWith("@gmail.com");

  const checkSetup = async () => {
    setMode("loading");
    setMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/check-setup`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Could not check owner setup");
      const exists = data.setupCompleted ?? data.exists ?? data.isSetup ?? false;
      setMode(exists ? "login" : "setup");
    } catch (e) {
      setMode("error");
      setMsg({
        text: "Cannot connect to backend. Start IntelliJ backend on port 8080 and check Wi-Fi/IP.",
        isError: true,
      });
    }
  };

  useEffect(() => {
    checkSetup();
  }, []);

  // ONE-TIME OWNER SETUP - locked by backend after first owner
  const handleSetup = async () => {
    if (!setupEmail.trim() || !setupRecoveryEmail.trim() || !setupPassword) {
      showMsg("Please fill Primary Email, Recovery Email and Password", true);
      return;
    }
    if (!isGmail(setupEmail)) {
      showMsg("Primary email must end with @gmail.com", true);
      return;
    }
    if (!isGmail(setupRecoveryEmail)) {
      showMsg("Recovery email must end with @gmail.com", true);
      return;
    }
    if (setupEmail.trim().toLowerCase() === setupRecoveryEmail.trim().toLowerCase()) {
      showMsg("Primary and Recovery email must be different", true);
      return;
    }
    if (setupPassword.length < 4) {
      showMsg("Password must be at least 4 characters", true);
      return;
    }
    if (setupPassword !== setupConfirmPassword) {
      showMsg("Password and Confirm Password do not match", true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: setupEmail.trim().toLowerCase(),
          recoveryEmail: setupRecoveryEmail.trim().toLowerCase(),
          password: setupPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        await AsyncStorage.setItem("admin", JSON.stringify(data));
        navigation.replace("AdminDashboardScreen");
      } else {
        showMsg(data.message || "Owner setup failed", true);
      }
    } catch (e) {
      showMsg("Cannot connect to backend. Is server running on port 8080?", true);
    }
    setLoading(false);
  };

  // OWNER LOGIN
  const handleLogin = async () => {
    if (!email.trim() || !password) {
      showMsg("Please enter Email and Password", true);
      return;
    }
    if (!isGmail(email)) {
      showMsg("Owner Email must end with @gmail.com", true);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        await AsyncStorage.setItem("admin", JSON.stringify(data));
        navigation.replace("AdminDashboardScreen");
      } else {
        showMsg(data.message || "Wrong email or password", true);
      }
    } catch (e) {
      showMsg("Cannot connect to backend. Is server running on port 8080?", true);
    }
    setLoading(false);
  };

  // FORGOT PASSWORD - Step 1: OTP
  const handleRequestOtp = async () => {
    if (!isGmail(fpEmail)) {
      showMsg("Primary email must end with @gmail.com", true);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/forgot-password/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fpEmail.trim().toLowerCase() }),
      });
      const out = await res.json().catch(() => ({}));
      if (res.ok) {
        showMsg(out.message || "OTP sent to your Gmail");
        setOtpSent(true);
      } else showMsg(out.message || "Failed to send OTP", true);
    } catch {
      showMsg("Cannot connect to backend", true);
    }
  };

  // FORGOT PASSWORD - Step 2: reset
  const handleResetPass = async () => {
    if (!otp || !newPass) {
      showMsg("Enter OTP and New Password", true);
      return;
    }
    if (newPass.length < 4) {
      showMsg("Password must be at least 4 characters", true);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/forgot-password/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: fpEmail.trim().toLowerCase(),
          otp,
          newPassword: newPass,
        }),
      });
      const out = await res.json().catch(() => ({}));
      if (res.ok) {
        showMsg(out.message || "Password reset successfully. Please login.");
        setShowForgotPass(false);
        setOtpSent(false);
        setOtp("");
        setNewPass("");
      } else showMsg(out.message || "Password reset failed", true);
    } catch {
      showMsg("Cannot connect to backend", true);
    }
  };

  // FORGOT EMAIL
  const handleForgotEmail = async () => {
    if (!isGmail(feRecoveryEmail)) {
      showMsg("Recovery email must end with @gmail.com", true);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/forgot-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recoveryEmail: feRecoveryEmail.trim().toLowerCase() }),
      });
      const out = await res.json().catch(() => ({}));
      if (res.ok) showMsg(out.message || "Primary email sent to recovery email");
      else showMsg(out.message || "Failed", true);
    } catch {
      showMsg("Cannot connect to backend", true);
    }
  };

  if (mode === "loading") {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6200EE" />
        <Text style={styles.centerText}>Checking owner setup...</Text>
      </View>
    );
  }

  if (mode === "error") {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 42 }}>⚠️</Text>
        <Text style={styles.centerTitle}>Backend Not Reachable</Text>
        {msg ? <Text style={styles.centerText}>{msg.text}</Text> : null}
        <TouchableOpacity style={styles.btn} onPress={checkSetup}>
          <Text style={styles.btnText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          <Text style={styles.linkBack}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#fff" }}
      contentContainerStyle={{ padding: 30, paddingTop: 60 }}
    >
      <Text style={styles.title}>
        {mode === "setup" ? "🔐 Create Owner Account" : "🔑 Owner Login"}
      </Text>
      <Text style={styles.sub}>Mobile Accessory Hub - Owner Only</Text>

      {msg ? (
        <View style={[styles.msgBox, msg.isError ? styles.msgError : styles.msgOk]}>
          <Text style={{ color: msg.isError ? "#B91C1C" : "#166534", fontWeight: "600" }}>
            {msg.text}
          </Text>
        </View>
      ) : null}

      {mode === "setup" ? (
        <>
          <View style={styles.lockBox}>
            <Text style={styles.lockTitle}>One-Time Setup</Text>
            <Text style={styles.lockText}>
              This owner account can be created only once. After creation, this setup is locked.
            </Text>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Primary Owner Email *"
            value={setupEmail}
            onChangeText={setSetupEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Recovery Email * (different Gmail)"
            value={setupRecoveryEmail}
            onChangeText={setSetupRecoveryEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <View style={styles.passRow}>
            <TextInput
              style={styles.passInput}
              placeholder="Create Password *"
              secureTextEntry={!showSetupPass}
              value={setupPassword}
              onChangeText={setSetupPassword}
            />
            <TouchableOpacity onPress={() => setShowSetupPass(!showSetupPass)} style={styles.eyeBtn}>
              <Text style={styles.eye}>{showSetupPass ? "🙈" : "👁️"}</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Confirm Password *"
            secureTextEntry={!showSetupPass}
            value={setupConfirmPassword}
            onChangeText={setSetupConfirmPassword}
          />

          <TouchableOpacity style={styles.btn} onPress={handleSetup} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Owner Account</Text>}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="Primary Owner Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <View style={styles.passRow}>
            <TextInput
              style={styles.passInput}
              placeholder="Password"
              secureTextEntry={!showPass}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
              <Text style={styles.eye}>{showPass ? "🙈" : "👁️"}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Login</Text>}
          </TouchableOpacity>

          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 14 }}>
            <TouchableOpacity
              onPress={() => {
                setShowForgotPass(!showForgotPass);
                setShowForgotEmail(false);
              }}
            >
              <Text style={styles.linkSmall}>Forgot Password?</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setShowForgotEmail(!showForgotEmail);
                setShowForgotPass(false);
              }}
            >
              <Text style={styles.linkSmall}>Forgot Email?</Text>
            </TouchableOpacity>
          </View>

          {showForgotPass && (
            <View style={styles.miniCard}>
              <Text style={styles.miniTitle}>Reset Password via OTP</Text>
              <TextInput
                style={styles.input}
                placeholder="Primary Owner Email"
                value={fpEmail}
                onChangeText={setFpEmail}
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.smallBtn} onPress={handleRequestOtp}>
                <Text style={styles.btnText}>Send OTP to Primary Email</Text>
              </TouchableOpacity>
              {otpSent && (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="6-Digit OTP"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={otp}
                    onChangeText={setOtp}
                  />
                  <View style={styles.passRow}>
                    <TextInput
                      style={styles.passInput}
                      placeholder="New Password (min 4 chars)"
                      secureTextEntry={!showNewPass}
                      value={newPass}
                      onChangeText={setNewPass}
                    />
                    <TouchableOpacity onPress={() => setShowNewPass(!showNewPass)} style={styles.eyeBtn}>
                      <Text style={styles.eye}>{showNewPass ? "🙈" : "👁️"}</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={styles.smallBtn} onPress={handleResetPass}>
                    <Text style={styles.btnText}>Reset Password</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {showForgotEmail && (
            <View style={styles.miniCard}>
              <Text style={styles.miniTitle}>Recover Primary Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Recovery Email"
                value={feRecoveryEmail}
                onChangeText={setFeRecoveryEmail}
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.smallBtn} onPress={handleForgotEmail}>
                <Text style={styles.btnText}>Send Primary Email to Recovery Email</Text>
              </TouchableOpacity>
              <Text style={styles.hintText}>
                We will email your Primary Owner Email to this Recovery Email.
              </Text>
            </View>
          )}
        </>
      )}

      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 22 }}>
        <Text style={styles.linkBack}>← Back to Choose Role</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff", padding: 24 },
  centerTitle: { fontSize: 20, fontWeight: "bold", marginTop: 12, color: "#111" },
  centerText: { color: "#666", marginTop: 8, textAlign: "center", lineHeight: 20 },
  title: { fontSize: 24, fontWeight: "bold", color: "#000" },
  sub: { color: "#6200EE", marginTop: 6, marginBottom: 18, fontWeight: "600" },
  msgBox: { padding: 12, borderRadius: 8, marginBottom: 14, borderWidth: 1 },
  msgOk: { backgroundColor: "#DCFCE7", borderColor: "#86EFAC" },
  msgError: { backgroundColor: "#FEE2E2", borderColor: "#FCA5A5" },
  lockBox: { backgroundColor: "#F5F3FF", borderWidth: 1, borderColor: "#DDD6FE", borderRadius: 10, padding: 12, marginBottom: 14 },
  lockTitle: { fontWeight: "bold", color: "#6200EE" },
  lockText: { color: "#555", marginTop: 4, lineHeight: 20, fontSize: 13 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 12, marginBottom: 10, backgroundColor: "#fff" },
  passRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#ddd", borderRadius: 8, marginBottom: 10, backgroundColor: "#fff" },
  passInput: { flex: 1, padding: 12 },
  eyeBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  eye: { fontSize: 18 },
  btn: { backgroundColor: "#6200EE", padding: 14, borderRadius: 8, alignItems: "center", marginTop: 4 },
  smallBtn: { backgroundColor: "#6200EE", padding: 12, borderRadius: 8, alignItems: "center", marginTop: 8 },
  btnText: { color: "#fff", fontWeight: "bold" },
  linkSmall: { color: "#6200EE", fontWeight: "600", fontSize: 13 },
  linkBack: { color: "#6200EE", fontWeight: "600" },
  miniCard: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, marginTop: 16, backgroundColor: "#F9FAFB" },
  miniTitle: { fontWeight: "bold", marginBottom: 10, color: "#111" },
  hintText: { color: "#666", fontSize: 12, marginTop: 8, lineHeight: 18 },
});