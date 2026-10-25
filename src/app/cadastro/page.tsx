"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";

type Profession = {id:string;name:string};
export default function Cadastro(){
 const [userId,setUserId]=useState<string|null>(null);
 const [loading,setLoading]=useState(true);
 const [name,setName]=useState("");const [professionId,setProfessionId]=useState("");
 const [professions,setProfessions]=useState<Profession[]>([]);
 const [city,setCity]=useState("");const [uf,setUf]=useState("");
 const [whatsapp,setWhatsapp]=useState("");const [bio,setBio]=useState("");
 const [message,setMessage]=useState("");const [showSuccess,setShowSuccess]=useState(false);const [busy,setBusy]=useState(false);const [loadError,setLoadError]=useState("");
 useEffect(()=>{
  let active=true;
  async function load(){
   try{
    const supabase=getSupabase();
    const {data:{user},error:userError}=await supabase.auth.getUser();
    if(userError)throw userError;
    if(!active)return;
    setUserId(user?.id??null);
    const {data:options,error:professionsError}=await supabase.from("professions").select("id,name").eq("active",true).order("name");
    if(professionsError)throw new Error("Erro ao consultar profissões: "+professionsError.message+" (código "+(professionsError.code||"indisponível")+")");
    if(active)setProfessions(options??[]);
    if(user){
     const {data:existing,error:existingError}=await supabase.from("professionals").select("display_name,profession_id,city,state_code,whatsapp,bio").eq("user_id",user.id).maybeSingle();
     if(existingError)throw new Error("Erro ao consultar seu perfil: "+existingError.message+" (código "+(existingError.code||"indisponível")+")");
     if(existing&&active){setName(existing.display_name??"");setProfessionId(existing.profession_id??"");setCity(existing.city??"");setUf(existing.state_code??"");setWhatsapp(existing.whatsapp??"");setBio(existing.bio??"");}
    }
   }catch(e){if(active)setLoadError(e instanceof Error?e.message:"Não foi possível carregar seu cadastro.")}
   finally{if(active)setLoading(false)}
  }
  void load();return()=>{active=false};
 },[]);
 async function save(e:React.FormEvent){
  e.preventDefault();if(!userId)return;
  setBusy(true);setMessage("");
  try{
   if(!professionId)throw new Error("Escolha sua profissão principal.");
   const supabase=getSupabase();
   const {data:existing,error:lookupError}=await supabase.from("professionals").select("id,slug").eq("user_id",userId).maybeSingle();
   if(lookupError)throw lookupError;
   const number=whatsapp.replace(/\D/g,"");
   if(number.length<10||number.length>13)throw new Error("Informe um WhatsApp com DDD válido.");
   const payload={user_id:userId,display_name:name.trim(),slug:existing?.slug??("profissional-"+userId.slice(0,12)),profession_id:professionId,city:city.trim(),state_code:uf.toUpperCase().trim(),whatsapp:number,bio:bio.trim(),published:false};
   if(existing){const {error}=await supabase.from("professionals").update(payload).eq("id",existing.id);if(error)throw error}
   else{const {error}=await supabase.from("professionals").insert(payload);if(error)throw error}
   setShowSuccess(true);
  }catch(e){setMessage(e instanceof Error?e.message:"Não foi possível salvar. Tente novamente.")}
  finally{setBusy(false)}
 }
 if(loading)return <main className="wrap section">Carregando cadastro...</main>;
 if(!userId)return <main className="wrap section"><h1>Divulgue seus serviços</h1><p>Entre ou crie sua conta gratuita para continuar.</p><Link className="btn" href="/entrar">Entrar ou criar conta</Link></main>;
 return <main className="wrap section" style={{maxWidth:650}}>
 <Link href="/">← Voltar ao início</Link><h1>Divulgue seus serviços</h1>
 <p className="muted">Conte um pouco sobre seu trabalho. Você poderá atualizar essas informações depois.</p>
 <form className="card" onSubmit={save} style={{display:"grid",gap:14}}>
 <label>Nome profissional<input required minLength={2} maxLength={120} value={name} onChange={e=>setName(e.target.value)} style={{display:"block",width:"100%",padding:12,marginTop:5}}/></label>
 <label>Profissão principal<select required value={professionId} onChange={e=>setProfessionId(e.target.value)} style={{display:"block",width:"100%",padding:12,marginTop:5}}><option value="">Selecione sua profissão</option>{professions.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
 <label>Cidade<input required value={city} onChange={e=>setCity(e.target.value)} style={{display:"block",width:"100%",padding:12,marginTop:5}}/></label>
 <label>Estado (UF)<input required maxLength={2} minLength={2} value={uf} onChange={e=>setUf(e.target.value)} placeholder="SP" style={{display:"block",width:"100%",padding:12,marginTop:5}}/></label>
 <label>WhatsApp com DDD<input required value={whatsapp} onChange={e=>setWhatsapp(e.target.value)} placeholder="15999999999" style={{display:"block",width:"100%",padding:12,marginTop:5}}/></label>
 <label>Sobre seu trabalho<textarea value={bio} onChange={e=>setBio(e.target.value)} rows={3} style={{display:"block",width:"100%",padding:12,marginTop:5}}/></label>
 <button className="btn" disabled={busy||professions.length===0}>{busy?"Salvando...":"Salvar cadastro"}</button>
 {professions.length===0&&<p className="muted">As profissões ainda não foram carregadas. Precisamos atualizar o banco de dados.</p>}
 {loadError&&<p role="alert" style={{color:"#a32222",overflowWrap:"anywhere"}}><strong>Problema na conexão com o banco:</strong> {loadError} <button type="button" onClick={()=>window.location.reload()} style={{textDecoration:"underline",marginLeft:8}}>Tentar novamente</button></p>}{message&&<p role="alert">{message}</p>}
 </form>{showSuccess&&<div role="presentation" style={{position:"fixed",inset:0,background:"rgba(10,23,43,.6)",display:"grid",placeItems:"center",zIndex:1000,padding:20}} onClick={()=>setShowSuccess(false)}><div role="dialog" aria-modal="true" aria-labelledby="success-title" onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:22,padding:"32px 26px",maxWidth:420,width:"100%",textAlign:"center",boxShadow:"0 20px 60px rgba(0,0,0,.25)",position:"relative"}}><button type="button" aria-label="Fechar" onClick={()=>setShowSuccess(false)} style={{position:"absolute",right:16,top:12,fontSize:26,color:"#64748b",background:"none",border:0,cursor:"pointer"}}>×</button><div aria-hidden="true" style={{width:76,height:76,background:"#16a34a",borderRadius:"50%",color:"white",display:"grid",placeItems:"center",fontSize:48,fontWeight:700,margin:"0 auto 20px"}}>✓</div><h2 id="success-title" style={{fontSize:26,marginBottom:12}}>Cadastro salvo com sucesso!</h2><p style={{color:"#52647c",lineHeight:1.6,marginBottom:24}}>Seu perfil está em rascunho e ainda não aparece nas buscas.</p><button type="button" className="btn" onClick={()=>setShowSuccess(false)} style={{width:"100%"}}>OK</button></div></div>}</main>;
}
