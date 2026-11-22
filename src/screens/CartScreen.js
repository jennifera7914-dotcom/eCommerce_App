import React, { useState } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useShop } from "../context/ShopContext";
import { getImageUrl } from "../../constants/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function CartScreen({ navigation }) {
  const { cart, changeQuantity, removeFromCart, getCartTotal } = useShop();
  const [itemToRemove, setItemToRemove] = useState(null);
  const [toast, setToast] = useState("");
  const total = getCartTotal();

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };
  const confirmRemove = () => { if (!itemToRemove) return; removeFromCart(itemToRemove.id); setItemToRemove(null); showToast("Removed from cart"); };

  const addWishlist = async (item) => {
    const stored = await AsyncStorage.getItem("wishlist");
    const list = stored ? JSON.parse(stored) : [];
    const id = item.productId || item.id;
    if (list.find((w) => w.id === id)) { showToast("Already in Wishlist ❤️"); return; }
    list.push({ id, name: item.name, price: item.price, mrp: item.mrp, image1: item.image1, brand: item.brand, category: item.category });
    await AsyncStorage.setItem("wishlist", JSON.stringify(list));
    showToast("Added to Wishlist ❤️");
  };

  if (cart.length === 0) return (
    <View style={styles.center}><Text style={{fontSize:50}}>🛒</Text><Text style={styles.emptyTitle}>Your Cart is Empty</Text>
    <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate("Home")}><Text style={styles.shopBtnText}>Start Shopping</Text></TouchableOpacity></View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <Text style={styles.header}>{cart.length} item(s) in cart</Text>
        {cart.map((item, index) => {
          const id = item.productId || item.id;
          const rawImg = item.image1 || item.image || item.imageUrl || null;
const imgUri = rawImg ? (rawImg.startsWith("http") ? rawImg : getImageUrl(rawImg)) : null;
          return (
            <View key={index} style={styles.itemCard}>
              <View style={styles.imageBox}>{imgUri ? <Image source={{uri:imgUri}} style={styles.image} resizeMode="contain"/> : <View style={styles.noImage}><Text style={{fontSize:22}}>📱</Text></View>}</View>
              <View style={{flex:1}}>
                <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.itemPrice}>₹{item.price} each</Text>
                <Text style={styles.itemTotal}>Total: ₹{(item.price||0)*item.quantity}</Text>
                <View style={styles.qtyRow}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => item.quantity<=1 ? setItemToRemove({id, name:item.name}) : changeQuantity(id, item.quantity-1)}><Text style={styles.qtyBtnText}>−</Text></TouchableOpacity>
                  <Text style={styles.qtyValue}>{item.quantity}</Text>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => changeQuantity(id, item.quantity+1)}><Text style={styles.qtyBtnText}>+</Text></TouchableOpacity>
                  <TouchableOpacity style={{marginLeft:"auto",padding:4}} onPress={() => addWishlist(item)}><Text style={{fontSize:20}}>🤍</Text></TouchableOpacity>
                  <TouchableOpacity style={{padding:4}} onPress={() => setItemToRemove({id, name:item.name})}><Text style={{fontSize:20}}>🗑️</Text></TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}
        <View style={styles.summaryCard}><Text style={styles.summaryTitle}>Price Details</Text>
          <View style={styles.row}><Text>Total MRP</Text><Text style={{fontWeight:"700"}}>₹{total}</Text></View>
          <View style={styles.row}><Text>Delivery</Text><Text style={{color:"#16A34A",fontWeight:"700"}}>FREE</Text></View>
          <View style={styles.divider}/><View style={styles.row}><Text style={{fontWeight:"bold"}}>Total Amount</Text><Text style={{fontWeight:"bold",color:"#2563EB",fontSize:18}}>₹{total}</Text></View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}><View><Text style={{fontSize:12,color:"#666"}}>Total</Text><Text style={{fontSize:20,fontWeight:"bold",color:"#2563EB"}}>₹{total}</Text></View>
        <TouchableOpacity style={styles.buyBtn} onPress={() => navigation.navigate("BuyScreen", { items: cart, source:"cart" })}><Text style={{color:"#fff",fontWeight:"bold"}}>⚡ Buy Now ({cart.length})</Text></TouchableOpacity>
      </View>

      {toast ? <View style={styles.toast}><Text style={{color:"#fff",fontWeight:"600"}}>{toast}</Text></View> : null}

      {itemToRemove && (
        <View style={styles.overlay}><View style={styles.modalCard}>
          <Text style={{fontSize:45}}>🗑️</Text>
          <Text style={styles.modalTitle}>Remove Item?</Text>
          <Text style={styles.modalText}>Remove "{itemToRemove.name}" from your cart?</Text>
          <TouchableOpacity style={styles.removeBtn} onPress={confirmRemove}><Text style={{color:"#fff",fontWeight:"bold"}}>Yes, Remove</Text></TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setItemToRemove(null)}><Text style={{fontWeight:"bold"}}>Cancel</Text></TouchableOpacity>
        </View></View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:"#F3F4F6"}, center:{flex:1,justifyContent:"center",alignItems:"center",backgroundColor:"#F3F4F6"}, emptyTitle:{fontSize:18,fontWeight:"bold",marginTop:12}, shopBtn:{backgroundColor:"#2563EB",paddingHorizontal:24,paddingVertical:12,borderRadius:8,marginTop:16}, shopBtnText:{color:"#fff",fontWeight:"bold"},
  header:{fontSize:14,fontWeight:"600",color:"#4B5563",padding:14}, itemCard:{flexDirection:"row",backgroundColor:"#fff",marginHorizontal:10,marginBottom:10,borderRadius:10,padding:12,gap:12,borderWidth:1,borderColor:"#E5E7EB"},
  imageBox:{width:70,height:70,borderRadius:8,backgroundColor:"#F9FAFB",overflow:"hidden"}, image:{width:"100%",height:"100%"}, noImage:{flex:1,justifyContent:"center",alignItems:"center"},
  itemName:{fontSize:14,fontWeight:"bold"}, itemPrice:{fontSize:12,color:"#666",marginTop:2}, itemTotal:{fontSize:13,fontWeight:"600",marginTop:2},
  qtyRow:{flexDirection:"row",alignItems:"center",marginTop:8,gap:6}, qtyBtn:{width:32,height:32,borderRadius:16,backgroundColor:"#F3F4F6",justifyContent:"center",alignItems:"center",borderWidth:1,borderColor:"#D1D5DB"}, qtyBtnText:{fontSize:18,fontWeight:"bold"}, qtyValue:{fontSize:16,fontWeight:"bold",color:"#2563EB",minWidth:30,textAlign:"center"},
  summaryCard:{backgroundColor:"#fff",margin:10,borderRadius:10,padding:15,borderWidth:1,borderColor:"#E5E7EB"}, summaryTitle:{fontSize:15,fontWeight:"bold",marginBottom:12}, row:{flexDirection:"row",justifyContent:"space-between",marginBottom:8}, divider:{height:1,backgroundColor:"#E5E7EB",marginVertical:8},
  bottomBar:{position:"absolute",bottom:0,left:0,right:0,flexDirection:"row",justifyContent:"space-between",alignItems:"center",backgroundColor:"#fff",padding:15,borderTopWidth:1,borderColor:"#E5E7EB"}, buyBtn:{backgroundColor:"#2563EB",paddingHorizontal:24,paddingVertical:14,borderRadius:10},
  toast:{position:"absolute",bottom:90,left:20,right:20,backgroundColor:"#111827",padding:12,borderRadius:8,alignItems:"center",zIndex:999},
  overlay:{position:"absolute",top:0,left:0,right:0,bottom:0,backgroundColor:"rgba(0,0,0,0.6)",justifyContent:"center",alignItems:"center",zIndex:1000}, modalCard:{backgroundColor:"#fff",borderRadius:16,padding:24,alignItems:"center",width:"88%"}, modalTitle:{fontSize:20,fontWeight:"bold",marginTop:10}, modalText:{textAlign:"center",color:"#555",marginTop:8,lineHeight:20}, removeBtn:{backgroundColor:"#DC2626",padding:14,borderRadius:10,alignItems:"center",marginTop:18,width:"100%"}, cancelBtn:{backgroundColor:"#F3F4F6",padding:14,borderRadius:10,alignItems:"center",marginTop:10,width:"100%",borderWidth:1,borderColor:"#ccc"}
});