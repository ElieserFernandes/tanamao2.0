import type {MetadataRoute} from "next";
export default function manifest():MetadataRoute.Manifest{
 return {id:"/",name:"TÁNAMÃO — Encontre profissionais",short_name:"TÁNAMÃO",description:"Encontre profissionais por cidade e entre em contato pelo WhatsApp.",start_url:"/",scope:"/",display:"standalone",background_color:"#ffffff",theme_color:"#145fbd",lang:"pt-BR",icons:[{src:"/icon",sizes:"512x512",type:"image/png",purpose:"any"},{src:"/icon",sizes:"512x512",type:"image/png",purpose:"maskable"},{src:"/apple-icon",sizes:"180x180",type:"image/png"}]};
}