import {ImageResponse} from "next/og";
export const runtime="edge";
export const alt="TÁNAMÃO — O profissional certo está na sua mão";
export const size={width:1200,height:630};
export const contentType="image/png";
export default function OpenGraphImage(){
 return new ImageResponse(
 <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"flex-start",padding:"70px 90px",background:"linear-gradient(125deg,#12478e,#1269c9)",color:"#fff"}}>
 <div style={{display:"flex",alignItems:"center",fontSize:105,fontWeight:900,letterSpacing:-5}}>
 <span>TÁNA</span><span style={{color:"#ffad24"}}>MÃO</span>
 </div>
 <div style={{height:9,width:185,background:"#ffad24",borderRadius:9,marginTop:15}}/>
 <div style={{fontSize:52,fontWeight:700,marginTop:46,maxWidth:960,lineHeight:1.15}}>O profissional certo está na sua mão.</div>
 <div style={{fontSize:29,marginTop:26,color:"#e3efff"}}>Encontre profissionais e converse pelo WhatsApp.</div>
 <div style={{position:"absolute",bottom:38,right:60,fontSize:22,color:"#e3efff"}}>tanamaopro.vercel.app</div>
 </div>,{...size});
}
