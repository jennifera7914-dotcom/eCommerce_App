import React,{useCallback,useEffect,useRef,useState} from "react";
import {FlatList,KeyboardAvoidingView,Platform,SafeAreaView,ScrollView,StyleSheet,Text,TextInput,TouchableOpacity,View} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const QUICK=[
  "When will my order arrive?",
  "Is Cash on Delivery (COD) available?",
  "What is the minimum order quantity?",
  "Can I get the owner's contact number?"
];

function getBotReply(text){
  const t=text.toLowerCase();
  if(t.includes("hello")||t.includes("hi")||t.includes("hey")||t.includes("namaste"))
    return "Hello! Welcome to Mobile Accessory Hub. I am the shop auto-assistant. You can ask me about delivery, COD, stock and price here. If I cannot answer, the shop owner will reply in this same chat.";
  if(t.includes("owner number")||t.includes("owner contact")||t.includes("owner phone")||t.includes("owner mobile")||t.includes("contact number")||t.includes("phone number of owner"))
    return "Sorry, the owner's personal number is not shared for privacy. Please continue chatting here only. The owner will reply in this chat itself. You can also see shop address in your Profile page.";
  if(t.includes("cod")||t.includes("cash on delivery")||t.includes("payment")||t.includes("pay")||t.includes("upi")||t.includes("card")||t.includes("online payment"))
    return "Only Cash on Delivery (COD) is available in our shop. No UPI, card or online payment. You pay cash when your product is delivered to your shop.";
  if(t.includes("minimum")||t.includes("bulk")||t.includes("wholesale")||t.includes("quantity"))
    return "Minimum order is 10 pieces per product. Wholesale price is shown on the product page. For 50+ pieces, owner will give extra discount in chat.";
  if(t.includes("arrive")||t.includes("delivery")||t.includes("deliver")||t.includes("track"))
    return "Your order will be delivered within 5 working days. You can see expected delivery date in the Orders page. After receiving, tap Confirm Delivery there.";
  if(t.includes("stock")||t.includes("available")||t.includes("in stock"))
    return "GREEN 'In Stock' badge means product is available. RED 'Out of Stock' means not available. Available quantity is shown on product page.";
  if(t.includes("price")||t.includes("cost")||t.includes("how much"))
    return "Price shown on product page is the wholesale MRP. No extra delivery charge. Total is calculated by quantity x price in Cart and Buy page.";
  if(t.includes("return")||t.includes("refund")||t.includes("replace"))
    return "Sorry, return facility is not available in this shop. If product is damaged, please inform owner in this chat with photo. Owner will check and guide you.";
  if(t.includes("address")||t.includes("where is shop")||t.includes("location"))
    return "Your delivery will come to the shop address saved in your Profile. If you want to change address, please inform owner in this chat.";
  if(t.includes("cancel"))
    return "To cancel an order, please inform owner immediately in this chat with your Order ID from Orders page. Owner will confirm cancellation.";
  if(t.includes("thank"))
    return "You are welcome! If you need anything else, please type here. Owner will reply in this chat.";
  return null;
}

function timeOf(msg){ if(!msg.createdAt) return ""; const d=new Date(msg.createdAt); let h=d.getHours(); const m=String(d.getMinutes()).padStart(2,"0"); const ampm=h>=12?"PM":"AM"; h=h%12||12; return `${h}:${m} ${ampm}`; }

export default function ChatScreen({navigation}){
  const [messages,setMessages]=useState([]); const [input,setInput]=useState(""); const [loading,setLoading]=useState(true); const [typing,setTyping]=useState(false);
  const listRef=useRef(null); const messagesRef=useRef([]); const keyRef=useRef("chat_guest"); const userRef=useRef({});

  const save=async(msgs)=>{
    messagesRef.current=msgs; setMessages(msgs);
    await AsyncStorage.setItem(keyRef.current, JSON.stringify(msgs));
    const last=msgs[msgs.length-1];
    if(last){
      const suffix=keyRef.current.replace("chat_","");
      await AsyncStorage.setItem(`chat_meta_${suffix}`, JSON.stringify({suffix, name:userRef.current.name||"Customer", shopName:userRef.current.shopName||"", phone:userRef.current.phone||"", lastMessage:last.text, lastTime:last.createdAt}));
    }
  };

  const load=useCallback(async()=>{
    try{
      const s=await AsyncStorage.getItem("user"); const u=s?JSON.parse(s):{}; userRef.current=u;
      const suffix=String(u.id||u.userId||u.phone||"guest"); keyRef.current=`chat_${suffix}`;
      const stored=await AsyncStorage.getItem(keyRef.current);
      if(stored){ const p=JSON.parse(stored); messagesRef.current=p; setMessages(p); }
      else{ await save([{id:1,sender:"bot",text:"Hello! Welcome to Mobile Accessory Hub. Tap a quick question below or type your message.",createdAt:new Date().toISOString()}]); }
    }catch(e){}
    setLoading(false);
  },[]);

  useEffect(()=>{ load(); const unsub=navigation.addListener("focus",load); return unsub; },[load,navigation]);

  const sendText=async(text)=>{
    const clean=(text||"").trim(); if(!clean) return; setInput("");
    const customerMsg={id:Date.now(),sender:"customer",text:clean,createdAt:new Date().toISOString()};
    await save([...messagesRef.current,customerMsg]); setTyping(true);
    setTimeout(async()=>{
      const botAnswer=getBotReply(clean);
      let botMsg;
      if(botAnswer){
        botMsg={id:Date.now()+2,sender:"bot",text:botAnswer,createdAt:new Date().toISOString(),isQuickAnswer:true,replyToId:customerMsg.id,replyToText:clean};
      }else{
        botMsg={id:Date.now()+2,sender:"bot",text:"Thank you for your message. The shop owner has been notified and will reply here soon. Please check this chat after some time.",createdAt:new Date().toISOString(),isThankYou:true,replyToId:customerMsg.id,replyToText:clean};
      }
      await save([...messagesRef.current,botMsg]); setTyping(false);
      setTimeout(()=>listRef.current?.scrollToEnd({animated:true}),300);
    },700);
  };

  const renderItem=({item})=>{
    const isCustomer=item.sender==="customer"; const isBot=item.sender==="bot";
    return (
      <View style={[styles.row,isCustomer?styles.rowRight:styles.rowLeft]}>
        <View style={[styles.bubble,isCustomer?styles.me:styles.other]}>
          {!isCustomer && <Text style={styles.who}>{isBot?"🤖 Auto-reply":"🏪 Shop Owner"}</Text>}
          {item.replyToText ? <View style={styles.quoteBox}><Text style={styles.quoteText} numberOfLines={2}>↩ {item.replyToText}</Text></View> : null}
          <Text style={[styles.text,isCustomer?styles.textMe:styles.textOther]}>{item.text}</Text>
          <Text style={[styles.time,isCustomer?styles.timeMe:styles.timeOther]}>{timeOf(item)}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==="ios"?"padding":undefined} keyboardVerticalOffset={90}>
        {loading?(<View style={styles.center}><Text style={{fontSize:40}}>💬</Text><Text style={styles.muted}>Loading...</Text></View>):(
          <FlatList ref={listRef} data={messages} keyExtractor={(m)=>String(m.id)} renderItem={renderItem} contentContainerStyle={{padding:12}} onContentSizeChange={()=>listRef.current?.scrollToEnd({animated:false})} ListFooterComponent={typing?<Text style={styles.typing}>Shop is typing...</Text>:null}/>
        )}
        <View style={styles.quickBox}>
          <Text style={styles.quickTitle}>Tap a question:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal:12}}>
            {QUICK.map((q)=>(<TouchableOpacity key={q} style={styles.chip} onPress={()=>sendText(q)}><Text style={styles.chipText}>{q}</Text></TouchableOpacity>))}
          </ScrollView>
        </View>
        <View style={styles.inputRow}>
          <TextInput style={styles.input} placeholder="Type your message..." placeholderTextColor="#98A2B3" value={input} onChangeText={setInput} onSubmitEditing={()=>sendText(input)} returnKeyType="send"/>
          <TouchableOpacity style={[styles.sendBtn,!input.trim()&&styles.sendDisabled]} disabled={!input.trim()} onPress={()=>sendText(input)}><Text style={styles.sendText}>Send</Text></TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:"#F1F3F6"},center:{flex:1,justifyContent:"center",alignItems:"center",padding:24},muted:{marginTop:8,fontSize:13,color:"#667085",textAlign:"center"},typing:{color:"#667085",fontSize:12,marginLeft:8,marginTop:4,fontStyle:"italic"},row:{flexDirection:"row",marginVertical:5},rowRight:{justifyContent:"flex-end"},rowLeft:{justifyContent:"flex-start"},bubble:{maxWidth:"80%",borderRadius:14,padding:12},me:{backgroundColor:"#2457C5",borderBottomRightRadius:3},other:{backgroundColor:"#FFF",borderBottomLeftRadius:3},who:{fontSize:11,fontWeight:"700",color:"#667085",marginBottom:4},quoteBox:{backgroundColor:"rgba(0,0,0,0.08)",borderLeftWidth:3,borderLeftColor:"#2457C5",borderRadius:6,padding:6,marginBottom:6},quoteText:{fontSize:11,color:"#555",fontStyle:"italic"},text:{fontSize:15,lineHeight:21},textMe:{color:"#FFF"},textOther:{color:"#212121"},time:{fontSize:11,marginTop:6,alignSelf:"flex-end"},timeMe:{color:"#C7D7FE"},timeOther:{color:"#98A2B3"},quickBox:{paddingTop:8,paddingBottom:6,backgroundColor:"#FFF",borderTopWidth:1,borderTopColor:"#EAECF0"},quickTitle:{marginLeft:12,marginBottom:6,fontSize:12,fontWeight:"600",color:"#667085"},chip:{marginRight:8,paddingHorizontal:14,paddingVertical:10,borderRadius:20,backgroundColor:"#EFF4FF"},chipText:{fontSize:13,fontWeight:"600",color:"#2457C5"},inputRow:{flexDirection:"row",alignItems:"center",padding:10,backgroundColor:"#FFF"},input:{flex:1,paddingHorizontal:16,paddingVertical:10,borderRadius:22,backgroundColor:"#F2F4F7",fontSize:15},sendBtn:{marginLeft:8,paddingHorizontal:20,paddingVertical:12,borderRadius:22,backgroundColor:"#2457C5"},sendDisabled:{backgroundColor:"#AAB4C5"},sendText:{fontSize:15,fontWeight:"700",color:"#FFF"}});