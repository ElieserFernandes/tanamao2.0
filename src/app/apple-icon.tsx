import {ImageResponse} from "next/og";
export const size={width:180,height:180};
export const contentType="image/png";
export default function AppleIcon(){return new ImageResponse(<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:"#145fbd"}}><div style={{display:"flex",fontSize:34,fontWeight:900,letterSpacing:-2,color:"#fff"}}><span>TÁNA</span><span style={{color:"#ffb22c"}}>MÃO</span></div></div>,{...size})}