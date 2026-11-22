import React, { useCallback, useEffect, useState } from "react";
import { FlatList, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { sendLocalPushNotification } from "../services/pushNotificationService";

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    try {
      const s = await AsyncStorage.getItem("my_notifications");
      setNotifications(s ? JSON.parse(s) : []);
    } catch (e) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); const u = navigation.addListener("focus", load); return u; }, [navigation, load]);

  const saveNotifs = async (list) => { setNotifications(list); await AsyncStorage.setItem("my_notifications", JSON.stringify(list)); };

  const markAllRead = () => saveNotifs(notifications.map(n => ({ ...n, read: true })));

  const sendReply = async () => {
    if (!selected || !replyText.trim()) return;
    try {
      const s = await AsyncStorage.getItem("chat_messages");
      const chats = s ? JSON.parse(s) : [];
      const ownerMsg = { id: Date.now(), sender: "owner", text: replyText.trim(), createdAt: new Date().toISOString() };
      await AsyncStorage.setItem("chat_messages", JSON.stringify([...chats, ownerMsg]));
      sendLocalPushNotification("🏪 Shop Replied", replyText.trim(), { screen: "Chat" });
      await saveNotifs(notifications.map(n => n.id === selected.id ? { ...n, read: true, replied: true } : n));
    } catch (e) {}
    setSelected(null); setReplyText(""); setToast("Reply sent to customer ✓");
    setTimeout(() => setToast(""), 2500);
  };

  const unread = notifications.filter(n => !n.read).length;

  if (loading) return <SafeAreaView style={styles.center}><Text style={{fontSize:40}}>🔔</Text><Text style={styles.muted}>Loading notifications...</Text></SafeAreaView>;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.box}>
        <Text style={styles.title}>Notifications</Text>
        <Text style={styles.muted}>{unread > 0 ? unread + " unread" : "All caught up"}</Text>
        {unread > 0 && <TouchableOpacity onPress={markAllRead}><Text style={styles.markRead}>Mark all read</Text></TouchableOpacity>}

        {notifications.length === 0 ? (
          <View style={styles.center}><Text style={{fontSize:45}}>🔔</Text><Text style={styles.empty}>No notifications yet.{"\n"}When a customer asks a new question in Chat, it will appear here.</Text></View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(i) => String(i.id)}
            renderItem={({ item }) => (
              <View style={[styles.card, !item.read && styles.unreadCard]}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.body}>{item.body}</Text>
                <Text style={styles.date}>{item.date}</Text>
                {item.type === "chat" && !item.replied && (
                  <TouchableOpacity style={styles.replyBtn} onPress={() => { setSelected(item); setReplyText(""); }}>
                    <Text style={{color:"#fff",fontWeight:"bold"}}>✍️ Reply to Customer</Text>
                  </TouchableOpacity>
                )}
                {item.replied && <Text style={styles.repliedText}>✓ You replied to this question</Text>}
              </View>
            )}
          />
        )}
      </View>

      {toast ? <View style={styles.toast}><Text style={{color:"#fff",fontWeight:"600"}}>{toast}</Text></View> : null}

      {selected && (
        <View style={styles.overlay}><View style={styles.modalCard}>
          <Text style={{fontSize:40}}>💬</Text>
          <Text style={styles.modalTitle}>Reply to Customer</Text>
          <Text style={styles.modalQ}>Customer asked:{"\n"}"{selected.body}"</Text>
          <TextInput style={styles.replyInput} placeholder="Type your answer here..." multiline value={replyText} onChangeText={setReplyText} />
          <TouchableOpacity style={styles.sendReplyBtn} onPress={sendReply}><Text style={{color:"#fff",fontWeight:"bold"}}>Send Reply</Text></TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelected(null)}><Text style={{fontWeight:"bold"}}>Cancel</Text></TouchableOpacity>
        </View></View>
      )}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:"#F1F3F6"}, box:{flex:1,padding:16}, center:{flex:1,justifyContent:"center",alignItems:"center",padding:24},
  title:{fontSize:24,fontWeight:"700"}, muted:{marginTop:4,marginBottom:10,color:"#667085",fontSize:13}, markRead:{color:"#2457C5",fontWeight:"700",marginBottom:12},
  empty:{marginTop:14,textAlign:"center",color:"#667085",lineHeight:20},
  card:{backgroundColor:"#FFF",borderRadius:10,padding:14,marginBottom:10,borderLeftWidth:4,borderLeftColor:"transparent"}, unreadCard:{backgroundColor:"#EFF4FF",borderLeftColor:"#2457C5"},
  cardTitle:{fontSize:16,fontWeight:"700"}, body:{marginTop:6,fontSize:14,color:"#475467",lineHeight:20}, date:{marginTop:8,fontSize:12,color:"#98A2B3"},
  replyBtn:{backgroundColor:"#2457C5",padding:11,borderRadius:8,alignItems:"center",marginTop:12}, repliedText:{color:"#16A34A",fontWeight:"600",fontSize:12,marginTop:10},
  toast:{position:"absolute",bottom:30,left:20,right:20,backgroundColor:"#111827",padding:12,borderRadius:8,alignItems:"center"},
  overlay:{position:"absolute",top:0,left:0,right:0,bottom:0,backgroundColor:"rgba(0,0,0,0.6)",justifyContent:"center",alignItems:"center"}, modalCard:{backgroundColor:"#fff",borderRadius:16,padding:22,alignItems:"center",width:"88%"},
  modalTitle:{fontSize:19,fontWeight:"bold",marginTop:8}, modalQ:{textAlign:"center",color:"#555",marginTop:8,lineHeight:20}, replyInput:{width:"100%",minHeight:70,borderWidth:1,borderColor:"#ccc",borderRadius:10,padding:12,marginTop:14,textAlignVertical:"top"},
  sendReplyBtn:{backgroundColor:"#16A34A",padding:13,borderRadius:10,alignItems:"center",marginTop:14,width:"100%"}, cancelBtn:{backgroundColor:"#F3F4F6",padding:13,borderRadius:10,alignItems:"center",marginTop:10,width:"100%",borderWidth:1,borderColor:"#ccc"}
});