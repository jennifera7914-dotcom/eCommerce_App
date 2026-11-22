import React, { useState, useEffect } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { getImageUrl } from "../constants/api";
import { BACKEND_URL } from "../src/api/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createOrder } from "../src/api/ordersApi";
import { useShop } from "../src/context/ShopContext";

export default function BuyScreen({ route, navigation }) {
  const raw = route.params?.items || route.params?.cartItems || (route.params?.product ? [{...route.params.product, quantity: route.params.quantity||10}] : []);
  const normalized = raw.map(i => ({ id:i.productId||i.id, name:i.name, price:i.price||0, mrp:i.mrp||i.price||0, image1:i.image1||i.image||i.imageUrl||null, brand:i.brand, category:i.category, stockQty:i.stockQty||999, quantity:i.quantity||10 }));
  const [items, setItems] = useState(normalized);
  const [user, setUser] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const { clearCart } = useShop();

  useEffect(()=>{ (async()=>{ const s=await AsyncStorage.getItem("user"); if(s){ const p=JSON.parse(s); setUser(p.user?p.user:p); } })(); },[]);
  const totalQty = items.reduce((s,i)=>s+i.quantity,0);
  const totalAmount = items.reduce((s,i)=>s+(i.price*i.quantity),0);
  const deliveryDate = new Date(Date.now()+5*24*60*60*1000);
  const fmt = (d)=>d.toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short",year:"numeric"});
  const addressText = user?.address ? `${user.shopName ? user.shopName + ", " : ""}${user.address.line1||""}${user.address.line2 ? ", " + user.address.line2 : ""}, ${user.address.city||""}, ${user.address.state||""} - ${user.address.pincode||""}` : (user?.shopName || "Address on file");
  const changeQty=(id,q)=>{ if(q<1) return; setItems(items.map(i=>i.id===id?{...i,quantity:q}:i)); };

    const placeOrder = async () => {
    setPlacing(true);
    try {
      const saved = await createOrder({
        userId: user?.id || user?.userId,
        address: addressText,
        items,
      });
      setPlaced(saved);
    } catch (e) {
      alert(e.message);
    }
    setPlacing(false);
  };

  return (
    <View style={{flex:1,backgroundColor:"#F3F4F6"}}>
    <ScrollView>
      <Text style={styles.header}>Your Items ({items.length})</Text>
      {errorMsg ? <Text style={{color:"#DC2626",paddingHorizontal:14,fontWeight:"600"}}>{errorMsg}</Text> : null}
      {items.map((item,idx)=>{
        const img=item.image1?(item.image1.startsWith("http")?item.image1:getImageUrl(item.image1)):null;
        return (<View key={idx} style={styles.itemCard}>
          <View style={styles.imgBox}>{img?<Image source={{uri:img}} style={{width:"100%",height:"100%"}} resizeMode="contain"/>:<Text style={{fontSize:24}}>📱</Text>}</View>
          <View style={{flex:1}}><Text style={{fontWeight:"bold"}} numberOfLines={2}>{item.name}</Text><Text style={{color:"#666",fontSize:12}}>₹{item.price} each</Text><Text style={{fontWeight:"600"}}>₹{item.price*item.quantity}</Text>
            <View style={{flexDirection:"row",alignItems:"center",gap:12,marginTop:6}}>
              <TouchableOpacity style={styles.qtyBtn} onPress={()=>changeQty(item.id,item.quantity-1)}><Text style={{fontSize:18,fontWeight:"bold"}}>−</Text></TouchableOpacity>
              <Text style={{fontWeight:"bold",color:"#2563EB"}}>{item.quantity}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={()=>changeQty(item.id,item.quantity+1)}><Text style={{fontSize:18,fontWeight:"bold"}}>+</Text></TouchableOpacity>
            </View></View></View>);
      })}
      <View style={styles.card}><Text style={styles.title}>Delivery Details</Text>
        <Text style={styles.label}>👤 Customer</Text><Text style={styles.value}>{user?.name||"-"}</Text>
        <Text style={styles.label}>🏪 Shop Name</Text><Text style={styles.value}>{user?.shopName||"-"}</Text>
        <Text style={styles.label}>📞 Phone</Text><Text style={styles.value}>{user?.phone||"-"}</Text>
        <Text style={styles.label}>📍 Address</Text><Text style={styles.value}>{addressText}</Text>
        <Text style={styles.label}>📅 Delivery By</Text><Text style={styles.value}>{fmt(deliveryDate)}</Text>
      </View>
      <View style={styles.card}><Text style={styles.title}>Price Details</Text>
        {items.map((i,idx)=>(<View key={idx} style={styles.row}><Text>{i.name} x {i.quantity}</Text><Text>₹{i.price*i.quantity}</Text></View>))}
        <View style={styles.row}><Text>Delivery</Text><Text style={{color:"#16A34A"}}>FREE</Text></View><View style={styles.divider}/>
        <View style={styles.row}><Text style={{fontWeight:"bold"}}>Total ({totalQty} items)</Text><Text style={{fontWeight:"bold",color:"#2563EB",fontSize:18}}>₹{totalAmount}</Text></View>
      </View>
      <View style={{padding:15}}><TouchableOpacity style={styles.placeBtn} onPress={placeOrder} disabled={placing}>{placing?<ActivityIndicator color="#fff"/>:<Text style={{color:"#fff",fontWeight:"bold",fontSize:16}}>📦 Place Order - ₹{totalAmount}</Text>}</TouchableOpacity></View>
      <View style={{height:30}}/>
    </ScrollView>
    {placed && (<View style={styles.overlay}><View style={styles.successCard}><Text style={{fontSize:55}}>✅</Text><Text style={{fontSize:20,fontWeight:"bold",color:"#16A34A",textAlign:"center"}}>Order Placed Successfully!</Text>
      <Text style={{textAlign:"center",marginTop:8}}>Order ID: {placed.id}{"\n"}Delivery By: {fmt(new Date(placed.deliveryDate))}{"\n"}Total: ₹{placed.total} ({placed.totalQuantity} items)</Text>
      <TouchableOpacity style={styles.successBtn} onPress={()=>navigation.reset({index:1,routes:[{name:"Home"},{name:"Orders"}]})}><Text style={{color:"#fff",fontWeight:"bold"}}>📦 View Orders</Text></TouchableOpacity>
      <TouchableOpacity style={styles.successBtn2} onPress={()=>navigation.navigate("Home")}><Text style={{fontWeight:"bold"}}>🏠 Continue Shopping</Text></TouchableOpacity></View></View>)}
    </View>
  );
}
const styles=StyleSheet.create({header:{padding:14,fontWeight:"600",color:"#444"},itemCard:{flexDirection:"row",backgroundColor:"#fff",marginHorizontal:10,marginBottom:10,borderRadius:10,padding:12,gap:12,borderWidth:1,borderColor:"#E5E7EB"},imgBox:{width:70,height:70,backgroundColor:"#F9FAFB",borderRadius:8,justifyContent:"center",alignItems:"center",overflow:"hidden"},qtyBtn:{width:32,height:32,borderRadius:16,backgroundColor:"#F3F4F6",justifyContent:"center",alignItems:"center",borderWidth:1,borderColor:"#ccc"},card:{backgroundColor:"#fff",padding:15,margin:10,borderRadius:10},title:{fontSize:15,fontWeight:"bold",marginBottom:10},label:{fontSize:12,color:"#666",marginTop:8},value:{fontSize:14,fontWeight:"600"},row:{flexDirection:"row",justifyContent:"space-between",marginBottom:8},divider:{height:1,backgroundColor:"#E5E7EB",marginVertical:8},placeBtn:{backgroundColor:"#2563EB",padding:15,borderRadius:10,alignItems:"center"},overlay:{position:"absolute",top:0,left:0,right:0,bottom:0,backgroundColor:"rgba(0,0,0,0.6)",justifyContent:"center",alignItems:"center"},successCard:{backgroundColor:"#fff",borderRadius:16,padding:24,margin:20,alignItems:"center",width:"90%"},successBtn:{backgroundColor:"#2563EB",padding:14,borderRadius:10,alignItems:"center",marginTop:16,width:"100%"},successBtn2:{backgroundColor:"#F3F4F6",padding:14,borderRadius:10,alignItems:"center",marginTop:10,width:"100%",borderWidth:1,borderColor:"#ccc"}});