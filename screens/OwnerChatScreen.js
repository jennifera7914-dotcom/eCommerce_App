import React,{useState,useEffect,useRef,useCallback} from "react";
import {View,Text,FlatList,TextInput,TouchableOpacity,StyleSheet,SafeAreaView,KeyboardAvoidingView,Platform,ScrollView} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

function timeOf(msg){ if(!msg.createdAt) return ""; const d=new Date(msg.createdAt); let h=d.getHours(); const m=String(d.getMinutes()).padStart(2,"0"); const ampm=h>=12?"PM":"AM"; h=h%12||12; return `${h}:${m} ${ampm}`; }
function isBotAnswered(msg){ return msg.isQuickAnswer || (msg.sender==="bot" && !msg.isThankYou && !msg.text.includes("owner has been notified")); }

export default function OwnerChatScreen({navigation}){
  const [inbox,setInbox]=useState([]); const [sent,setSent]=useState([]); const [tab,setTab]=useState("inbox");
  const [selected,setSelected]=useState(null); const [threadType,setThreadType]=useState("pending");
  const [displayMessages,setDisplayMessages]=useState([]); const [input,setInput]=useState("");
  const listRef=useRef(null);

  const loadAll=useCallback(async()=>{
    try{
      const keys=await AsyncStorage.getAllKeys();
      const chatKeys=keys.filter(k=>k.startsWith("chat_") && !k.startsWith("chat_meta_"));
      let inboxList=[]; let sentList=[];
      for(const key of chatKeys){
        const suffix=key.replace("chat_","");
        const s=await AsyncStorage.getItem(key); if(!s) continue;
        const msgs=JSON.parse(s);
        const metaStr=await AsyncStorage.getItem(`chat_meta_${suffix}`); const meta=metaStr?JSON.parse(metaStr):{};
        const pending=[]; const pairs=[];
        for(let i=0;i<msgs.length;i++){
          if(msgs[i].sender!=="customer") continue;
          let answered=false; let ownerReply=null;
          for(let j=i+1;j<msgs.length;j++){
            if(msgs[j].sender==="customer") break;
            if(msgs[j].sender==="bot" && isBotAnswered(msgs[j])){ answered=true; break; }
            if(msgs[j].sender==="owner"){ answered=true; ownerReply=msgs[j]; break; }
          }
          if(!answered) pending.push(msgs[i]);
          else if(ownerReply) pairs.push({question:msgs[i], reply:ownerReply});
        }
        if(pending.length>0) inboxList.push({suffix, name:meta.name||"Customer", shopName:meta.shopName||"", phone:meta.phone||"", question:pending[pending.length-1], pendingCount:pending.length, lastTime:pending[pending.length-1].createdAt});
        if(pairs.length>0) sentList.push({suffix, name:meta.name||"Customer", shopName:meta.shopName||"", phone:meta.phone||"", question:pairs[pairs.length-1].question, reply:pairs[pairs.length-1].reply, lastTime:pairs[pairs.length-1].reply.createdAt});
      }
      inboxList.sort((a,b)=>new Date(b.lastTime)-new Date(a.lastTime));
      sentList.sort((a,b)=>new Date(b.lastTime)-new Date(a.lastTime));
      setInbox(inboxList); setSent(sentList);
    }catch(e){}
  },[]);

  useEffect(()=>{ loadAll(); const u=navigation.addListener("focus",loadAll); return u; },[navigation,loadAll]);

  const openPending=async(item)=>{
    setSelected(item); setThreadType("pending");
    const s=await AsyncStorage.getItem(`chat_${item.suffix}`); const msgs=s?JSON.parse(s):[];
    const pending=[];
    for(let i=0;i<msgs.length;i++){
      if(msgs[i].sender!=="customer") continue;
      let answered=false;
      for(let j=i+1;j<msgs.length;j++){ if(msgs[j].sender==="customer") break; if(msgs[j].sender==="bot" && isBotAnswered(msgs[j])){answered=true;break;} if(msgs[j].sender==="owner"){answered=true;break;} }
      if(!answered) pending.push(msgs[i]);
    }
    setDisplayMessages(pending);
  };

  const openSent=async(item)=>{
    setSelected(item); setThreadType("sent");
    const s=await AsyncStorage.getItem(`chat_${item.suffix}`); const msgs=s?JSON.parse(s):[];
    const pairs=[];
    for(let i=0;i<msgs.length;i++){
      if(msgs[i].sender!=="customer") continue;
      for(let j=i+1;j<msgs.length;j++){ if(msgs[j].sender==="customer") break; if(msgs[j].sender==="owner"){ pairs.push(msgs[i], msgs[j]); break; } if(msgs[j].sender==="bot" && isBotAnswered(msgs[j])) break; }
    }
    setDisplayMessages(pairs);
  };

  const sendReply=async()=>{
    const text=input.trim(); if(!text||!selected) return;
    const latestPending=displayMessages[displayMessages.length-1];
    const ownerMsg={id:Date.now(),sender:"owner",text,createdAt:new Date().toISOString(),replyToId:latestPending?.id,replyToText:latestPending?.text};
    const key=`chat_${selected.suffix}`;
    const s=await AsyncStorage.getItem(key); const msgs=s?JSON.parse(s):[];
    const updated=[...msgs,ownerMsg];
    await AsyncStorage.setItem(key, JSON.stringify(updated));
    const metaStr=await AsyncStorage.getItem(`chat_meta_${selected.suffix}`);
    if(metaStr){ const meta=JSON.parse(metaStr); meta.lastMessage=text; meta.lastTime=ownerMsg.createdAt; await AsyncStorage.setItem(`chat_meta_${selected.suffix}`, JSON.stringify(meta)); }
    setInput(""); setSelected(null); setDisplayMessages([]); setTab("sent"); loadAll();
  };

  const renderMsg=({item})=>{
    const isOwner=item.sender==="owner"; const isBot=item.sender==="bot";
    return (
      <View style={[styles.row,isOwner?styles.rowRight:styles.rowLeft]}>
        <View style={[styles.bubble,isOwner?styles.ownerBubble:isBot?styles.botBubble:styles.customerBubble]}>
          {!isOwner && <Text style={styles.who}>{isBot?"🤖 Auto-reply":"👤 Customer"}</Text>}
          {isOwner && <Text style={styles.whoOwner}>🏪 You (Owner)</Text>}
          {item.replyToText ? <View style={styles.quoteBox}><Text style={styles.quoteText} numberOfLines={2}>↩ {item.replyToText}</Text></View> : null}
          <Text style={[styles.text,isOwner?styles.textOwner:styles.textOther]}>{item.text}</Text>
          <Text style={[styles.time,isOwner?styles.timeOwner:styles.timeOther]}>{timeOf(item)}</Text>
        </View>
      </View>
    );
  };

  if(selected){
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={()=>{setSelected(null); setDisplayMessages([]); loadAll();}}><Text style={{color:"#fff",fontWeight:"bold"}}>← Back</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>{selected.name}</Text>
          <Text style={styles.headerSub}>🏪 {selected.shopName||""} | 📞 {selected.phone||""} | {threadType==="pending"?"Replying to pending question":"Replied conversation"}</Text>
        </View>
        <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==="ios"?"padding":undefined} keyboardVerticalOffset={90}>
          <FlatList ref={listRef} data={displayMessages} keyExtractor={(m)=>String(m.id)} renderItem={renderMsg} contentContainerStyle={{padding:12}} onContentSizeChange={()=>listRef.current?.scrollToEnd({animated:false})}/>
          {threadType==="pending" ? (
            <View style={styles.inputRow}>
              <TextInput style={styles.input} placeholder={`Reply only to ${selected.name}...`} placeholderTextColor="#98A2B3" value={input} onChangeText={setInput} onSubmitEditing={sendReply} returnKeyType="send"/>
              <TouchableOpacity style={[styles.sendBtn,!input.trim()&&styles.sendDisabled]} disabled={!input.trim()} onPress={sendReply}><Text style={styles.sendText}>Send</Text></TouchableOpacity>
            </View>
          ) : (
            <View style={styles.sentNote}><Text style={{color:"#666",fontSize:12}}>✓ Already replied. This conversation is in Sent.</Text></View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  const list = tab==="inbox" ? inbox : sent;
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}><Text style={styles.headerTitle}>💬 Chat Management</Text><Text style={styles.headerSub}>Inbox = need reply | Sent = already replied</Text></View>
      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab,tab==="inbox"&&styles.tabActive]} onPress={()=>setTab("inbox")}><Text style={[styles.tabText,tab==="inbox"&&styles.tabTextActive]}>📥 Inbox ({inbox.length})</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.tab,tab==="sent"&&styles.tabActive]} onPress={()=>setTab("sent")}><Text style={[styles.tabText,tab==="sent"&&styles.tabTextActive]}>📤 Sent ({sent.length})</Text></TouchableOpacity>
      </View>
      {list.length===0 ? (
        <View style={styles.center}><Text style={{fontSize:50}}>💬</Text><Text style={styles.emptyTitle}>{tab==="inbox"?"No Questions Waiting":"No Replied Chats Yet"}</Text><Text style={styles.muted}>{tab==="inbox"?"New customer questions will appear here only. Bot-answered questions will not come here.":"When you reply from Inbox, that chat will move here."}</Text></View>
      ) : (
        <ScrollView>
          {list.map((item,idx)=>(
            <TouchableOpacity key={idx} style={styles.inboxRow} onPress={()=> tab==="inbox" ? openPending(item) : openSent(item)}>
              <View style={styles.avatar}><Text style={{fontSize:20}}>👤</Text></View>
              <View style={{flex:1}}>
                <View style={{flexDirection:"row",justifyContent:"space-between"}}><Text style={{fontWeight:"bold"}}>{item.name}</Text><Text style={{fontSize:11,color:"#888"}}>{item.lastTime?new Date(item.lastTime).toLocaleDateString("en-IN",{day:"numeric",month:"short"}):""}</Text></View>
                <Text style={{fontSize:12,color:"#6200EE",fontWeight:"600"}}>🏪 {item.shopName||"-"} | 📞 {item.phone||"-"}</Text>
                <Text numberOfLines={1} style={{fontSize:13,color:"#555",marginTop:2}}>Q: {item.question?.text||""}</Text>
                {tab==="sent" && item.reply ? <Text numberOfLines={1} style={{fontSize:12,color:"#16A34A",marginTop:2}}>A: {item.reply.text}</Text> : null}
              </View>
              {tab==="inbox" && <View style={styles.unreadDot}><Text style={{color:"#fff",fontSize:11,fontWeight:"bold"}}>{item.pendingCount||1}</Text></View>}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:"#F1F3F6"},header:{backgroundColor:"#6200EE",padding:16},headerTitle:{fontSize:20,fontWeight:"bold",color:"#fff",marginTop:6},headerSub:{fontSize:12,color:"#E9D5FF",marginTop:4},tabRow:{flexDirection:"row",gap:8,padding:12,backgroundColor:"#fff"},tab:{flex:1,paddingVertical:10,borderRadius:8,backgroundColor:"#E5E7EB",alignItems:"center"},tabActive:{backgroundColor:"#6200EE"},tabText:{fontWeight:"600",fontSize:13,color:"#374151"},tabTextActive:{color:"#fff",fontWeight:"bold"},center:{flex:1,justifyContent:"center",alignItems:"center",padding:24},muted:{marginTop:8,fontSize:13,color:"#667085",textAlign:"center",lineHeight:19},emptyTitle:{marginTop:8,fontSize:17,fontWeight:"700"},inboxRow:{flexDirection:"row",backgroundColor:"#fff",marginHorizontal:10,marginBottom:8,padding:12,borderRadius:10,alignItems:"center",gap:10,borderWidth:1,borderColor:"#E5E7EB"},avatar:{width:46,height:46,borderRadius:23,backgroundColor:"#F5F3FF",justifyContent:"center",alignItems:"center"},unreadDot:{width:24,height:24,borderRadius:12,backgroundColor:"#DC2626",justifyContent:"center",alignItems:"center"},row:{flexDirection:"row",marginVertical:5},rowRight:{justifyContent:"flex-end"},rowLeft:{justifyContent:"flex-start"},bubble:{maxWidth:"82%",borderRadius:14,padding:12},customerBubble:{backgroundColor:"#FFF",borderBottomLeftRadius:3},botBubble:{backgroundColor:"#F3F4F6",borderBottomLeftRadius:3,borderWidth:1,borderColor:"#E5E7EB"},ownerBubble:{backgroundColor:"#6200EE",borderBottomRightRadius:3},who:{fontSize:11,fontWeight:"700",color:"#667085",marginBottom:4},whoOwner:{fontSize:11,fontWeight:"700",color:"#E9D5FF",marginBottom:4},quoteBox:{backgroundColor:"rgba(0,0,0,0.08)",borderLeftWidth:3,borderLeftColor:"#6200EE",borderRadius:6,padding:6,marginBottom:6},quoteText:{fontSize:11,color:"#555",fontStyle:"italic"},text:{fontSize:15,lineHeight:21},textOwner:{color:"#FFF"},textOther:{color:"#212121"},time:{fontSize:11,marginTop:6,alignSelf:"flex-end"},timeOwner:{color:"#DDD6FE"},timeOther:{color:"#98A2B3"},inputRow:{flexDirection:"row",alignItems:"center",padding:10,backgroundColor:"#FFF",borderTopWidth:1,borderTopColor:"#EAECF0"},input:{flex:1,paddingHorizontal:16,paddingVertical:10,borderRadius:22,backgroundColor:"#F2F4F7",fontSize:15},sendBtn:{marginLeft:8,paddingHorizontal:20,paddingVertical:12,borderRadius:22,backgroundColor:"#6200EE"},sendDisabled:{backgroundColor:"#AAB4C5"},sendText:{fontSize:15,fontWeight:"700",color:"#FFF"},sentNote:{padding:12,backgroundColor:"#fff",alignItems:"center",borderTopWidth:1,borderColor:"#EEE"}});